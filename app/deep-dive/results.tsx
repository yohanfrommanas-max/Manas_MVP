import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDeepDive } from '@/context/DeepDiveContext';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const LAV = '#A78BFA';
const LAV_D = '#7C5FD4';
const SAGE = '#6EE7B7';
const TEXT = '#E8E4DC';
const SUB = '#7A8099';
const MUTED = '#4A5068';
const BORDER = 'rgba(255,255,255,0.06)';

function getResult(score: number, total: number) {
  const pct = total > 0 ? score / total : 0;
  if (score === 4) return { icon: '⚡', title: 'Flawless thread.' };
  if (pct >= 0.75) return { icon: '🧠', title: 'Strong run.' };
  if (pct >= 0.5) return { icon: '💪', title: 'Good effort.' };
  return { icon: '📖', title: 'Review and retry.' };
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m${s}s` : `${s}s`;
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { topic, threadScore, threadTotal, elapsed, resetSession } = useDeepDive();

  const iconAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(iconAnim, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }).start();
  }, []);

  const iconScale = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const iconOpacity = iconAnim;

  if (!topic) { router.replace('/deep-dive'); return null; }
  const { icon, title } = getResult(threadScore, threadTotal);
  const streak = threadScore >= 3 ? 4 : 2;

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[S.inner, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text style={[S.icon, { transform: [{ scale: iconScale }], opacity: iconOpacity }]}>
          {icon}
        </Animated.Text>

        <Text style={S.title}>{title}</Text>
        <Text style={S.sub}>{topic.name} — {threadScore} of 4 gates correct.</Text>

        {/* Stat cards */}
        <View style={S.row}>
          <View style={S.statCard}>
            <Text style={S.statNum}>{threadScore}/{threadTotal || 4}</Text>
            <Text style={S.statLbl}>SCORE</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statNum}>{formatTime(elapsed)}</Text>
            <Text style={S.statLbl}>TIME</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statNum}>{streak}🔥</Text>
            <Text style={S.statLbl}>STREAK</Text>
          </View>
        </View>

        {/* Insight */}
        <View style={S.insight}>
          <Text style={S.insightLbl}>COGNITIVE NOTE</Text>
          <Text style={S.insightText}>{topic.insight}</Text>
        </View>

        {/* Buttons */}
        <Pressable
          style={({ pressed }) => [S.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            resetSession();
            router.replace('/deep-dive');
          }}
        >
          <LinearGradient
            colors={[LAV, LAV_D]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Text style={S.btnText}>Play again →</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [S.btnGhost, pressed && { opacity: 0.7 }]}
          onPress={() => {
            resetSession();
            router.replace('/(tabs)');
          }}
        >
          <Text style={S.btnGhostText}>Back to home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  inner: { alignItems: 'center', padding: 28 },

  icon: { fontSize: 58, marginBottom: 14 },
  title: {
    fontFamily: 'Lora_400Regular', fontSize: 26, color: '#E8E4DC',
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 6,
  },
  sub: { fontSize: 13, color: SUB, textAlign: 'center', lineHeight: 21, marginBottom: 22 },

  row: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center',
  },
  statNum: { fontFamily: 'Lora_400Regular', fontSize: 26, color: LAV, marginBottom: 4 },
  statLbl: { fontSize: 9, color: MUTED, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },

  insight: {
    width: '100%', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 3, borderLeftColor: SAGE, borderRadius: 14,
    padding: 14, marginBottom: 18,
  },
  insightLbl: { fontSize: 9, color: SAGE, letterSpacing: 1.2, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  insightText: { fontSize: 12, color: SUB, lineHeight: 19 },

  btn: {
    width: '100%', height: 50, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10,
  },
  btnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0B0D12' },

  btnGhost: {
    width: '100%', height: 50, borderRadius: 15,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGhostText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: SUB },
});
