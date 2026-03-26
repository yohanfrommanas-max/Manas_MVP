import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Platform,
  KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useColors, type Colors } from '@/constants/colors';

const TEST_EMAIL = 'yohanfrommanas@gmail.com';
const TEST_PASSWORD = '123456';

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
      justifyContent: 'center', marginBottom: 14,
    },
    primaryBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff',
    },
    secondaryBtn: {
      height: 54, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', borderWidth: 1, borderColor: C.border,
      backgroundColor: C.card,
    },
    secondaryBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.text,
    },
    errorBox: {
      backgroundColor: C.error + '18', borderRadius: 10,
      borderWidth: 1, borderColor: C.error + '40',
      padding: 12, marginBottom: 20,
    },
    errorText: {
      fontSize: 13, fontFamily: 'Inter_400Regular',
      color: C.error, lineHeight: 18,
    },
    divider: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: {
      fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted,
    },
  });
}

export default function LoginScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { signIn, signUp, fetchProfile } = useAuth();

  const [email, setEmail] = useState(TEST_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAfterAuth = async () => {
    const profile = await fetchProfile();
    if (!profile) {
      router.replace({ pathname: '/onboarding', params: { phase: 'quiz' } });
    } else if (!profile.onboarding_complete) {
      router.replace({ pathname: '/onboarding', params: { phase: 'quiz' } });
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    const err = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      await handleAfterAuth();
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    const err = await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      if (err.toLowerCase().includes('check your email')) {
        setError('Account created! Please check your email to confirm, then sign in.');
      } else {
        setError(err);
      }
    } else {
      await handleAfterAuth();
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
            { paddingTop: topInset + 24, paddingBottom: bottomInset + 24 },
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
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
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
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="you@example.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="••••••"
                placeholderTextColor={C.textMuted}
                secureTextEntry={!showPassword}
                testID="login-password"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
              >
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
                style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
              />
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
                styles.secondaryBtn,
                { opacity: pressed || loading ? 0.7 : 1 },
              ]}
              onPress={handleSignUp}
              disabled={loading}
              testID="login-signup-btn"
            >
              <Text style={styles.secondaryBtnText}>Create Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
