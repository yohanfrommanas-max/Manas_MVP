import React, { useMemo } from 'react';
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
import { getDailyTopic, TOPICS } from '@/data/deep_dive_topics';

const PHASES = [
  { icon: 'book-outline', label: 'Read', desc: 'Deep-read the topic article' },
  { icon: 'layers-outline', label: 'Flashcards', desc: 'Test your recall with 4 cards' },
  { icon: 'git-network-outline', label: 'Thread', desc: 'Navigate the knowledge maze' },
];

export default function DeepDiveHome() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { startSession } = useDeepDive();
  const daily = useMemo(() => getDailyTopic(), []);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function handleStart(topic: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(topic);
    router.push('/deep-dive/read');
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Deep Dive</Text>
          <Text style={[styles.headerSub, { color: C.textMuted }]}>Learn · Recall · Connect</Text>
        </View>
        <Pressable
          style={styles.browseBtn}
          onPress={() => router.push('/deep-dive/topics')}
          hitSlop={12}
        >
          <Ionicons name="list" size={20} color={C.lavender} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroCard, { borderColor: C.border }]}>
          <LinearGradient
            colors={[C.lavender + '28', C.wisteria + '14', C.bg]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBadge}>
            <Ionicons name="sunny" size={12} color={C.gold} />
            <Text style={[styles.heroBadgeText, { color: C.gold }]}>Today's Topic</Text>
          </View>
          <Text style={styles.heroIcon}>{daily.icon}</Text>
          <Text style={[styles.heroName, { color: C.text }]}>{daily.name}</Text>
          <Text style={[styles.heroDomain, { color: C.lavender }]}>{daily.domain}</Text>
          <Text style={[styles.heroTeaser, { color: C.textSub }]}>
            Read, recall, and connect — a complete learning session in three phases.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.startBtn, { backgroundColor: C.lavender, opacity: pressed ? 0.88 : 1 }]}
            onPress={() => handleStart(daily)}
          >
            <Text style={[styles.startBtnText, { color: C.bg }]}>Start Today's Session</Text>
            <Ionicons name="arrow-forward" size={16} color={C.bg} />
          </Pressable>
        </View>

        {/* How it works */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>HOW IT WORKS</Text>
        <View style={styles.phasesRow}>
          {PHASES.map((ph, i) => (
            <View key={ph.label} style={[styles.phaseCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={[styles.phaseNum, { backgroundColor: C.lavender + '20' }]}>
                <Text style={[styles.phaseNumText, { color: C.lavender }]}>{i + 1}</Text>
              </View>
              <View style={[styles.phaseIcon, { backgroundColor: C.lavender + '12' }]}>
                <Ionicons name={ph.icon as any} size={18} color={C.lavender} />
              </View>
              <Text style={[styles.phaseLabel, { color: C.text }]}>{ph.label}</Text>
              <Text style={[styles.phaseDesc, { color: C.textSub }]}>{ph.desc}</Text>
            </View>
          ))}
        </View>

        {/* Browse all */}
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>ALL 20 TOPICS</Text>
        {TOPICS.slice(0, 6).map((topic) => (
          <Pressable
            key={topic.name}
            style={({ pressed }) => [styles.topicRow, { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => handleStart(topic)}
          >
            <Text style={styles.topicIcon}>{topic.icon}</Text>
            <View style={styles.topicInfo}>
              <Text style={[styles.topicName, { color: C.text }]}>{topic.name}</Text>
              <Text style={[styles.topicDomain, { color: C.textSub }]}>{topic.domain}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </Pressable>
        ))}
        <Pressable
          style={[styles.seeAllBtn, { borderColor: C.lavender + '50', backgroundColor: C.lavender + '10' }]}
          onPress={() => router.push('/deep-dive/topics')}
        >
          <Text style={[styles.seeAllText, { color: C.lavender }]}>Browse All 20 Topics</Text>
          <Ionicons name="arrow-forward" size={14} color={C.lavender} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  browseBtn: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, gap: 0 },
  heroCard: {
    borderRadius: 22, borderWidth: 1, overflow: 'hidden',
    padding: 24, gap: 10, marginBottom: 28,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 4,
  },
  heroBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  heroIcon: { fontSize: 44 },
  heroName: { fontSize: 24, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  heroDomain: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  heroTeaser: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, marginTop: 4 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 100, marginTop: 8,
  },
  startBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2,
    marginBottom: 12, marginTop: 4,
  },
  phasesRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  phaseCard: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, alignItems: 'center',
  },
  phaseNum: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseNumText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  phaseIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  phaseDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  topicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  topicIcon: { fontSize: 24 },
  topicInfo: { flex: 1, gap: 2 },
  topicName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  topicDomain: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4,
  },
  seeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
