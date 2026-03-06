import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { AppProvider, useApp } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';
import PinScreen from '@/app/pin';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoaded } = useApp();
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isPinVerified) return;
    if (!user?.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isPinVerified, user?.onboardingComplete]);

  if (!isLoaded) return null;

  if (!isPinVerified) {
    return <PinScreen onUnlocked={() => setIsPinVerified(true)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="game/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="breathe/index" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="breathe/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="sleep" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="music" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="journal" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="journal/new" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="journal/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
