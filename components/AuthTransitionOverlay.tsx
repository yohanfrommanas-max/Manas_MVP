import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ND = Platform.OS !== 'web';

interface Props {
  phase: 'hidden' | 'loading' | 'success';
  userName?: string | null;
  onComplete: () => void;
}

const BG = '#0D0F14';
const ACCENT = '#A78BFA';

function AnimatedDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: ND }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: ND }),
          Animated.delay(800),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export function AuthTransitionOverlay({ phase, userName, onComplete }: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (phase === 'hidden') {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: ND }).start();
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      textOpacity.setValue(0);
      return;
    }

    if (phase === 'loading') {
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      textOpacity.setValue(0);
      Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: ND }).start();
      return;
    }

    if (phase === 'success') {
      Animated.sequence([
        Animated.timing(checkScale, { toValue: 1.1, duration: 380, useNativeDriver: ND }),
        Animated.timing(checkScale, { toValue: 1, duration: 120, useNativeDriver: ND }),
      ]).start();
      Animated.timing(checkOpacity, { toValue: 1, duration: 320, useNativeDriver: ND }).start();
      Animated.timing(textOpacity, { toValue: 1, duration: 400, delay: 300, useNativeDriver: ND }).start();

      completeTimer.current = setTimeout(onComplete, 1800);
    }

    return () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
    };
  }, [phase]);

  if (phase === 'hidden') return null;

  const displayName = userName?.split(' ')[0] || 'there';

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        {phase === 'loading' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={ACCENT} style={styles.spinner} />
            <Text style={styles.loadingText}>Signing you in…</Text>
          </View>
        )}

        {phase === 'success' && (
          <View style={styles.center}>
            <Animated.View
              style={[
                styles.checkCircle,
                { transform: [{ scale: checkScale }], opacity: checkOpacity },
              ]}
            >
              <Ionicons name="checkmark" size={36} color="#fff" />
            </Animated.View>

            <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
              <Text style={styles.successHeading}>You're in.</Text>
              <Text style={styles.successSub}>
                {'Welcome back, '}
                <Text style={styles.successName}>{displayName}</Text>
                {'.\nTaking you to your space.'}
              </Text>
              <AnimatedDots />
            </Animated.View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    zIndex: 200,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 24,
  },
  spinner: {
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: ACCENT + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  successHeading: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: -1,
  },
  successSub: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 24,
  },
  successName: {
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ACCENT,
  },
});
