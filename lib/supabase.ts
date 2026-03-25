import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'premium';
          mood_baseline: number | null;
          goals: string[] | null;
          preferred_time: string | null;
          experience_level: string | null;
          theme: 'dark' | 'light';
          wellness_minutes: number;
          onboarding_complete: boolean;
          celebrated_milestones: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      mood_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_date: string;
          mood: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          logged_date: string;
          mood: number;
        };
        Update: Partial<{
          mood: number;
        }>;
      };
    };
  };
};
