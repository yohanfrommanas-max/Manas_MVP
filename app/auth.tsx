import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/constants/colors';

export default function AuthCallback() {
  const C = useColors();

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;

      const search = new URLSearchParams(window.location.search);
      const code = search.get('code');

      const hash = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');

      let sessionEstablished = false;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) sessionEstablished = true;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) sessionEstablished = true;
      }

      if (window.opener && !window.opener.closed) {
        if (sessionEstablished) {
          window.opener.postMessage('manas-auth-complete', window.location.origin);
        }
        setTimeout(() => window.close(), 300);
      } else {
        router.replace(sessionEstablished ? '/(tabs)' : '/welcome');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator color={C.lavender} />
    </View>
  );
}
