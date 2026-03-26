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
import { AuthProvider } from '@/context/AuthContext';
import { useColors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';
import PinScreen from '@/app/pin';
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
  const { isLoaded } = useApp();
  const C = useColors();
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    if (isPinVerified) {
      setShowIntroVideo(true);
      if (__DEV__) console.log('[Nav] PIN verified — showing intro video');
    }
  }, [isPinVerified]);

  const handleIntroDone = () => {
    setShowIntroVideo(false);
    if (__DEV__) console.log('[Nav] Intro done — navigating to /onboarding');
    router.replace('/onboarding');
  };

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
  const [fontReady, setFontReady] = useState(false);
  const splashHidden = useRef(false);

  const hideSplash = () => {
    if (!splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  };

  useEffect(() => {
    // Load fonts manually so we can .catch() the rejection before it
    // becomes an unhandled rejection that triggers the React Native
    // dev error overlay ("6000ms timeout exceeded").
    // useFonts from @expo-google-fonts lets the rejection bubble up
    // unhandled; calling Font.loadAsync directly lets us suppress it here.
    Font.loadAsync({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      Lora_400Regular,
      Lora_400Regular_Italic,
      Lora_700Bold,
    })
      .then(() => {
        if (__DEV__) console.log('[Fonts] loaded successfully');
      })
      .catch((err: Error) => {
        // Catch here = handled rejection. The error overlay never fires.
        if (__DEV__) console.log('[Fonts] load error (handled gracefully):', err?.message);
      })
      .finally(() => {
        setFontReady(true);
        hideSplash();
      });

    // 4-second fallback renders the app before fontfaceobserver's 6s throw.
    // If fonts haven't resolved yet, we render with system fonts and let
    // the Font.loadAsync promise settle in the background.
    const timer = setTimeout(() => {
      if (__DEV__) console.log('[Fonts] 4s fallback — rendering with system fonts');
      setFontReady(true);
      hideSplash();
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
