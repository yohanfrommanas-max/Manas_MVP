import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import type { SupabaseProfile } from '@/lib/supabase';

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: { flexGrow: 1 },
    inner: { flex: 1, paddingHorizontal: 28 },
    logoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40,
    },
    logoOrb: {
      width: 40, height: 40, borderRadius: 12, alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.5,
    },
    heading: {
      fontSize: 30, fontFamily: 'Inter_700Bold', color: C.text,
      letterSpacing: -0.5, marginBottom: 8,
    },
    subheading: {
      fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub,
      lineHeight: 22, marginBottom: 36,
    },
    fieldLabel: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 0.8,
      textTransform: 'uppercase', marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderRadius: 14,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 16, marginBottom: 20, height: 52,
    },
    inputWrapperFocused: { borderColor: C.lavender },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
      color: C.text,
    },
    eyeBtn: { padding: 4 },
    primaryBtn: {
      height: 54, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', marginBottom: 20, overflow: 'hidden',
    },
    primaryBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff',
    },
    switchRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 4, paddingVertical: 4,
    },
    switchLabel: {
      fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub,
    },
    switchLink: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.lavender,
    },
    messageBox: {
      borderRadius: 12, borderWidth: 1,
      padding: 14, marginBottom: 20,
    },
    messageText: {
      fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20,
    },
  });
}

export default function LoginScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { signIn, signUp, fetchProfile, session, profile, authLoading } = useAuth();
  const { setUser } = useApp();
  // When flow=onboarding the user just came through the flashcard intro.
  // Always show the login form — never auto-route past it.
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isOnboardingFlow = flow === 'onboarding';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const hasAutoRouted = useRef(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  // Populate AppContext user from a Supabase profile row
  const syncUserFromProfile = useCallback((prof: SupabaseProfile) => {
    setUser({
      name: prof.name ?? '',
      mood: prof.initial_mood ?? 3,
      goals: prof.goals ?? [],
      time: prof.preferred_time ?? '',
      experience: prof.experience ?? '',
      onboardingComplete: prof.onboarding_complete,
      avatar: prof.avatar ?? undefined,
      plan: prof.plan ?? 'free',
    });
  }, [setUser]);

  // Route based on profile state
  const handleAfterAuth = useCallback(async (existingProfile?: SupabaseProfile | null) => {
    const prof = existingProfile ?? await fetchProfile();
    if (!prof || !prof.onboarding_complete) {
      router.replace({ pathname: '/onboarding', params: { phase: 'quiz' } });
    } else {
      syncUserFromProfile(prof);
      router.replace('/(tabs)');
    }
  }, [fetchProfile, syncUserFromProfile]);

  // Auto-route if the user already has a valid session (returning user).
  // Skipped when flow=onboarding — the user just came through the flashcard
  // intro and must always see the login form regardless of session state.
  useEffect(() => {
    if (authLoading || hasAutoRouted.current || isOnboardingFlow) return;
    if (session) {
      hasAutoRouted.current = true;
      handleAfterAuth(profile);
    }
  }, [authLoading, session, profile, handleAfterAuth, isOnboardingFlow]);

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    // Block the auto-route effect during explicit sign-in so we don't get
    // two competing navigations (one from onAuthStateChange firing the effect
    // with profile=null, another from the explicit handleAfterAuth call below).
    hasAutoRouted.current = true;
    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      // Allow auto-route again if sign-in failed
      hasAutoRouted.current = false;
      setError(err.includes('Invalid') ? 'Incorrect email or password.' : err);
    } else {
      await handleAfterAuth();
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    hasAutoRouted.current = true;
    const err = await signUp(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      hasAutoRouted.current = false;
      if (err.toLowerCase().includes('check your email')) {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
        switchMode('signin');
      } else if (err.toLowerCase().includes('already registered')) {
        setError('An account with this email already exists. Try signing in.');
      } else {
        setError(err);
      }
    } else {
      await handleAfterAuth();
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[C.lavender + '18', C.bg + '00']}
        style={[StyleSheet.absoluteFill, { height: 300 }]}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topInset + 24, paddingBottom: bottomInset + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={[C.lavender + '40', C.lavender + '20']}
                style={styles.logoOrb}
              >
                <Ionicons name="leaf" size={20} color={C.lavender} />
              </LinearGradient>
              <Text style={styles.logoText}>Manas</Text>
            </View>

            <Text style={styles.heading}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
            <Text style={styles.subheading}>
              {isSignUp
                ? 'Start your wellness journey today.'
                : 'Sign in to continue your wellness journey.'}
            </Text>

            {error ? (
              <View style={[styles.messageBox, { backgroundColor: C.error + '15', borderColor: C.error + '40' }]}>
                <Text style={[styles.messageText, { color: C.error }]}>{error}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.messageBox, { backgroundColor: C.sage + '20', borderColor: C.sage + '50' }]}>
                <Text style={[styles.messageText, { color: C.sage }]}>{successMsg}</Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? C.lavender : C.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                testID="login-email"
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={passwordFocused ? C.lavender : C.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                value={password}
                onChangeText={t => { setPassword(t); setError(null); }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType={isSignUp ? 'next' : 'done'}
                onSubmitEditing={isSignUp ? () => confirmRef.current?.focus() : handleSignIn}
                testID="login-password"
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={C.textMuted}
                />
              </Pressable>
            </View>

            {isSignUp && (
              <>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmFocused && styles.inputWrapperFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={confirmFocused ? C.lavender : C.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={t => { setConfirmPassword(t); setError(null); }}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    placeholder="Repeat your password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!showConfirm}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    testID="login-confirm"
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.textMuted}
                    />
                  </Pressable>
                </View>
              </>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed || loading ? 0.8 : 1 },
              ]}
              onPress={isSignUp ? handleSignUp : handleSignIn}
              disabled={loading}
              testID="login-primary-btn"
            >
              <LinearGradient
                colors={[C.lavender, C.lavenderDim]}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={() => switchMode(isSignUp ? 'signin' : 'signup')}>
                <Text style={styles.switchLink}>
                  {isSignUp ? ' Sign In' : ' Create one'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
