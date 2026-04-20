import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

function formatElapsed(start: Date | null, end: Date): string {
  if (!start) return '—';
  const seconds = Math.round((end.getTime() - start.getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function emojiForScore(score: number, total: number): string {
  if (total === 0) return '📖';
  if (score === total) return '⚡';
  if (score >= total - 1) return '🧠';
  if (score >= total - 2) return '💪';
  return '📖';
}

function titleForScore(score: number, total: number): string {
  if (total === 0 || score < total / 2) return 'Keep Exploring';
  if (score === total) return 'Thread Master';
  if (score >= total - 1) return 'Deep Thinker';
  return 'Good Progress';
}

export default function ResultsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, threadScore, threadTotal, startTime, clearSession } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const now = new Date();
  const emoji = emojiForScore(threadScore, threadTotal);
  const resultTitle = titleForScore(threadScore, threadTotal);
  const accentColor =
    threadTotal > 0 && threadScore === threadTotal
      ? C.gold
      : threadScore >= (threadTotal - 1)
      ? C.lavender
      : threadScore >= Math.floor(threadTotal / 2)
      ? C.sage
      : C.rose;

  function handlePlayAgain() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/deep-dive');
  }

  function handleBackHome() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSession();
    router.replace('/(tabs)');
  }

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No session data</Text>
        <Pressable onPress={() => router.replace('/deep-dive')} style={{ marginTop: 16 }}>
          <Text style={{ color: C.lavender }}>Go to Deep Dive</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={{ width: 38 }} />
        <Text style={[styles.headerTitle, { color: C.text }]}>Results</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero result card */}
        <View style={[styles.heroCard, { backgroundColor: C.card, borderColor: accentColor + '50' }]}>
          <LinearGradient
            colors={[accentColor + '22', accentColor + '06']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.resultEmoji}>{emoji}</Text>
          <Text style={[styles.resultTitle, { color: C.text }]}>{resultTitle}</Text>
          <Text style={[styles.resultSub, { color: C.textSub }]}>
            {topic.name} · {threadScore}/{threadTotal} gates
          </Text>
        </View>

        {/* Stat cards */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>YOUR STATS</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.gold + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.statValue, { color: C.gold }]}>
              {threadScore}/{threadTotal}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Gate score</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.lavender + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.statValue, { color: C.lavender }]}>
              {formatElapsed(startTime, now)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Time</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.sage + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={18} color={C.sage} />
              <Text style={[styles.statValue, { color: C.sage }]}>1</Text>
            </View>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Day streak</Text>
          </View>
        </View>

        {/* Phase breakdown */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>PHASES COMPLETED</Text>
        <View style={styles.phases}>
          {[
            { name: 'Read', icon: 'book-outline', color: C.sage, value: '✓', sub: 'Completed' },
            { name: 'Flashcards', icon: 'layers-outline', color: C.lavender, value: '4/4', sub: 'Cards reviewed' },
            { name: 'Thread', icon: 'git-network-outline', color: C.gold, value: `${threadScore}/${threadTotal}`, sub: 'Gates passed' },
          ].map(ph => (
            <View key={ph.name} style={[styles.phaseCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <LinearGradient colors={[ph.color + '16', C.bg + '00']} style={StyleSheet.absoluteFill} />
              <View style={[styles.phaseIcon, { backgroundColor: ph.color + '20' }]}>
                <Ionicons name={ph.icon as 'book-outline' | 'layers-outline' | 'git-network-outline'} size={16} color={ph.color} />
              </View>
              <Text style={[styles.phaseName, { color: C.text }]}>{ph.name}</Text>
              <Text style={[styles.phaseValue, { color: ph.color }]}>{ph.value}</Text>
              <Text style={[styles.phaseSub, { color: C.textMuted }]}>{ph.sub}</Text>
            </View>
          ))}
        </View>

        {/* Cognitive insight */}
        <View style={[styles.insightCard, { backgroundColor: C.card, borderColor: C.lavender + '30' }]}>
          <LinearGradient colors={[C.lavender + '14', C.bg + '00']} style={StyleSheet.absoluteFill} />
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: C.lavender + '20' }]}>
              <Ionicons name="sparkles" size={14} color={C.lavender} />
            </View>
            <Text style={[styles.insightTitle, { color: C.lavender }]}>Cognitive Insight</Text>
          </View>
          <Text style={[styles.insightText, { color: C.text }]}>{topic.insight}</Text>
        </View>

        {/* CTAs */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accentColor, opacity: pressed ? 0.88 : 1 }]}
            onPress={handlePlayAgain}
          >
            <Ionicons name="refresh" size={18} color={C.bg} />
            <Text style={[styles.primaryBtnText, { color: C.bg }]}>Play again</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, { borderColor: C.border, backgroundColor: C.card, opacity: pressed ? 0.8 : 1 }]}
            onPress={handleBackHome}
          >
            <Ionicons name="home-outline" size={18} color={C.text} />
            <Text style={[styles.secondaryBtnText, { color: C.text }]}>Back to home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  content: { paddingHorizontal: 20, gap: 0, paddingTop: 4 },
  heroCard: {
    borderRadius: 22, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 8, overflow: 'hidden', marginBottom: 24,
  },
  resultEmoji: { fontSize: 52, marginBottom: 4 },
  resultTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  resultSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2,
    marginBottom: 10, marginTop: 4,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 14,
    alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  phases: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  phaseCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12,
    alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  phaseIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  phaseName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  phaseValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  phaseSub: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  insightCard: {
    borderRadius: 18, borderWidth: 1, padding: 18,
    gap: 12, overflow: 'hidden', marginBottom: 24,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  insightText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  actions: { gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 16,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 14, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
