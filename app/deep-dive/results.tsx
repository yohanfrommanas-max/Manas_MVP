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

function ScoreRing({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const C = useColors();
  const label = pct >= 75 ? 'Excellent' : pct >= 50 ? 'Good' : 'Developing';
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color, backgroundColor: color + '18' }]}>
      <Text style={[styles.ringPct, { color }]}>{pct}%</Text>
      <Text style={[styles.ringLabel, { color: C.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function ResultsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, flashcardsScore, flashcardsTotal, threadScore, threadTotal, clearSession } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const fcPct = flashcardsTotal > 0 ? Math.round((flashcardsScore / flashcardsTotal) * 100) : 0;
  const thPct = threadTotal > 0 ? Math.round((threadScore / threadTotal) * 100) : 100;
  const overallPct = Math.round((fcPct + thPct) / 2);

  const overallLabel =
    overallPct >= 80 ? 'Outstanding' :
    overallPct >= 60 ? 'Strong' :
    overallPct >= 40 ? 'Developing' : 'Keep Practising';

  const overallColor =
    overallPct >= 80 ? C.sage :
    overallPct >= 60 ? C.lavender :
    overallPct >= 40 ? C.gold : C.rose;

  function handleDone() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSession();
    router.replace('/deep-dive');
  }

  function handleRetry() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (topic) {
      router.replace('/deep-dive/read');
    }
  }

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No session data</Text>
        <Pressable onPress={() => router.replace('/deep-dive')} style={{ marginTop: 16 }}>
          <Text style={{ color: C.lavender }}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <View style={{ width: 38 }} />
        <Text style={[styles.headerTitle, { color: C.text }]}>Session Complete</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall */}
        <View style={[styles.overallCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <LinearGradient
            colors={[overallColor + '22', overallColor + '08']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.topicEmoji}>{topic.icon}</Text>
          <Text style={[styles.topicName, { color: C.text }]}>{topic.name}</Text>
          <Text style={[styles.topicDomain, { color: overallColor }]}>{topic.domain}</Text>
          <View style={[styles.overallBadge, { backgroundColor: overallColor + '20', borderColor: overallColor + '40' }]}>
            <Text style={[styles.overallPct, { color: overallColor }]}>{overallPct}%</Text>
            <Text style={[styles.overallLabel, { color: overallColor }]}>{overallLabel}</Text>
          </View>
        </View>

        {/* Phase breakdown */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>PHASE BREAKDOWN</Text>
        <View style={styles.phaseRow}>
          <View style={[styles.phaseCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.sage + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={[styles.phaseIcon, { backgroundColor: C.sage + '20' }]}>
              <Ionicons name="book-outline" size={18} color={C.sage} />
            </View>
            <Text style={[styles.phaseName, { color: C.text }]}>Read</Text>
            <Text style={[styles.phaseValue, { color: C.sage }]}>✓</Text>
            <Text style={[styles.phaseSub, { color: C.textMuted }]}>Completed</Text>
          </View>

          <View style={[styles.phaseCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.sage + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={[styles.phaseIcon, { backgroundColor: C.sage + '20' }]}>
              <Ionicons name="layers-outline" size={18} color={C.sage} />
            </View>
            <Text style={[styles.phaseName, { color: C.text }]}>Flashcards</Text>
            <Text style={[styles.phaseValue, { color: C.sage }]}>
              {flashcardsScore}/{flashcardsTotal}
            </Text>
            <Text style={[styles.phaseSub, { color: C.textMuted }]}>{fcPct}% recall</Text>
          </View>

          <View style={[styles.phaseCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient colors={[C.gold + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={[styles.phaseIcon, { backgroundColor: C.gold + '20' }]}>
              <Ionicons name="git-network-outline" size={18} color={C.gold} />
            </View>
            <Text style={[styles.phaseName, { color: C.text }]}>Thread</Text>
            <Text style={[styles.phaseValue, { color: C.gold }]}>
              {threadScore}/{threadTotal}
            </Text>
            <Text style={[styles.phaseSub, { color: C.textMuted }]}>gates passed</Text>
          </View>
        </View>

        {/* Insight */}
        <View style={[styles.insightCard, { backgroundColor: C.card, borderColor: C.lavender + '30' }]}>
          <LinearGradient colors={[C.lavender + '14', C.wisteria + '08']} style={StyleSheet.absoluteFill} />
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: C.lavender + '20' }]}>
              <Ionicons name="sparkles" size={16} color={C.lavender} />
            </View>
            <Text style={[styles.insightTitle, { color: C.lavender }]}>Cognitive Insight</Text>
          </View>
          <Text style={[styles.insightText, { color: C.text }]}>{topic.insight}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, { backgroundColor: overallColor, opacity: pressed ? 0.88 : 1 }]}
            onPress={handleDone}
          >
            <Ionicons name="home-outline" size={18} color={C.bg} />
            <Text style={[styles.doneBtnText, { color: C.bg }]}>Back to Deep Dive</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, { borderColor: C.border, backgroundColor: C.card, opacity: pressed ? 0.8 : 1 }]}
            onPress={handleRetry}
          >
            <Ionicons name="refresh" size={18} color={C.text} />
            <Text style={[styles.retryBtnText, { color: C.text }]}>Try Again</Text>
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
  content: { paddingHorizontal: 20, gap: 4 },
  overallCard: {
    borderRadius: 22, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 8, overflow: 'hidden', marginBottom: 20,
  },
  topicEmoji: { fontSize: 40, marginBottom: 4 },
  topicName: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  topicDomain: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  overallBadge: {
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 12,
    alignItems: 'center', marginTop: 4,
  },
  overallPct: { fontSize: 42, fontFamily: 'Inter_700Bold' },
  overallLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2,
    marginTop: 8, marginBottom: 12,
  },
  phaseRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  phaseCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 14,
    alignItems: 'center', gap: 6, overflow: 'hidden',
  },
  phaseIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  phaseValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  phaseSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  ring: {
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  ringPct: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  ringLabel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  insightCard: {
    borderRadius: 18, borderWidth: 1, padding: 18,
    gap: 12, overflow: 'hidden', marginBottom: 20,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  insightText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  actions: { gap: 10 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 16,
  },
  doneBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 14, borderWidth: 1,
  },
  retryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
