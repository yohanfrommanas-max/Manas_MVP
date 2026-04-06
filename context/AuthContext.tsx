import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, SupabaseProfile } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

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
  signInWithGoogle: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
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
    const { data: { session: current } } = await supabase.auth.getSession();
    const userId = current?.user?.id ?? session?.user?.id;
    if (!userId) return null;
    const p = await loadProfile(userId);
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

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        return error?.message ?? null;
      }

      const redirectUrl = Linking.createURL('/');
      console.log('[Google OAuth] redirectUrl:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) return error?.message ?? 'Failed to open Google sign-in';

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'dismiss') {
        return null;
      }

      if (result.type === 'cancel') {
        return null;
      }

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);

        let access_token: string | null = null;
        let refresh_token: string | null = null;

        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        if (!access_token) {
          const searchParams = new URLSearchParams(url.search);
          access_token = searchParams.get('access_token');
          refresh_token = searchParams.get('refresh_token');
        }

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) return sessionError.message;
        } else {
          const { data: { session: s }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) return sessionError.message;
          if (!s) return 'Sign-in completed but no session found. Please try again.';
        }
      }

      return null;
    } catch (e: any) {
      console.error('[Google OAuth]', e);
      return e?.message ?? 'Google sign-in failed';
    }
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    const redirectUrl = Linking.createURL('/');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return error?.message ?? null;
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
      signInWithGoogle,
      resetPassword,
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
