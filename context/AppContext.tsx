import React, {
  createContext, useContext, useState, useEffect, useRef,
  useMemo, useCallback, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  fetchMoodLogs, upsertMoodLog,
  fetchJournalEntries, insertJournalEntry, updateJournalEntryDB, deleteJournalEntryDB,
  fetchFavourites, upsertFavouriteDB, deleteFavouriteDB,
  insertGamePlay,
  insertWellnessSession,
  fetchCelebratedMilestones, insertMilestone,
} from '@/lib/supabaseData';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  mood: number;
  goals: string[];
  time: string;
  experience: string;
  onboardingComplete: boolean;
  avatar?: string;
  plan: 'free' | 'premium';
}

export interface MoodLog {
  date: string;
  mood: number;
  timestamp: number;
}

export type JournalMood = 'calm' | 'focused' | 'anxious' | 'tired' | 'energized';

export interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  promptCategory: string;
  text: string;
  mood: JournalMood;
  timestamp: number;
  starred: boolean;
  title?: string;
  tags?: string[];
}

export interface FavouriteItem {
  id: string;
  type: 'game' | 'breathe' | 'sleep' | 'music' | 'journal';
  title: string;
  subtitle?: string;
  category?: string;
  color?: string;
  icon?: string;
  iconSet?: string;
}

export interface GameStat {
  gameId: string;
  plays: number;
  bestScore: number;
  lastPlayed: string;
}

interface AppContextValue {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  favourites: FavouriteItem[];
  toggleFavourite: (item: FavouriteItem) => void;
  isFavourite: (id: string) => boolean;
  streak: number;
  longestStreak: number;
  moodLogs: MoodLog[];
  logMood: (mood: number) => void;
  todaysMood: number | null;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, partial: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  gameStats: GameStat[];
  recordGamePlay: (gameId: string, score: number, difficulty?: string, durationSeconds?: number) => void;
  wellnessMinutes: number;
  addWellnessMinutes: (mins: number) => void;
  logWellnessSession: (
    sessionType: string,
    contentId: string,
    contentTitle: string,
    durationSeconds: number,
  ) => void;
  celebratedMilestones: string[];
  addCelebratedMilestone: (id: string) => void;
  isLoaded: boolean;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  totalWellnessLogs: number;
  clearAllData: () => Promise<void>;
  signOut: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const THEME_KEY = 'manas_theme';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcStreak(logs: MoodLog[]): { streak: number; longest: number } {
  if (!logs.length) return { streak: 0, longest: 0 };
  const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
  let streak = 0, longest = 0, curr = 0;
  const today = getTodayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 && dates[0] !== today && dates[0] !== yesterday) break;
    if (i === 0) {
      curr = 1;
    } else {
      const diff = (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
      if (Math.round(diff) === 1) { curr++; }
      else { if (curr > longest) longest = curr; curr = 1; }
    }
  }
  if (curr > longest) longest = curr;
  if (dates[0] === today || dates[0] === yesterday) streak = curr;
  return { streak, longest };
}

