import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Image, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '@/lib/query-client';
import C from '@/constants/colors';

const LOGO = require('@/assets/logo.png');

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

interface PinScreenProps {
  onUnlocked: () => void;
}

export default function PinScreen({ onUnlocked }: PinScreenProps) {
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const verify = useCallback(async (pin: string) => {
    setChecking(true);
    try {
      const url = new URL('/api/pin/verify', getApiUrl());
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        onUnlocked();
      } else {
        shake();
        setErrorMsg('Incorrect PIN');
        setDigits([]);
        setTimeout(() => setErrorMsg(''), 1800);
      }
    } catch {
      shake();
      setErrorMsg('Connection error');
      setDigits([]);
      setTimeout(() => setErrorMsg(''), 1800);
    } finally {
      setChecking(false);
    }
  }, [onUnlocked, shake]);

  const handleKey = useCallback((key: string) => {
    if (checking) return;
    if (key === 'del') {
      setDigits(prev => prev.slice(0, -1));
      return;
    }
    if (key === '') return;
    if (digits.length >= 4) return;
    const next = [...digits, key];
    setDigits(next);
    if (next.length === 4) {
      verify(next.join(''));
    }
  }, [checking, digits, verify]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: topInset + 24, paddingBottom: bottomInset + 16 }]}>
      <View style={styles.logoRow}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={styles.appName}>manas</Text>
      </View>

      <View style={styles.centerBlock}>
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>This app is in private development</Text>

        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                digits.length > i && styles.dotFilled,
              ]}
            />
          ))}
        </Animated.View>

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : (
          <Text style={styles.errorPlaceholder}> </Text>
        )}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <Pressable
                key={ki}
                onPress={() => handleKey(key)}
                disabled={key === ''}
                style={({ pressed }) => [
                  styles.key,
                  key === '' && styles.keyEmpty,
                  pressed && key !== '' && styles.keyPressed,
                ]}
              >
                {key === 'del' ? (
                  <Ionicons name="backspace-outline" size={22} color={C.textSub} />
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: C.text,
    letterSpacing: 1.5,
  },
  centerBlock: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: C.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: C.textMuted,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.lavenderDim,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: C.lavender,
    borderColor: C.lavender,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: C.error,
    marginTop: 4,
  },
  errorPlaceholder: {
    fontSize: 13,
    marginTop: 4,
  },
  keypad: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 12,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    flex: 1,
    height: 64,
    backgroundColor: C.card,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: C.lavenderDim,
  },
  keyText: {
    fontSize: 22,
    fontFamily: 'Inter_500Medium',
    color: C.text,
  },
});
