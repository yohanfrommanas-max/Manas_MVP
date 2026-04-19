import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_700Bold,
  Lora_700Bold_Italic,
} from '@expo-google-fonts/lora';
import * as Font from 'expo-font';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { queryClient } from '@/lib/query-client';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import IntroVideo from '@/components/IntroVideo';

SplashScreen.preventAutoHideAsync();

// Pre-launch: shown before font/provider init — hardcoded dark colour intentional
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
  const C = useColors();
  const { session, authLoading } = useAuth();

  // showIntroOverlay: keeps a solid black overlay over the Stack at all times
  // until we are certain the correct screen is already rendered behind it.
  // This has two phases:
  //   1. showVideo=true  — IntroVideo plays (hides native splash on mount)
  //   2. showVideo=false — overlay is plain black while we navigate + settle
  //   3. showIntroOverlay=false — overlay removed, correct screen revealed
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [pendingRoute, setPendingRoute] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routeAfterIntro = (hasSession: boolean) => {
    if (hasSession) {
      if (__DEV__) console.log('[Nav] Intro done — session found, going home');
      router.replace('/(tabs)');
    } else {
      if (__DEV__) console.log('[Nav] Intro done — no session, showing onboarding');
      router.replace('/onboarding');
    }
  };

  // Dismiss the overlay after navigation has had time to complete behind it.
  const dismissOverlay = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setShowIntroOverlay(false), 180);
  };

  // If auth was still loading when video ended, route once it settles.
  // Hard cap: if auth hasn't resolved within 3 s of video ending, treat as logged-out.
  useEffect(() => {
    if (!pendingRoute) return;
    if (!authLoading) {
      setPendingRoute(false);
      routeAfterIntro(!!session);
      dismissOverlay();
      return;
    }
    const cap = setTimeout(() => {
      setPendingRoute(false);
      routeAfterIntro(false);
      dismissOverlay();
    }, 3000);
    return () => clearTimeout(cap);
  }, [authLoading, pendingRoute, session]);

  useEffect(() => {
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, []);

  const handleIntroDone = () => {
    // Stop showing the video — overlay stays black while we navigate behind it.
    setShowVideo(false);
    if (authLoading) {
      setPendingRoute(true);
    } else {
      routeAfterIntro(!!session);
      dismissOverlay();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'none' }} />
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

      {/* Black overlay covers the Stack from the very first render.
          IntroVideo hides the native splash on mount so the transition is:
          native splash → IntroVideo (seamless) → correct screen (no flash). */}
      {showIntroOverlay && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99, backgroundColor: '#000000' }]}>
          {showVideo && <IntroVideo onDone={handleIntroDone} />}
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontReady, setFontReady] = useState(false);

  useEffect(() => {
    // Load each font individually with Promise.allSettled so that every
    // fontfaceobserver promise (one per font) is caught as a settled result
    // rather than an unhandled rejection. Loading in bulk with Font.loadAsync({...})
    // uses Promise.all internally: when the first font fails it rejects the outer
    // promise (which our .catch() catches), but the remaining per-font
    // fontfaceobserver promises have no handler and fire as unhandledrejections.
    // Splitting into individual loads + allSettled covers every rejection.
    //
    // NOTE: We do NOT call SplashScreen.hideAsync() here. IntroVideo hides the
    // native splash the moment it is rendered, ensuring the Stack never flashes
    // underneath the splash before the intro overlay is in place.
    const fontMap: Record<string, unknown> = {
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      Lora_400Regular,
      Lora_400Regular_Italic,
      Lora_700Bold,
      Lora_700Bold_Italic,
    };

    Promise.allSettled(
      Object.entries(fontMap).map(([name, source]) =>
        Font.loadAsync({ [name]: source as Parameters<typeof Font.loadAsync>[0][string] })
          .catch(() => {})
      )
    ).then((results) => {
      const loaded = results.filter(r => r.status === 'fulfilled').length;
      if (__DEV__) console.log(`[Fonts] settled: ${loaded}/${results.length} loaded`);
      setFontReady(true);
    });

    // 4-second fallback — render the app with system fonts rather than waiting
    // indefinitely. IntroVideo will still hide the splash when it mounts.
    const timer = setTimeout(() => {
      if (__DEV__) console.log('[Fonts] 4s fallback — rendering with system fonts');
      setFontReady(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

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
