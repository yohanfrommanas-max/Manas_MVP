# Manas — Mental Wellness App

## Overview

Manas (Sanskrit for "mind/soul") is a premium mobile wellness app built with React Native and Expo. It targets iOS, Android, and web platforms from a single codebase. The app has three core pillars:

1. **Focus** — Brain training cognitive games (Signal Spotter, Story Recall, Code Cracker, etc.)
2. **Calm** — Guided breathwork, sleep soundscapes, and curated ambient music
3. **Journal** — Daily mood tracking, guided prompts, and personal reflection entries

The app starts with an onboarding flow (feature flashcards + a 5-step personalization quiz), then routes into a 5-tab main interface: Home, Explore, Favourites, Progress, and Profile.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend (React Native / Expo)

- **Framework**: Expo SDK ~54 with Expo Router v6 for file-based navigation
- **Navigation structure**:
  - `app/_layout.tsx` — Root layout, handles auth/onboarding redirect logic
  - `app/(tabs)/` — Main tab group: `index`, `explore`, `favourites`, `progress`, `profile`
  - `app/onboarding.tsx` — First-launch flashcard + quiz flow
  - `app/game/[id].tsx` — Dynamic game screen
  - `app/breathe/[id].tsx` — Dynamic breathwork session screen
  - `app/sleep.tsx`, `app/music.tsx` (full music player with 4-tab UI, mini player, now playing, sleep timer), `app/journal.tsx` — Feature screens
  - `app/journal/new.tsx` — New journal entry screen (accepts `prompt`, `promptCategory`, `imageAsset`, `promptless` navigation params)
  - `app/journal/[id].tsx` — Journal entry detail view (full text, mood, prompt, cognitive score bar)
  - `app/journal/prompt-bank.tsx` — Browsable prompt grid with category filter pills and 2-column alternating-height image cards
  - `app/journal/prompt-detail.tsx` — Full-screen prompt detail with ImageBackground header, "WHY THIS PROMPT" reflection text, and "Start writing" CTA
  - `app/legal/_layout.tsx` + `app/legal/[slug].tsx` — Legal/support stack with dynamic content screens (about, privacy, terms, data, help, contact, bug, rate)
- **State management**: React Context (`AppContext`) backed by `AsyncStorage` for local persistence. Tracks user profile, mood logs, journal entries, game stats, favourites, streaks, wellness minutes, theme preference (`'dark'|'light'`), and exposes `totalWellnessLogs`, `clearAllData`, `signOut`
- **Data fetching**: TanStack React Query (`@tanstack/react-query`) with a custom `queryClient` configured to talk to the Express backend via `EXPO_PUBLIC_DOMAIN`
- **Animations**: React Native Reanimated v4 for gestures, transitions, breathing orbs, and micro-interactions. React Native Gesture Handler for swipe/pan interactions
- **Styling**: `StyleSheet` with theming support — `constants/colors.ts` exports `DARK` and `LIGHT` palettes plus a `useColors()` hook that reads the active theme from `AppContext`. Static `C = DARK` export provides backward compat for module-level `StyleSheet.create`. Dark theme: `#0D0F14` background, lavender/sage/gold accent system. Light theme: `#F5F3FF` warm off-white lavender-tinted background
- **Typography**: Inter font family via `@expo-google-fonts/inter`
- **Audio**: Custom `useAmbientAudio` hook using the Web Audio API (`AudioContext`) to procedurally generate ambient sounds (white/pink/brown noise, oscillators) — no audio files needed
- **Platform differences**: iOS uses `NativeTabs` with SF Symbols and Liquid Glass if available; Android/web falls back to classic `Tabs` with `BlurView` or solid backgrounds

### Backend (Express)

