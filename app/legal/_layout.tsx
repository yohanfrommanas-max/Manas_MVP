import { Stack } from 'expo-router';
import { useColors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LegalLayout() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: C.bg },
        headerTintColor: C.text,
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
        headerShadowVisible: false,
        headerStatusBarHeight: insets.top,
      }}
    />
  );
}
