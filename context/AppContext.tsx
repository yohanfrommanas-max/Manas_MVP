import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { signOutRegistry } from '@/lib/sign-out-registry';

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

export type JournalMood =
  | 'calm'
  | 'grateful'
  | 'restless'
  | 'driven'
  | 'heavy'
  | 'reflective'
  | 'anxious';

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

const OLD_TO_NEW_MOOD: Record<string, JournalMood> = {
  focused: 'driven',
  tired: 'heavy',
  energized: 'driven',
  anxious: 'anxious',
  calm: 'calm',
};

const VALID_MOODS = new Set<string>([
  'calm', 'grateful', 'restless', 'driven', 'heavy', 'reflective', 'anxious',
]);

const MOOD_NUMERIC_MAP: Record<number, JournalMood> = {
  1: 'heavy',
  2: 'anxious',
  3: 'calm',
  4: 'driven',
  5: 'grateful',
};

function migrateEntry(raw: any): JournalEntry {
  const moodRaw = raw.mood;
  let mood: JournalMood;
  if (typeof moodRaw === 'string' && VALID_MOODS.has(moodRaw)) {
    mood = moodRaw as JournalMood;
  } else if (typeof moodRaw === 'string' && OLD_TO_NEW_MOOD[moodRaw]) {
    mood = OLD_TO_NEW_MOOD[moodRaw];
  } else if (typeof moodRaw === 'number' && MOOD_NUMERIC_MAP[moodRaw]) {
    mood = MOOD_NUMERIC_MAP[moodRaw];
  } else {
    mood = 'calm';
  }
  return {
    id: raw.id ?? String(Date.now()),
    date: raw.date ?? new Date().toISOString().split('T')[0],
    prompt: raw.prompt ?? '',
    promptCategory: raw.promptCategory ?? '',
    text: raw.text ?? raw.content ?? '',
    mood,
    timestamp: raw.timestamp ?? Date.now(),
    starred: raw.starred ?? false,
    title: raw.title ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
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
  recordGamePlay: (gameId: string, score: number) => void;
  wellnessMinutes: number;
  addWellnessMinutes: (mins: number) => void;
  celebratedMilestones: string[];
  addCelebratedMilestone: (id: string) => void;
  isLoaded: boolean;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  totalWellnessLogs: number;
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = 'manas_app_data';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcStreak(logs: MoodLog[]): { streak: number; longest: number } {
  if (!logs.length) return { streak: 0, longest: 0 };
  const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
  let streak = 0;
  let longest = 0;
  let curr = 0;
  const today = getTodayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 && dates[0] !== today && dates[0] !== yesterday) break;
    if (i === 0) { curr = 1; }
    else {
      const prev = new Date(dates[i - 1]);
      const cur = new Date(dates[i]);
      const diff = (prev.getTime() - cur.getTime()) / 86400000;
      if (Math.round(diff) === 1) { curr++; }
      else { if (curr > longest) longest = curr; curr = 1; }
    }
  }
  if (curr > longest) longest = curr;
  if (dates[0] === today || dates[0] === yesterday) streak = curr;
  return { streak, longest };
}

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

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.user) setUserState(data.user);
          if (data.favourites) setFavourites(data.favourites);
          if (data.moodLogs) setMoodLogs(data.moodLogs);
          if (data.journalEntries) setJournalEntries((data.journalEntries as any[]).map(migrateEntry));
          if (data.gameStats) setGameStats(data.gameStats);
          if (data.wellnessMinutes) setWellnessMinutes(data.wellnessMinutes);
          if (data.celebratedMilestones) setCelebratedMilestones(data.celebratedMilestones);
          if (data.theme) setThemeState(data.theme);
        }
      } catch (_) {}
      setIsLoaded(true);
    })();
  }, []);

  const persist = async (updates: Partial<{
    user: UserProfile | null;
    favourites: FavouriteItem[];
    moodLogs: MoodLog[];
    journalEntries: JournalEntry[];
    gameStats: GameStat[];
    wellnessMinutes: number;
    celebratedMilestones: string[];
    theme: 'dark' | 'light';
  }>) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...updates }));
    } catch (_) {}
  };

  const setUser = (u: UserProfile) => {
    setUserState(u);
    persist({ user: u });
  };

  const updateUser = (partial: Partial<UserProfile>) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      persist({ user: updated });
      return updated;
    });
  };

  const toggleFavourite = (item: FavouriteItem) => {
    setFavourites(prev => {
      const exists = prev.find(f => f.id === item.id);
      const updated = exists ? prev.filter(f => f.id !== item.id) : [...prev, item];
      persist({ favourites: updated });
      return updated;
    });
  };

  const isFavourite = (id: string) => favourites.some(f => f.id === id);

  const logMood = (mood: number) => {
    const today = getTodayStr();
    setMoodLogs(prev => {
      const filtered = prev.filter(l => l.date !== today);
      const updated = [...filtered, { date: today, mood, timestamp: Date.now() }];
      persist({ moodLogs: updated });
      return updated;
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from('mood_logs')
        .upsert(
          { user_id: session.user.id, logged_date: today, mood },
          { onConflict: 'user_id,logged_date' },
        )
        .then(() => {});
    }).catch(() => {});
  };

  const todaysMood = moodLogs.find(l => l.date === getTodayStr())?.mood ?? null;
  const { streak, longest: longestStreak } = calcStreak(moodLogs);

  const addJournalEntry = (entry: JournalEntry) => {
    setJournalEntries(prev => {
      const updated = [entry, ...prev];
      persist({ journalEntries: updated });
      return updated;
    });
  };

  const updateJournalEntry = (id: string, partial: Partial<JournalEntry>) => {
    setJournalEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...partial } : e);
      persist({ journalEntries: updated });
      return updated;
    });
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      persist({ journalEntries: updated });
      return updated;
    });
  };

  const recordGamePlay = (gameId: string, score: number) => {
    setGameStats(prev => {
      const existing = prev.find(s => s.gameId === gameId);
      let updated: GameStat[];
      if (existing) {
        updated = prev.map(s => s.gameId === gameId ? {
          ...s,
          plays: s.plays + 1,
          bestScore: Math.max(s.bestScore, score),
          lastPlayed: getTodayStr(),
        } : s);
      } else {
        updated = [...prev, { gameId, plays: 1, bestScore: score, lastPlayed: getTodayStr() }];
      }
      persist({ gameStats: updated });
      return updated;
    });
  };

  const addWellnessMinutes = (mins: number) => {
    setWellnessMinutes(prev => {
      const updated = prev + mins;
      persist({ wellnessMinutes: updated });
      return updated;
    });
  };

  const addCelebratedMilestone = (id: string) => {
    setCelebratedMilestones(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      persist({ celebratedMilestones: updated });
      return updated;
    });
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    persist({ theme: t });
  };

  const totalWellnessLogs = useMemo(() => {
    return moodLogs.length +
      journalEntries.length +
      gameStats.reduce((sum, s) => sum + s.plays, 0);
  }, [moodLogs, journalEntries, gameStats]);

  const clearAllData = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUserState(null);
    setFavourites([]);
    setMoodLogs([]);
    setJournalEntries([]);
    setGameStats([]);
    setWellnessMinutes(0);
    setCelebratedMilestones([]);
    setThemeState('dark');
  };

  useEffect(() => {
    signOutRegistry.register(clearAllData);
  }, []);

  const value = useMemo(() => ({
    user, setUser, updateUser,
    favourites, toggleFavourite, isFavourite,
    streak, longestStreak, moodLogs, logMood, todaysMood,
    journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    gameStats, recordGamePlay,
    wellnessMinutes, addWellnessMinutes,
    celebratedMilestones, addCelebratedMilestone,
    isLoaded,
    theme, setTheme, totalWellnessLogs,
    clearAllData,
  }), [user, favourites, moodLogs, journalEntries, gameStats, wellnessMinutes, celebratedMilestones, isLoaded, theme, totalWellnessLogs]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
