import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';
import { TOPICS } from '@/data/deep_dive_topics';
import { sanitizeDashes } from '@/utils/sanitize';

function dayOfYear(): number {
  const now   = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyRandomTopics() {
  const rng     = seededRng(dayOfYear() * 2971 + 7919);
  const indices = Array.from({ length: TOPICS.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 3).map(idx => ({ topic: TOPICS[idx], globalIdx: idx }));
}

function shortDesc(insight: string): string {
  const s = sanitizeDashes(insight).split('.')[0];
  return s.length > 88 ? s.slice(0, 85) + '…' : s + '.';
}

export default function TopicsScreen() {
  const C = useColors();
  const insets     = useSafeAreaInsets();
  const { startSession } = useDeepDive();
  const topInset   = Platform.OS === 'web' ? 67 : insets.top;
  const botInset   = Platform.OS === 'web' ? 34 : insets.bottom;
  const dailyTopics = useMemo(() => getDailyRandomTopics(), []);

  // Staggered entrance animations
  const anims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const nd = Platform.OS !== 'web';
  useEffect(() => {
    const stagger = Animated.stagger(
      90,
      anims.map(a =>
        Animated.spring(a, {
          toValue: 1, useNativeDriver: nd,
          tension: 80, friction: 12,
        })
      )
    );
    stagger.start();
  }, []);

  function handleSelect(topic: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(topic);
    router.push('/deep-dive/read');
  }

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topInset + 14 }]}>
        <Pressable style={S.back} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={S.headerMid}>
          <Text style={[S.headline, { color: C.text }]}>Deep Dive</Text>
          <Text style={[S.subline, { color: C.textMuted }]}>Choose today's topic</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Cards */}
      <View style={[S.list, { paddingBottom: botInset + 20 }]}>
        {dailyTopics.map(({ topic, globalIdx }, pos) => {
          const anim = anims[pos];
          return (
            <Animated.View
              key={topic.name}
              style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
              }}
            >
              <Pressable
                style={({ pressed }) => [
                  S.card,
                  { backgroundColor: C.card, borderColor: C.lavender + '28' },
                  pressed && S.cardPressed,
                ]}
                onPress={() => handleSelect(topic)}
                testID={`topic-card-${pos}`}
              >
                <LinearGradient
                  colors={[C.lavender + '16', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                {/* Top row: domain pill + emoji */}
                <View style={S.cardTop}>
                  <View style={[S.domainPill, { backgroundColor: C.lavender + '18' }]}>
                    <Text style={[S.domainTxt, { color: C.lavender }]} numberOfLines={1}>
                      {sanitizeDashes(topic.domain.split('·')[0].trim())}
                    </Text>
                  </View>
                  <Text style={S.emoji}>{topic.icon}</Text>
                </View>

                {/* Name */}
                <Text style={[S.name, { color: C.text }]} numberOfLines={2}>
                  {sanitizeDashes(topic.name)}
                </Text>

                {/* Description */}
                <Text style={[S.desc, { color: C.textSub }]} numberOfLines={2}>
                  {shortDesc(topic.insight)}
                </Text>

                {/* Footer */}
                <View style={[S.footer, { borderTopColor: C.border }]}>
                  <View style={S.stepsRow}>
                    <StepPill icon="book-outline" label="Read" color={C.lavender} />
                    <Text style={{ color: C.border, fontSize: 12 }}>→</Text>
                    <StepPill icon="layers-outline" label="Cards" color={C.sage} />
                    <Text style={{ color: C.border, fontSize: 12 }}>→</Text>
                    <StepPill icon="git-network-outline" label="Thread" color={C.gold} />
                  </View>
                  <View style={[S.startArrow, { backgroundColor: C.lavender + '18' }]}>
                    <Ionicons name="arrow-forward" size={16} color={C.lavender} />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function StepPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon as any} size={11} color={color} />
      <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color }}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  back:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  headerMid: { flex: 1, alignItems: 'center' },
  headline:  { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.3 },
  subline:   { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: {
    flex: 1, paddingHorizontal: 20, gap: 14,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 22, borderWidth: 1,
    padding: 20, gap: 10, overflow: 'hidden',
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  domainPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flex: 1, marginRight: 10,
  },
  domainTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  emoji:     { fontSize: 38 },
  name:      { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24, letterSpacing: -0.2 },
  desc:      { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, marginTop: 2, borderTopWidth: 1,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  startArrow: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});
