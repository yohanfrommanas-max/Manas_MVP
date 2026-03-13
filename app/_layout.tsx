import {
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
import { StyleSheet, View } from 'react-native';

// Module-level: register before any React lifecycle runs so both text fonts
// and icon fonts (loaded lazily when tabs first render) are covered.
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
import { StatusBar } from 'expo-status-bar';
import PinScreen from '@/app/pin';
import IntroVideo from '@/components/IntroVideo';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoaded, hasSeenIntroVideo, markIntroVideoSeen } = useApp();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isPinVerified) return;
    if (!hasSeenIntroVideo) {
      setShowIntroVideo(true);
      return;
    }
    if (!user?.onboardingComplete) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isPinVerified, hasSeenIntroVideo, user?.onboardingComplete]);

  const handleIntroDone = () => {
    markIntroVideoSeen();
    setShowIntroVideo(false);
  };

  if (!isLoaded) return null;

  return (
    <View style={styles.root}>
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
  // Load each font weight independently so a single timeout doesn't create
  // unhandled rejections for all remaining fonts (expo-font uses Promise.all
  // internally — one rejection orphans the rest unless each is isolated).
  const [f400, e400] = useFonts({ Inter_400Regular });
  const [f500, e500] = useFonts({ Inter_500Medium });
  const [f600, e600] = useFonts({ Inter_600SemiBold });
  const [f700, e700] = useFonts({ Inter_700Bold });

  const fontsLoaded = f400 && f500 && f600 && f700;
  const fontError = e400 || e500 || e600 || e700;

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
});
