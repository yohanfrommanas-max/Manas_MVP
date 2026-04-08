import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import type { SupabaseProfile } from '@/lib/supabase';
import { AuthTransitionOverlay } from '@/components/AuthTransitionOverlay';

const LOGO_URI = 'https://dctflijlqltetfwcobjg.supabase.co/storage/v1/object/public/App-content/Inverted%20Picture%20Mark.png';

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    kav: { flex: 1 },
    scroll: { flexGrow: 1 },
    inner: {
      flex: 1, paddingHorizontal: 24,
      justifyContent: 'space-between',
    },
    top: { flex: 1 },
    logoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      marginBottom: 36,
    },
    logoImg: { width: 36, height: 36, borderRadius: 10 },
    logoText: {
      fontSize: 20, fontFamily: 'Inter_600SemiBold',
      color: C.text, letterSpacing: -0.3,
    },
    headingRow: { marginBottom: 8 },
    heading: {
      fontSize: 34, fontFamily: 'Inter_700Bold', color: C.text,
      letterSpacing: -1, lineHeight: 42,
    },
    headingItalic: {
      fontSize: 34, fontFamily: 'Lora_400Regular_Italic', color: C.text,
      letterSpacing: -0.5,
    },
    subheading: {
      fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub,
      lineHeight: 22, marginBottom: 32,
    },
    fieldLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.2,
      textTransform: 'uppercase', marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderRadius: 14,
      borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 14, marginBottom: 16, height: 52,
    },
    inputWrapperFocused: { borderColor: C.lavender + '90' },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular',
      color: C.text,
    },
    eyeBtn: { padding: 4 },
    forgotRow: { alignItems: 'flex-end', marginTop: -8, marginBottom: 24 },
    forgotText: {
      fontSize: 13, fontFamily: 'Inter_500Medium', color: C.lavender,
    },
    primaryBtn: {
      height: 54, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', marginBottom: 20,
      backgroundColor: C.lavender,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff',
    },
    divider: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, marginBottom: 16,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: {
      fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted,
    },
    googleBtn: {
      height: 54, borderRadius: 14, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      marginBottom: 24,
    },
    googleBtnText: {
      fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text,
    },
    errorBox: {
      borderRadius: 12, borderWidth: 1,
      backgroundColor: '#F8717115', borderColor: '#F8717140',
      padding: 12, marginBottom: 16,
    },
    errorText: {
      fontSize: 13, fontFamily: 'Inter_400Regular',
      color: C.error, lineHeight: 20,
    },
    resetBox: {
      backgroundColor: C.card, borderRadius: 12,
      borderWidth: 1, borderColor: C.border,
      padding: 14, marginBottom: 16,
    },
    resetLabel: {
      fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub,
      marginBottom: 10,
    },
    resetRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    resetInput: {
      flex: 1, height: 40, backgroundColor: C.bg2,
      borderRadius: 10, borderWidth: 1, borderColor: C.border,
      paddingHorizontal: 12, fontSize: 14,
      fontFamily: 'Inter_400Regular', color: C.text,
    },
    resetBtn: {
      height: 40, paddingHorizontal: 16, borderRadius: 10,
      backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center',
    },
    resetBtnText: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff',
    },
    resetSentText: {
      fontSize: 13, fontFamily: 'Inter_400Regular', color: C.sage, lineHeight: 20,
    },
    footer: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 4, paddingBottom: 4,
    },
    footerLabel: {
      fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub,
    },
    footerLink: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.lavender,
    },
  });
}

