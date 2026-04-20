import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDeepDive } from '@/context/DeepDiveContext';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const SURFACE2 = '#1A1D27';
const LAV = '#A78BFA';
const LAV_D = '#7C5FD4';
const SAGE = '#6EE7B7';
const TEXT = '#E8E4DC';
const SUB = '#7A8099';
const MUTED = '#4A5068';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER2 = 'rgba(255,255,255,0.12)';

export default function FlashcardsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { topic } = useDeepDive();

  const [idx, setIdx] = useState(0);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardX = useRef(new Animated.Value(0)).current;

  if (!topic) { router.replace('/deep-dive/topics'); return null; }
  const cards = topic.cards;
  const card = cards[idx];
  const isLast = idx === cards.length - 1;

  function nav(dir: 1 | -1) {
    if (dir === 1 && isLast) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/deep-dive/thread');
      return;
    }
    const next = Math.max(0, Math.min(cards.length - 1, idx + dir));
    if (next === idx) return;
    Haptics.selectionAsync();

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(cardX, { toValue: dir > 0 ? -12 : 12, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setIdx(next);
      cardX.setValue(dir > 0 ? 12 : -12);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(cardX, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={S.nav}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={S.backArrow}>←</Text>
        </Pressable>
        <View style={S.navInfo}>
          <Text style={S.navPhase}>Phase 2 of 3 · Key Points</Text>
          <Text style={S.navTitle} numberOfLines={1}>{topic.name}</Text>
        </View>
        <Text style={S.counter}>{idx + 1}/{cards.length}</Text>
      </View>
      <View style={S.phaseBar}>
        <View style={[S.phaseFill, { width: '66%' }]} />
      </View>

      {/* Content */}
      <View style={S.wrap}>
        {/* Dots */}
        <View style={S.dots}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                S.dot,
                i === idx ? S.dotActive : i < idx ? S.dotDone : {},
              ]}
            />
          ))}
        </View>

        {/* Card */}
        <Animated.View style={[S.card, { opacity: cardOpacity, transform: [{ translateX: cardX }] }]}>
          <LinearGradient
            colors={[LAV, SAGE]}
            style={S.cardTopLine}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Text style={S.kp}>{card.kp}</Text>
          <Text style={S.main}>{card.main}</Text>
          <Text style={S.detail}>{card.detail}</Text>
        </Animated.View>

        {/* Nav buttons */}
        <View style={S.navRow}>
          {idx > 0 && (
            <Pressable
              style={({ pressed }) => [S.btn, pressed && { opacity: 0.7 }]}
              onPress={() => nav(-1)}
            >
              <Text style={S.btnText}>← Prev</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [S.btnPrimary, idx === 0 && { flex: 1 }, pressed && { opacity: 0.85 }]}
            onPress={() => nav(1)}
          >
            <LinearGradient
              colors={[LAV, LAV_D]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <Text style={S.btnPrimaryText}>{isLast ? 'Start Thread →' : 'Next →'}</Text>
          </Pressable>
        </View>

        <Text style={S.hint}>{isLast ? 'Ready to thread?' : 'Take your time'}</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(11,13,18,0.96)',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1A1D27', borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 15, color: TEXT },
  navInfo: { flex: 1 },
  navPhase: { fontSize: 9, color: LAV, letterSpacing: 1.2, fontFamily: 'Inter_500Medium', marginBottom: 1 },
  navTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT },
  counter: { fontFamily: 'Inter_500Medium', fontSize: 11, color: SUB, flexShrink: 0 },

  phaseBar: { height: 2, backgroundColor: SURFACE2 },
  phaseFill: { height: 2, backgroundColor: LAV },

  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 22, paddingVertical: 24,
  },

  dots: { flexDirection: 'row', gap: 6, marginBottom: 22 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BORDER2 },
  dotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: LAV },
  dotDone: { backgroundColor: SAGE },

  card: {
    width: '100%', borderRadius: 22, padding: 26,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    marginBottom: 20, overflow: 'hidden',
  },
  cardTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  kp: { fontFamily: 'Inter_500Medium', fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 12 },
  main: { fontFamily: 'Lora_400Regular', fontSize: 18, color: TEXT, lineHeight: 26, letterSpacing: -0.2, marginBottom: 12 },
  detail: { fontSize: 12, color: SUB, lineHeight: 19 },

  navRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: {
    flex: 1, height: 48, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER2,
    backgroundColor: SURFACE2,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: TEXT },
  btnPrimary: {
    flex: 1, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  btnPrimaryText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0B0D12' },

  hint: { fontSize: 11, color: MUTED, marginTop: 16 },
});
