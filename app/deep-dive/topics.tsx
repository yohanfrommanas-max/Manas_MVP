import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
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
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// Seeded pseudo-random number generator (mulberry32) for deterministic daily selection
function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

function getDailyRandomTopics() {
  const rng = seededRng(dayOfYear() * 2971 + 7919);
  const indices = Array.from({ length: TOPICS.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, 3).map(idx => ({ topic: TOPICS[idx], globalIdx: idx }));
}

function shortDescription(insight: string): string {
  const sentence = sanitizeDashes(insight).split('.')[0];
  return sentence.length > 90 ? sentence.slice(0, 87) + '…' : sentence + '.';
}

export default function TopicsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { startSession } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const dailyTopics = useMemo(() => getDailyRandomTopics(), []);

  function handleSelect(topic: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(topic);
    router.push('/deep-dive/read');
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.title, { color: C.text }]}>Choose a Topic</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={[styles.subtitle, { color: C.textSub }]}>
        Three topics selected for this session. Pick one to begin.
      </Text>

      <View style={styles.list}>
        {dailyTopics.map(({ topic, globalIdx }, pos) => (
          <Pressable
            key={topic.name}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: C.card, borderColor: C.lavender + '40' },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handleSelect(topic)}
            testID={`topic-card-${pos}`}
          >
            <LinearGradient
              colors={[C.lavender + '14', C.bg + '00']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardTop}>
              <View style={styles.cardMeta}>
                <View style={[styles.numBadge, { backgroundColor: C.lavender + '20' }]}>
                  <Text style={[styles.numText, { color: C.lavender }]}>
                    {String(globalIdx + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={[styles.domainBadge, { backgroundColor: C.card }]}>
                  <Text style={[styles.domainText, { color: C.textMuted }]} numberOfLines={1}>
                    {sanitizeDashes(topic.domain.split('·')[0].trim())}
                  </Text>
                </View>
              </View>
              <Text style={styles.icon}>{topic.icon}</Text>
            </View>
            <Text style={[styles.name, { color: C.text }]}>{sanitizeDashes(topic.name)}</Text>
            <Text style={[styles.desc, { color: C.textSub }]} numberOfLines={2}>
              {shortDescription(topic.insight)}
            </Text>
            <View style={[styles.startRow, { borderTopColor: C.border }]}>
              <Text style={[styles.startText, { color: C.lavender }]}>Start this topic</Text>
              <Ionicons name="arrow-forward" size={14} color={C.lavender} />
            </View>
          </Pressable>
        ))}
      </View>

      {/* Thread mechanic note */}
      <View style={[styles.noteBox, { backgroundColor: C.gold + '12', borderColor: C.gold + '30', marginBottom: botInset + 20 }]}>
        <Ionicons name="git-network-outline" size={16} color={C.gold} />
        <Text style={[styles.noteText, { color: C.textSub }]}>
          <Text style={{ color: C.gold, fontFamily: 'Inter_600SemiBold' }}>Thread Puzzle: </Text>
          After reading and flashcards, drag your finger across the 5x5 grid to trace a path through every cell. Gate cells trigger recall questions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  subtitle: {
    paddingHorizontal: 20, fontSize: 13, fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  list: { paddingHorizontal: 20, gap: 12, flex: 1 },
  card: {
    borderRadius: 18, borderWidth: 1, padding: 18,
    gap: 8, overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  numBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  numText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  domainBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flex: 1,
  },
  domainText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  icon: { fontSize: 28 },
  name: { fontSize: 16, fontFamily: 'Inter_700Bold', lineHeight: 22 },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  startRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 10, marginTop: 2, borderTopWidth: 1,
  },
  startText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
