import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
  const { signIn, fetchProfile, session, profile, authLoading } = useAuth();

  const { setUser } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const hasAutoRouted = useRef(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

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

  // Auto-route straight home if already signed in
  useEffect(() => {
    if (authLoading || hasAutoRouted.current) return;
    if (session) {
      hasAutoRouted.current = true;
      if (profile) syncUserFromProfile(profile);
      router.replace('/(tabs)');
    }
  }, [authLoading, session, profile, syncUserFromProfile]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    hasAutoRouted.current = true;
    const err = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (err) {
      hasAutoRouted.current = false;
      setError(err.includes('Invalid') ? 'Incorrect email or password.' : err);
    } else {
      // Sync profile data then go home — no quiz or flashcards after sign-in
      const prof = await fetchProfile();
      if (prof) syncUserFromProfile(prof);
      router.replace('/(tabs)');
    }
  };

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

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              Sign in to continue your wellness journey.
            </Text>

            {error ? (
              <View style={[styles.messageBox, { backgroundColor: C.error + '15', borderColor: C.error + '40' }]}>
                <Text style={[styles.messageText, { color: C.error }]}>{error}</Text>
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
                  size={18}
                  color={C.textMuted}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed || loading ? 0.8 : 1 },
              ]}
              onPress={handleSignIn}
              disabled={loading}
              testID="login-signin-btn"
            >
              <LinearGradient
                colors={[C.lavender, C.lavenderDim]}
                style={StyleSheet.absoluteFill}
              />
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Don't have an account?</Text>
              <Pressable onPress={() => router.replace('/welcome')}>
                <Text style={styles.switchLink}> Create one</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
