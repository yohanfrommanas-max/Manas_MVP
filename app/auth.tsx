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
      let code: string | undefined = params.code;
      let accessToken: string | undefined = params.access_token;
      let refreshToken: string | undefined = params.refresh_token;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const search = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.substring(1));
        code = code ?? search.get('code') ?? undefined;
        accessToken = accessToken ?? hash.get('access_token') ?? undefined;
        refreshToken = refreshToken ?? hash.get('refresh_token') ?? undefined;
      }

      let sessionEstablished = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) sessionEstablished = true;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) sessionEstablished = true;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (sessionEstablished) {
          try {
            const channel = new BroadcastChannel('manas-auth');
            channel.postMessage({ type: 'manas-auth-complete' });
            setTimeout(() => channel.close(), 600);
          } catch {}
        }
        setTimeout(() => {
          try {
            window.close();
          } catch {}
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
