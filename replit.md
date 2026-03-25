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
- **State management**: React Context (`AppContext`) backed by `AsyncStorage` for local persistence. Tracks user profile, mood logs, journal entries, game stats, favourites, streaks, wellness minutes, theme preference (`'dark'|'light'`), and exposes `totalWellnessLogs`, `clearAllData`, `signOut`. `AuthContext` manages Supabase session state (separate from AppContext)
- **Data fetching**: TanStack React Query (`@tanstack/react-query`) with a custom `queryClient` configured to talk to the Express backend via `EXPO_PUBLIC_DOMAIN`
- **Animations**: React Native Reanimated v4 for gestures, transitions, breathing orbs, and micro-interactions. React Native Gesture Handler for swipe/pan interactions
- **Styling**: `StyleSheet` with theming support — `constants/colors.ts` exports `DARK` and `LIGHT` palettes plus a `useColors()` hook. The palette includes the main app tokens (lavender/sage/gold) AND journal-specific stone/ink/gold/sage/ember tokens prefixed with `j` (`jStone`, `jCard`, `jInk`, `jInkMuted`, `jInkFaint`, `jGold`, `jGoldLight`, `jSage`, `jSageLight`, `jEmber`, `jEmberLight`, `jQuoteCard`, `jBorderFaint`, `jStoneAlt`)
- **Typography**: Inter font family via `@expo-google-fonts/inter`; Lora via `@expo-google-fonts/lora`; Cormorant Garamond via `@expo-google-fonts/cormorant-garamond` (weights: 300Light, 300Light_Italic, 400Regular, 400Regular_Italic — used in the journal redesign for serif display text)
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

### Onboarding & Auth Flow

- On app load, `AuthContext` checks the Supabase session via `supabase.auth.getSession()`
- If no Supabase session → user is redirected to `/login` (email/password auth screen)
- Login screen is pre-filled with test credentials (`testyz@gmail.com` / `12345`)
- Test user is auto-provisioned on login screen mount via `signUp` (silently handles "already exists")
- After login → PIN screen shows (dev security gate, code `1107`) → intro video → tabs
- If `user.onboardingComplete` is false, onboarding runs first
- Onboarding collects: mood baseline, goals (multi-select), preferred wellness time, meditation experience, and name
- After onboarding, the user is routed to `/(tabs)` permanently

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
| `@supabase/supabase-js` | Supabase client for authentication and data sync |

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required for backend/Drizzle)
- `EXPO_PUBLIC_DOMAIN` — The public domain used by the Expo app to reach the Express API (set automatically in Replit via `REPLIT_DEV_DOMAIN`)
- `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` — Used by the Express CORS middleware and build scripts to configure allowed origins
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (secret, already configured)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key (secret, already configured)
- `DEV_PIN` — 4-digit PIN for the dev security gate (currently `1107`, stored as env var)