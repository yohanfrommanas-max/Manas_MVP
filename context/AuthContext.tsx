import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, SupabaseProfile } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  supabaseUser: User | null;
  profile: SupabaseProfile | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<SupabaseProfile | null>;
  updateProfile: (updates: Partial<SupabaseProfile>) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as SupabaseProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — if getSession() hangs (Supabase offline / slow network),
    // release authLoading after 5 s so the login form is never permanently blocked.
    const authTimeout = setTimeout(() => setAuthLoading(false), 5000);

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        clearTimeout(authTimeout);
        setSession(s);
        if (s) {
          loadProfile(s.user.id).then(setProfile).finally(() => setAuthLoading(false));
        } else {
          setAuthLoading(false);
        }
      })
      .catch(() => {
        clearTimeout(authTimeout);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        loadProfile(s.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (): Promise<SupabaseProfile | null> => {
    if (!session) return null;
    const p = await loadProfile(session.user.id);
    setProfile(p);
    return p;
  };

  const updateProfile = async (updates: Partial<SupabaseProfile>): Promise<string | null> => {
    if (!session) return 'Not authenticated';
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) return error.message;
    setProfile(prev => (prev ? { ...prev, ...updates } : null));
    return null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user && !data.session) {
      return 'Check your email to confirm your account.';
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      supabaseUser: session?.user ?? null,
      profile,
      authLoading,
      signIn,
      signUp,
      signOut,
      fetchProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