- **Framework**: Express 5 (`server/index.ts`)
- **Routes**: Registered via `server/routes.ts` — currently only `POST /api/pin/verify` for PIN authentication
- **Storage**: `server/storage.ts` provides a `MemStorage` class (in-memory) implementing a `IStorage` interface with basic user CRUD. Designed to be swapped for a database-backed implementation
- **CORS**: Custom middleware allows requests from Replit dev/deployment domains and localhost

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts` points to `DATABASE_URL`)
- **Schema** (`shared/schema.ts`): Currently defines a `users` table with `id` (UUID), `username`, and `password`. Validation via `drizzle-zod`
- **Migrations**: Output to `./migrations/` via `drizzle-kit push`
- **Note**: The database schema is minimal/starter. The main user data (profile, mood, journal, games) is stored client-side in AsyncStorage, not in the database yet

### Supabase Auth & Database

- **Client**: `lib/supabase.ts` — `createClient` with `AsyncStorage` session persistence (native) / localStorage (web)
- **Auth context**: `context/AuthContext.tsx` — manages `session`, `profile` (from `profiles` table), `authLoading`; exposes `signIn`, `signUp`, `signOut`, `fetchProfile`, `updateProfile`
- **Env vars** (Replit secrets): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Profile trigger**: Supabase auto-creates a `profiles` row on signup via a DB trigger (`handle_new_user`)
- **Mood logs hook**: `hooks/useMoodLogs.ts` — fetches and upserts to Supabase `mood_logs` table (UNIQUE on `user_id, date`)

### Onboarding & Auth Flow

- **Full flow**: PIN → intro video (first time only) → onboarding flashcards → `/login` → quiz → `/(tabs)`
- **`manas:hasSeenIntro`** (AsyncStorage) — tracks whether intro video/flashcards have been seen; returning users skip to `/login` or `/(tabs)` directly
- **`_layout.tsx` routing logic**: After PIN, checks `hasSeenIntro` + Supabase `session` + `profile.onboarding_complete` to decide destination
- Onboarding flashcards navigate to `/login` on last card (instead of proceeding to quiz inline)
- After login/signup, the app checks `profile.onboarding_complete`; if false → `onboarding?phase=quiz`; if true → `/(tabs)`
- Quiz completion writes to both `AppContext` (AsyncStorage fallback) and Supabase `profiles` table
- `app/login.tsx` — email/password form; prefilled with test credentials; handles signIn + signUp flows
- Sign out (profile tab, legal screen) calls both AppContext `signOut` (clears AsyncStorage) and `supabase.auth.signOut()`
- **AsyncStorage** kept as fallback — not yet removed

### Premium / Free Plan

- `UserProfile.plan` field is either `'free'` or `'premium'`
- Certain games, sleep sounds (`delta`), and music playlists (`golden`) are marked `premium: true`
- A `PremiumModal` in the profile tab presents upgrade options (no payment integration yet)

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| `expo-router` | File-based navigation for React Native + web |
| `expo-blur` | BlurView for tab bar on iOS |
| `expo-glass-effect` | Liquid Glass tab bar on supported iOS versions |
| `expo-linear-gradient` | Gradient backgrounds on all screens |
| `expo-haptics` | Tactile feedback on button presses |
| `expo-image-picker` | Profile avatar selection |
| `expo-location` | Available but not yet actively used |
| `expo-splash-screen` | Splash screen control during font/data loading |
| `react-native-reanimated` | Animations (breathing orbs, transitions, game elements) |
| `react-native-gesture-handler` | Swipe and pan gesture support |
| `react-native-keyboard-controller` | Keyboard-aware scroll views |
| `react-native-safe-area-context` | Safe area insets across platforms |
| `react-native-svg` | SVG support (available, used for potential charts) |
| `@tanstack/react-query` | Server state management and API data fetching |
| `@react-native-async-storage/async-storage` | Local persistence for user profile and app state |
| `drizzle-orm` + `pg` | PostgreSQL ORM for backend data layer |
| `drizzle-zod` | Schema validation bridging Drizzle and Zod |
| `express` | Backend API server |
| `http-proxy-middleware` | Proxy support in development |
| `@expo-google-fonts/inter` | Inter typeface for consistent typography |
| `@expo-google-fonts/lora` | Lora typeface for journal prompts and entry text |
| `@expo/vector-icons` (Ionicons, Feather) | Icons throughout the app |

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required for backend/Drizzle)
- `EXPO_PUBLIC_DOMAIN` — The public domain used by the Expo app to reach the Express API (set automatically in Replit via `REPLIT_DEV_DOMAIN`)
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` — Used by the Express CORS middleware and build scripts to configure allowed origins