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
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Suppress fontfaceobserver and Supabase timeout rejections globally
// so they never reach the ErrorBoundary as uncaught errors
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg: string = event.reason?.message ?? '';
    if (msg.includes('ms timeout exceeded') || msg.includes('timeout')) {
      event.preventDefault();
    }
  });
  window.addEventListener('error', (event) => {
    const msg: string = event.message ?? '';
    if (msg.includes('ms timeout exceeded') || msg.includes('timeout exceeded')) {
      event.preventDefault();
    }
  });
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';
import { useColors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import PinScreen from '@/app/pin';
import IntroVideo from '@/components/IntroVideo';

SplashScreen.preventAutoHideAsync();

// Shown before providers are ready (no theme context available)
function AppLoadingScreen() {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator color="#A78BFA" size="large" />
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function ThemedStatusBar() {
  const { theme } = useApp();
  const C = useColors();
  return <StatusBar style={theme === 'light' ? 'dark' : 'light'} backgroundColor={C.bg} />;
}

function RootLayoutNav() {
  const { isLoaded } = useApp();
  const C = useColors();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  // Always show the intro video as soon as the PIN is cleared
  useEffect(() => {
    if (isPinVerified) {
      setShowIntroVideo(true);
      if (__DEV__) console.log('[Nav] PIN verified — showing intro video');
    }
  }, [isPinVerified]);

  // After intro completes → go to flashcards (onboarding phase=cards)
  const handleIntroDone = () => {
    setShowIntroVideo(false);
    if (__DEV__) console.log('[Nav] Intro done — navigating to /onboarding');
    router.replace('/onboarding');
  };

  // Show spinner while Supabase data loads — never block indefinitely
  if (!isLoaded) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={C.lavender} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
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
        <Stack.Screen name="journal/entries" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="journal/prompt-bank" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="journal/prompt-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="journal/insights" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="legal" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>

      {/* Intro video — shown every app open, above all content */}
      {showIntroVideo && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99 }]}>
          <IntroVideo onDone={handleIntroDone} />
        </View>
      )}

      {/* PIN gate — topmost layer */}
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

  // fontReady becomes true when fonts succeed, fail, OR the 4-second fallback fires.
  // The 4-second fallback fires BEFORE fontfaceobserver's 6-second throw, which
  // prevents the "6000ms timeout exceeded" error from ever reaching the ErrorBoundary.
  const [fontReady, setFontReady] = useState(false);
  const splashHidden = useRef(false);

  const hideSplash = () => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  // 4-second forced-render fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (__DEV__) console.log('[Fonts] 4s fallback — rendering without custom fonts');
      setFontReady(true);
      hideSplash();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Normal font resolution
  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (__DEV__) console.log('[Fonts] loaded:', fontsLoaded, 'error:', !!fontError);
      setFontReady(true);
      hideSplash();
    }
  }, [fontsLoaded, fontError]);

  // Show loading screen while fonts load — never return null
  if (!fontReady) {
    return <AppLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <ThemedStatusBar />
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </AuthProvider>
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
