import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TOPICS } from '@/data/deep_dive_topics';
import { useDeepDive } from '@/context/DeepDiveContext';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const LAV = '#A78BFA';
const CYAN = '#22D3EE';
const TEXT = '#E8E4DC';
const SUB = '#7A8099';
const MUTED = '#4A5068';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER2 = 'rgba(255,255,255,0.12)';

const CARD_COLORS = [
  { border: 'rgba(167,139,250,0.2)', bg: 'rgba(167,139,250,0.1)' },
  { border: 'rgba(34,211,238,0.18)', bg: 'rgba(34,211,238,0.08)' },
  { border: 'rgba(245,158,11,0.18)', bg: 'rgba(245,158,11,0.08)' },
];

function getDailyIndices(total: number): number[] {
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rng = () => {
    seed = ((seed * 1664525 + 1013904223) & 0x7fffffff);
    return seed / 0x7fffffff;
  };
  const result: number[] = [];
  const used = new Set<number>();
  while (result.length < 3) {
    const i = Math.floor(rng() * total);
    if (!used.has(i)) { used.add(i); result.push(i); }
  }
  return result;
}

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { setTopic } = useDeepDive();

  const daily = useMemo(() => getDailyIndices(TOPICS.length).map(i => TOPICS[i]), []);

  function pick(t: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopic(t);
    router.push('/deep-dive/read');
  }

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={S.nav}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={S.backArrow}>←</Text>
        </Pressable>
        <View style={S.navInfo}>
          <Text style={S.navPhase}>Deep Dive · Choose Topic</Text>
          <Text style={S.navTitle} numberOfLines={1}>What do you want to learn?</Text>
        </View>
      </View>
      <View style={S.phaseBar}>
        <View style={[S.phaseFill, { width: '8%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.header}>
          <Text style={S.headerTitle}>Choose a topic</Text>
          <Text style={S.headerSub}>
            Pick what interests you. Read, review the key points, then play Thread — a path puzzle where questions interrupt you mid-solve.
          </Text>
        </View>

        <View style={S.cards}>
          {daily.map((t, pos) => {
            const col = CARD_COLORS[pos];
            return (
              <Pressable
                key={`${t.name}-${pos}`}
                style={({ pressed }) => [
                  S.card, { borderColor: col.border },
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                ]}
                onPress={() => pick(t)}
              >
                <View style={[S.cardIcon, { backgroundColor: col.bg }]}>
                  <Text style={{ fontSize: 24 }}>{t.icon}</Text>
                </View>
                <View style={S.cardInfo}>
                  <Text style={S.cardNum}>0{pos + 1} · {(t.domain ?? '').split('·')[0].trim().toUpperCase()}</Text>
                  <Text style={S.cardName}>{t.name}</Text>
                  <Text style={S.cardDesc} numberOfLines={2}>
                    {(t as any).shortDesc ?? t.body?.replace(/<[^>]*>/g, '').slice(0, 80) + '…'}
                  </Text>
                </View>
                <Text style={S.cardArr}>›</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={S.note}>
          <Text style={{ fontSize: 16 }}>🧩</Text>
          <Text style={S.noteText}>
            <Text style={{ color: TEXT, fontFamily: 'Inter_600SemiBold' }}>Thread puzzle:</Text>
            {' '}Fill every cell in the grid to connect the numbered anchors in order. Questions pop up at gate cells — answer them and keep going.
          </Text>
        </View>
      </ScrollView>
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

  phaseBar: { height: 2, backgroundColor: '#1A1D27' },
  phaseFill: { height: 2, backgroundColor: LAV },

  header: { padding: 22, paddingBottom: 14 },
  headerTitle: { fontFamily: 'Lora_400Regular', fontSize: 26, color: TEXT, letterSpacing: -0.5, marginBottom: 6 },
  headerSub: { fontSize: 13, color: SUB, lineHeight: 20 },

  cards: { paddingHorizontal: 22, gap: 10 },
  card: {
    backgroundColor: SURFACE, borderWidth: 1, borderRadius: 20,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  cardIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardNum: { fontFamily: 'Inter_500Medium', fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 3 },
  cardName: { fontFamily: 'Lora_400Regular', fontSize: 16, color: TEXT, lineHeight: 21, marginBottom: 3 },
  cardDesc: { fontSize: 11, color: SUB, lineHeight: 16 },
  cardArr: { fontSize: 18, color: MUTED },

  note: {
    marginHorizontal: 22, marginTop: 14,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  noteText: { fontSize: 11, color: SUB, lineHeight: 17, flex: 1 },
});
