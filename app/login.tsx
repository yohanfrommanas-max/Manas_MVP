import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/constants/colors';

const LOGO = require('@/assets/logo.png');
const TEST_EMAIL = 'testyz@gmail.com';
const TEST_PASSWORD = '12345';

export default function LoginScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, session, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState(TEST_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, []);

  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
  }, [session]);

  useEffect(() => {
    provisionTestUser();
  }, []);

  async function provisionTestUser() {
    await signUp(TEST_EMAIL, TEST_PASSWORD);
    await signIn(TEST_EMAIL, TEST_PASSWORD);
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signIn(email.trim(), password.trim());
    if (error) {
      setError(error.message ?? 'Login failed. Please try again.');
    }
    setLoading(false);
  }

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await signUp(email.trim(), password.trim());
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('already registered') || msg.includes('already exists')) {
        const loginResult = await signIn(email.trim(), password.trim());
        if (loginResult.error) {
          setError('Account exists. Check your password.');
        }
      } else {
        setError(error.message ?? 'Sign up failed. Please try again.');
      }
    }
    setLoading(false);
  }

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.lavender} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topInset + 24, paddingBottom: botInset + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Logo & app name */}
          <View style={styles.logoRow}>
            <Image source={LOGO} style={styles.logo} />
            <Text style={[styles.appName, { color: C.text }]}>manas</Text>
          </View>

          <View style={styles.taglineWrap}>
            <Text style={[styles.tagline, { color: C.textMuted }]}>
              Your personal wellness companion.
            </Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.cardTitle, { color: C.text }]}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={[styles.cardSub, { color: C.textMuted }]}>
              {mode === 'login'
                ? 'Sign in to continue your practice.'
                : 'Join and begin your wellness journey.'}
            </Text>

            {/* Email */}
            <Text style={[styles.inputLabel, { color: C.textSub }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.bg2, color: C.text, borderColor: C.border }]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="your@email.com"
              placeholderTextColor={C.textMuted}
              testID="login-email"
            />

            {/* Password */}
            <Text style={[styles.inputLabel, { color: C.textSub }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.bg2, color: C.text, borderColor: C.border }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••"
              placeholderTextColor={C.textMuted}
              returnKeyType="done"
              onSubmitEditing={mode === 'login' ? handleLogin : handleSignUp}
              testID="login-password"
            />

            {/* Error */}
            {!!error && (
              <Text style={[styles.errorText, { color: C.error }]}>{error}</Text>
            )}

            {/* Primary action */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: C.lavender, opacity: pressed || loading ? 0.8 : 1 },
              ]}
              onPress={mode === 'login' ? handleLogin : handleSignUp}
              disabled={loading}
              testID="login-submit"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </Pressable>

            {/* Toggle mode */}
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, { color: C.textMuted }]}>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Pressable
                onPress={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}
              >
                <Text style={[styles.toggleLink, { color: C.lavender }]}>
                  {mode === 'login' ? ' Sign Up' : ' Sign In'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Test credentials note */}
          <View style={[styles.testBadge, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
            <Text style={[styles.testBadgeText, { color: C.textMuted }]}>
              Test account pre-filled · testyz@gmail.com / 12345
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  container: {
    flexGrow: 1, paddingHorizontal: 24, gap: 0,
  },
  logoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, marginBottom: 4,
  },
  logo: { width: 48, height: 48, borderRadius: 16 },
  appName: {
    fontSize: 36, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2,
  },
  taglineWrap: { marginBottom: 32 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular' },

  card: {
    borderRadius: 20, padding: 24,
    borderWidth: 1, marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 4,
  },
  cardSub: {
    fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 24,
  },

  inputLabel: {
    fontSize: 12, fontFamily: 'Inter_500Medium',
    letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6,
  },
  input: {
    height: 50, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },

  errorText: {
    fontSize: 13, fontFamily: 'Inter_500Medium',
    marginBottom: 12,
  },

  primaryBtn: {
    height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, marginBottom: 16,
  },
  primaryBtnText: {
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF',
  },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  toggleText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  toggleLink: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  testBadge: {
    borderRadius: 10, padding: 10, borderWidth: 1,
    alignItems: 'center',
  },
  testBadgeText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
