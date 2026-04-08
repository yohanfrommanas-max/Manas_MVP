import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useColors } from '@/constants/colors';

export default function AuthCallback() {
  const C = useColors();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (typeof window !== 'undefined' && window.opener) {
        setTimeout(() => window.close(), 300);
      } else {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/welcome');
        }
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator color={C.lavender} />
    </View>
  );
}
