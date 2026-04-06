import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface SupabaseProfile {
  id: string;
  name: string;
  avatar: string | null;
  plan: 'free' | 'premium';
  goals: string[];
  preferred_time: string | null;
  experience: string | null;
  initial_mood: number | null;
  onboarding_complete: boolean;
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
  sharpness: string | null;
  thieves: string[] | null;
  end_of_day: string | null;
  session_length: string | null;
}
