import { Stack } from 'expo-router';
import { DeepDiveProvider } from '@/context/DeepDiveContext';

export default function DeepDiveLayout() {
  return (
    <DeepDiveProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="topics" />
        <Stack.Screen name="read" />
        <Stack.Screen name="flashcards" />
        <Stack.Screen name="thread" />
        <Stack.Screen name="results" />
      </Stack>
    </DeepDiveProvider>
  );
}
