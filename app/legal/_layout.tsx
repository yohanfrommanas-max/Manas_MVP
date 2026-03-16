import { Stack } from 'expo-router';
import { useColors } from '@/constants/colors';

export default function LegalLayout() {
  const C = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}
    />
  );
}
