import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/constants/colors';

export default function AuthCallback() {
  const C = useColors();
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
  }>();

  useEffect(() => {
    (async () => {
      const normalize = (v: string | string[] | undefined): string | undefined =>
        Array.isArray(v) ? v[0] : v;
      let code: string | undefined = normalize(params.code);
      let accessToken: string | undefined = normalize(params.access_token);
      let refreshToken: string | undefined = normalize(params.refresh_token);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.substring(1));
        code = code ?? search.get('code') ?? undefined;
        accessToken = accessToken ?? hash.get('access_token') ?? undefined;
        refreshToken = refreshToken ?? hash.get('refresh_token') ?? undefined;
      }

      console.log('[auth] params received:', {
        platform: Platform.OS,
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        rawParams: params,
      });

      let sessionEstablished = false;

      if (code) {
        console.log('[auth] exchanging code for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[auth] exchangeCodeForSession failed:', error.message);
        } else {
          sessionEstablished = true;
          console.log('[auth] session established via code exchange ✓');
        }
      } else if (accessToken && refreshToken) {
        console.log('[auth] setting session via access/refresh tokens...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[auth] setSession failed:', error.message);
        } else {
          sessionEstablished = true;
          console.log('[auth] session established via tokens ✓');
        }
      } else {
        console.warn('[auth] no code or tokens found — cannot establish session');
      }

      const destination = sessionEstablished ? '/(tabs)' : '/welcome';
      console.log('[auth] navigating to:', destination);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (sessionEstablished) {
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const channel = new BroadcastChannel('manas-auth');
              channel.postMessage({ type: 'manas-auth-complete' });
              setTimeout(() => channel.close(), 600);
            }
          } catch (e) {
            console.warn('[auth] BroadcastChannel error:', e);
          }
        }
        setTimeout(() => {
          try { window.close(); } catch (e) { /* ignore */ }
        }, 200);
        setTimeout(() => {
          router.replace(sessionEstablished ? '/(tabs)' : '/welcome');
        }, 600);
      } else {
        router.replace(sessionEstablished ? '/(tabs)' : '/welcome');
      }
    })();
  }, [params.code, params.access_token, params.refresh_token]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator color={C.lavender} />
    </View>
  );
}
