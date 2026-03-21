import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
} from '@expo-google-fonts/lora';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('ms timeout exceeded')) {
      event.preventDefault();
    }
  });
}
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { AppProvider, useApp } from '@/context/AppContext';
import { useColors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import PinScreen from '@/app/pin';
import IntroVideo from '@/components/IntroVideo';

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { theme } = useApp();
  const C = useColors();
  return <StatusBar style={theme === 'light' ? 'dark' : 'light'} backgroundColor={C.bg} />;
}

function RootLayoutNav() {
  const { user, isLoaded, theme } = useApp();
  const C = useColors();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isPinVerified) return;
    if (!showIntroVideo) {
      setShowIntroVideo(true);
    }
  }, [isLoaded, isPinVerified]);

  const handleIntroDone = () => {
    setShowIntroVideo(false);
    if (!user?.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  };

  if (!isLoaded) return null;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
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
        <Stack.Screen name="journal/prompt-bank" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="journal/prompt-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="legal" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
      {showIntroVideo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99 }]}>
          <IntroVideo onDone={handleIntroDone} />
        </View>
      )}
      {!isPinVerified && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <PinScreen onUnlocked={() => setIsPinVerified(true)} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_700Bold,
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
              <ThemedStatusBar />
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
});