export default function LoginScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, resetPassword, fetchProfile, session, profile, authLoading } = useAuth();
  const { setUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'hidden' | 'loading' | 'success'>('hidden');
  const [transitionName, setTransitionName] = useState<string | null>(null);
  const pendingRoute = useRef<(() => void) | null>(null);
  const googleInFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const hasAutoRouted = useRef(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const routeFromProfile = useCallback((prof: SupabaseProfile) => {
    setUser({
      name: prof.name ?? '',
      mood: prof.initial_mood ?? 3,
      goals: prof.goals ?? [],
      time: prof.preferred_time ?? '',
      experience: prof.experience ?? '',
      onboardingComplete: prof.onboarding_complete,
      avatar: prof.avatar ?? undefined,
      plan: prof.plan ?? 'free',
      sharpness: (prof.sharpness ?? null) as any,
      thieves: prof.thieves ?? [],
      endOfDay: (prof.end_of_day ?? null) as any,
      preferredTime: (prof.preferred_time ?? '') as any,
      sessionLength: (prof.session_length ?? '') as any,
    });
    if (prof.onboarding_complete) {
      router.replace('/(tabs)');
    } else {
      router.replace({ pathname: '/onboarding', params: { phase: 'quiz' } });
    }
  }, [setUser]);

  useEffect(() => {
    if (authLoading || hasAutoRouted.current) return;
    if (session) {
      hasAutoRouted.current = true;
      if (profile) routeFromProfile(profile);
      else router.replace('/(tabs)');
    }
  }, [authLoading, session, profile, routeFromProfile]);


  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    hasAutoRouted.current = true;
    setTransitionPhase('loading');
    const err = await signIn(email.trim().toLowerCase(), password);
    if (err) {
      hasAutoRouted.current = false;
      setLoading(false);
      setTransitionPhase('hidden');
      setError(err.toLowerCase().includes('invalid') ? 'Incorrect email or password.' : err);
      return;
    }
    const prof = await fetchProfile();
    const name = prof?.name ?? null;
    setLoading(false);
    setTransitionName(name);
    pendingRoute.current = () => {
      if (prof) routeFromProfile(prof);
      else router.replace('/(tabs)');
    };
    setTransitionPhase('success');
  };

  const handleGoogle = async () => {
    if (googleInFlight.current) return;
    googleInFlight.current = true;
    setError(null);
    setGoogleLoading(true);
    const err = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) {
      googleInFlight.current = false;
      if (err !== 'cancelled') setError(err);
      return;
    }
    if (Platform.OS === 'web') {
      const handler = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'manas-auth-session') return;
        if (hasAutoRouted.current) return;
        window.removeEventListener('message', handler);
        clearTimeout(cleanupTimer);
        const { access_token, refresh_token } = event.data;
        await supabase.auth.setSession({ access_token, refresh_token });
        if (hasAutoRouted.current) return;
        hasAutoRouted.current = true;
        setTransitionPhase('loading');
        const prof = await fetchProfile();
        const name = prof?.name ?? null;
        setTransitionName(name);
        pendingRoute.current = () => {
          googleInFlight.current = false;
          if (prof) routeFromProfile(prof);
          else router.replace('/(tabs)');
        };
        setTransitionPhase('success');
      };
      window.addEventListener('message', handler);
      // Reset after 60s — covers the case where the user closes the popup early
      // without completing auth, so they can retry without waiting forever.
      const cleanupTimer = setTimeout(() => {
        window.removeEventListener('message', handler);
        googleInFlight.current = false;
      }, 60_000);
      return;
    }
    hasAutoRouted.current = true;
    setTransitionPhase('loading');
    const prof = await fetchProfile();
    const name = prof?.name ?? null;
    setTransitionName(name);
    pendingRoute.current = () => {
      googleInFlight.current = false;
      if (prof) routeFromProfile(prof);
      else router.replace('/(tabs)');
    };
    setTransitionPhase('success');
  };

  const handleTransitionComplete = () => {
    pendingRoute.current?.();
    pendingRoute.current = null;
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setResetSent(false);
    setShowReset(v => !v);
  };

  const handleSendReset = async () => {
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const err = await resetPassword(resetEmail.trim().toLowerCase());
    setResetLoading(false);
    if (err) {
      setError(err);
    } else {
      setResetSent(true);
    }
  };

  return (
    <View style={[styles.container]}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topInset + 28, paddingBottom: bottomInset + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.top}>
              <View style={styles.logoRow}>
                <Image source={{ uri: LOGO_URI }} style={styles.logoImg} resizeMode="contain" />
                <Text style={styles.logoText}>manas</Text>
              </View>

              <View style={styles.headingRow}>
                <Text style={styles.heading}>
                  {'Welcome '}
                  <Text style={styles.headingItalic}>back.</Text>
                </Text>
              </View>
              <Text style={styles.subheading}>Sign in to continue your wellness journey.</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                <Ionicons
                  name="mail-outline" size={17}
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
                  name="lock-closed-outline" size={17}
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
                  placeholder="••••••••"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  testID="login-password"
                />
                <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={17} color={C.textMuted}
                  />
                </Pressable>
              </View>

              <View style={styles.forgotRow}>
                <Pressable onPress={handleForgotPassword} hitSlop={8}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </View>

              {showReset && (
                <View style={styles.resetBox}>
                  {resetSent ? (
                    <Text style={styles.resetSentText}>
                      Reset link sent — check your inbox.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.resetLabel}>Enter your email to receive a reset link</Text>
                      <View style={styles.resetRow}>
                        <TextInput
                          style={styles.resetInput}
                          value={resetEmail}
                          onChangeText={setResetEmail}
                          placeholder="you@example.com"
                          placeholderTextColor={C.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <Pressable
                          style={[styles.resetBtn, { opacity: resetLoading ? 0.6 : 1 }]}
                          onPress={handleSendReset}
                          disabled={resetLoading}
                        >
                          {resetLoading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.resetBtnText}>Send</Text>}
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (pressed || loading) && styles.primaryBtnDisabled,
                ]}
                onPress={handleSignIn}
                disabled={loading || googleLoading}
                testID="login-signin-btn"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={handleGoogle}
                disabled={loading || googleLoading}
                testID="login-google-btn"
              >
                {googleLoading ? (
                  <ActivityIndicator color={C.textSub} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerLabel}>Don't have an account?</Text>
              <Pressable onPress={() => router.replace('/welcome')}>
                <Text style={styles.footerLink}>Create one</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AuthTransitionOverlay
        phase={transitionPhase}
        userName={transitionName}
        onComplete={handleTransitionComplete}
      />
    </View>
  );
}