// ─── Context ───────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [wellnessMinutes, setWellnessMinutes] = useState(0);
  const [celebratedMilestones, setCelebratedMilestones] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  // Track current user id for Supabase calls
  const userIdRef = useRef<string | null>(null);

  // ── Load theme from AsyncStorage (device-level) ─────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(v => {
      if (v === 'dark' || v === 'light') setThemeState(v);
    });
  }, []);

  // ── Load all Supabase data for a given user ──────────────────────────────
  // Uses Promise.allSettled so a single fetch failure never wipes all data.
  const loadUserData = useCallback(async (uid: string) => {
    userIdRef.current = uid;
    const [moodsR, journalsR, favsR, milestonesR] = await Promise.allSettled([
      fetchMoodLogs(uid),
      fetchJournalEntries(uid),
      fetchFavourites(uid),
      fetchCelebratedMilestones(uid),
    ]);
    if (moodsR.status === 'fulfilled') setMoodLogs(moodsR.value);
    if (journalsR.status === 'fulfilled') setJournalEntries(journalsR.value);
    if (favsR.status === 'fulfilled') setFavourites(favsR.value);
    if (milestonesR.status === 'fulfilled') setCelebratedMilestones(milestonesR.value);
    setIsLoaded(true);
  }, []);

  // ── Clear all user data on sign-out ─────────────────────────────────────
  const clearUserData = useCallback(() => {
    userIdRef.current = null;
    setUserState(null);
    setFavourites([]);
    setMoodLogs([]);
    setJournalEntries([]);
    setGameStats([]);
    setWellnessMinutes(0);
    setCelebratedMilestones([]);
  }, []);

  // ── Auth state listener ──────────────────────────────────────────────────
  useEffect(() => {
    // Check existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user?.id) {
          loadUserData(session.user.id);
        } else {
          setIsLoaded(true);
        }
      })
      .catch(() => setIsLoaded(true));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      if (uid && uid !== userIdRef.current) {
        loadUserData(uid);
      } else if (!uid) {
        clearUserData();
        setIsLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, clearUserData]);

  // ─── User / Profile ────────────────────────────────────────────────────

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
  }, []);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUserState(prev => prev ? { ...prev, ...partial } : prev);
  }, []);

  // ─── Theme ─────────────────────────────────────────────────────────────

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    AsyncStorage.setItem(THEME_KEY, t);
    // Also persist to Supabase profile if authenticated
    const uid = userIdRef.current;
    if (uid) {
      supabase.from('profiles').update({ theme: t }).eq('id', uid).then(() => {});
    }
  }, []);

  // ─── Mood Logs ─────────────────────────────────────────────────────────

  const logMood = useCallback((mood: number) => {
    const today = getTodayStr();
    setMoodLogs(prev => {
      const filtered = prev.filter(l => l.date !== today);
      return [...filtered, { date: today, mood, timestamp: Date.now() }].sort(
        (a, b) => b.date.localeCompare(a.date),
      );
    });
    const uid = userIdRef.current;
    if (uid) upsertMoodLog(uid, today, mood);
  }, []);

  const todaysMood = useMemo(() => moodLogs.find(l => l.date === getTodayStr())?.mood ?? null, [moodLogs]);
  const { streak, longest: longestStreak } = useMemo(() => calcStreak(moodLogs), [moodLogs]);

  // ─── Journal Entries ───────────────────────────────────────────────────

  const addJournalEntry = useCallback((entry: JournalEntry) => {
    setJournalEntries(prev => [entry, ...prev]);
    const uid = userIdRef.current;
    if (uid) insertJournalEntry(uid, entry);
  }, []);

  const updateJournalEntry = useCallback((id: string, partial: Partial<JournalEntry>) => {
    setJournalEntries(prev => prev.map(e => e.id === id ? { ...e, ...partial } : e));
    updateJournalEntryDB(id, partial);
  }, []);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
    deleteJournalEntryDB(id);
  }, []);

  // ─── Favourites ────────────────────────────────────────────────────────

  const toggleFavourite = useCallback((item: FavouriteItem) => {
    const uid = userIdRef.current;
    setFavourites(prev => {
      const exists = prev.find(f => f.id === item.id && f.type === item.type);
      if (exists) {
        if (uid) deleteFavouriteDB(uid, item.type, item.id);
        return prev.filter(f => !(f.id === item.id && f.type === item.type));
      }
      if (uid) upsertFavouriteDB(uid, item);
      return [item, ...prev];
    });
  }, []);

  const isFavourite = useCallback((id: string) => favourites.some(f => f.id === id), [favourites]);

  // ─── Game Plays ────────────────────────────────────────────────────────

  const recordGamePlay = useCallback((gameId: string, score: number, difficulty = 'medium', durationSeconds = 0) => {
    setGameStats(prev => {
      const existing = prev.find(s => s.gameId === gameId);
      if (existing) {
        return prev.map(s => s.gameId === gameId ? {
          ...s,
          plays: s.plays + 1,
          bestScore: Math.max(s.bestScore, score),
          lastPlayed: getTodayStr(),
        } : s);
      }
      return [...prev, { gameId, plays: 1, bestScore: score, lastPlayed: getTodayStr() }];
    });
    const uid = userIdRef.current;
    if (uid) insertGamePlay(uid, gameId, score, difficulty, durationSeconds);
  }, []);

  // ─── Wellness ──────────────────────────────────────────────────────────

  const addWellnessMinutes = useCallback((mins: number) => {
    setWellnessMinutes(prev => prev + mins);
  }, []);

  const logWellnessSession = useCallback((
    sessionType: string,
    contentId: string,
    contentTitle: string,
    durationSeconds: number,
  ) => {
    setWellnessMinutes(prev => prev + Math.round(durationSeconds / 60));
    const uid = userIdRef.current;
    if (uid) insertWellnessSession(uid, sessionType, contentId, contentTitle, durationSeconds);
  }, []);

  // ─── Milestones ────────────────────────────────────────────────────────

  const addCelebratedMilestone = useCallback((id: string) => {
    setCelebratedMilestones(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      const uid = userIdRef.current;
      if (uid) insertMilestone(uid, id);
      return updated;
    });
  }, []);

  // ─── Misc ──────────────────────────────────────────────────────────────

  const totalWellnessLogs = useMemo(() => {
    return moodLogs.length
      + journalEntries.length
      + gameStats.reduce((sum, s) => sum + s.plays, 0);
  }, [moodLogs, journalEntries, gameStats]);

  const clearAllData = useCallback(async () => {
    clearUserData();
    setIsLoaded(true);
    await AsyncStorage.removeItem(THEME_KEY);
  }, [clearUserData]);

  const signOut = useCallback(() => {
    clearUserData();
    supabase.auth.signOut().catch(() => {});
  }, [clearUserData]);

  const value = useMemo<AppContextValue>(() => ({
    user, setUser, updateUser,
    favourites, toggleFavourite, isFavourite,
    streak, longestStreak, moodLogs, logMood, todaysMood,
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    gameStats, recordGamePlay,
    wellnessMinutes, addWellnessMinutes, logWellnessSession,
    celebratedMilestones, addCelebratedMilestone,
    isLoaded,
    theme, setTheme, totalWellnessLogs,
    clearAllData, signOut,
  }), [
    user, setUser, updateUser,
    favourites, toggleFavourite, isFavourite,
    streak, longestStreak, moodLogs, logMood, todaysMood,
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    gameStats, recordGamePlay,
    wellnessMinutes, addWellnessMinutes, logWellnessSession,
    celebratedMilestones, addCelebratedMilestone,
    isLoaded,
    theme, setTheme, totalWellnessLogs,
    clearAllData, signOut,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
