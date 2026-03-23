import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';

interface VirtueDef {
  name: string;
  tags: string[];
  color: string;
  icon: string;
}

const VIRTUES: VirtueDef[] = [
  { name: 'Wisdom', tags: ['Virtue', 'Reflection'], color: '#A78BFA', icon: 'bulb-outline' },
  { name: 'Courage', tags: ['Control', 'Adversity'], color: '#C4956A', icon: 'shield-outline' },
  { name: 'Justice', tags: ['Gratitude', 'Growth'], color: '#8AB09A', icon: 'leaf-outline' },
  { name: 'Temperance', tags: ['Amor Fati', 'Memento Mori'], color: '#8BA7B8', icon: 'water-outline' },
];

function getMoodData(C: Colors): Record<JournalMood, { color: string; label: string }> {
  return {
    calm: { color: C.moodCalm, label: 'Calm' },
    focused: { color: C.moodFocused, label: 'Focused' },
    anxious: { color: C.moodAnxious, label: 'Anxious' },
    tired: { color: C.moodTired, label: 'Tired' },
    energized: { color: C.moodEnergized, label: 'Energized' },
  };
}

function calcJournalStreak(entries: { date: string }[]): number {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) { streak++; } else { break; }
  }
  return streak;
}

export default function JournalInsightsScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const weekDays = useMemo(() => {
    const entryDates = new Set(journalEntries.map(e => e.date));
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        dateStr,
        dayLabel: d.toLocaleDateString('en', { weekday: 'narrow' }).toUpperCase(),
        dayNum: d.getDate(),
        hasEntry: entryDates.has(dateStr),
        isToday: i === 0,
      });
    }
    return result;
  }, [journalEntries]);

  const virtueBars = useMemo(() => {
    const total = journalEntries.length;
    return VIRTUES.map(v => {
      const count = journalEntries.reduce((acc, e) => {
        const tags = e.tags ?? [];
        return acc + (v.tags.some(t => tags.includes(t)) ? 1 : 0);
      }, 0);
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { ...v, count, pct };
    });
  }, [journalEntries]);

  const topMood = useMemo(() => {
    if (!journalEntries.length) return null;
    const counts: Partial<Record<JournalMood, number>> = {};
    for (const e of journalEntries) {
      counts[e.mood] = (counts[e.mood] ?? 0) + 1;
    }
    const entries = Object.entries(counts) as [JournalMood, number][];
    const top = entries.sort((a, b) => b[1] - a[1])[0];
    return top ? { mood: top[0], count: top[1] } : null;
  }, [journalEntries]);

  const topTag = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of journalEntries) {
      for (const t of e.tags ?? []) {
        counts[t] = (counts[t] ?? 0) + 1;
      }
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0] ?? null;
  }, [journalEntries]);

  const streak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: topInset + 16,
          paddingBottom: botInset + 40,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Insights</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THIS WEEK</Text>
          <View style={styles.weekRow}>
            {weekDays.map(d => (
              <View key={d.dateStr} style={styles.weekDayCol}>
                <Text style={styles.weekDayLabel}>{d.dayLabel}</Text>
                <View style={[
                  styles.weekDot,
                  d.hasEntry && { backgroundColor: C.lavender },
                  d.isToday && !d.hasEntry && { borderColor: C.lavender, borderWidth: 1.5 },
                ]}>
                  <Text style={[
                    styles.weekDayNum,
                    d.hasEntry ? { color: '#FFFFFF' } : { color: C.textMuted },
                  ]}>
                    {d.dayNum}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VIRTUE PRACTICE</Text>
          <View style={styles.virtueGrid}>
            {virtueBars.map(v => (
              <View key={v.name} style={styles.virtueCard}>
                <View style={styles.virtueCardHeader}>
                  <Ionicons name={v.icon as any} size={14} color={v.color} />
                  <Text style={[styles.virtueName, { color: v.color }]}>{v.name.toUpperCase()}</Text>
                </View>
                <Text style={[styles.virtueNum, { color: v.color }]}>{v.pct}%</Text>
                <View style={styles.virtueBarTrack}>
                  <View style={[styles.virtueBarLeft, { flex: Math.max(v.pct, 0.5), backgroundColor: v.color }]} />
                  {v.pct < 100 && <View style={{ flex: Math.max(100 - v.pct, 0.5) }} />}
                </View>
                <Text style={styles.virtueTagsHint}>{v.tags.join(' · ')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PATTERNS</Text>
          <View style={styles.patternGrid}>
            <View style={[styles.patternCard, styles.patternCardWide]}>
              <Ionicons name="flame" size={16} color={C.gold} />
              <Text style={[styles.patternNum, { color: C.gold }]}>{streak}</Text>
              <Text style={styles.patternLabel}>{streak === 1 ? 'day' : 'days'}</Text>
              <Text style={styles.patternTitle}>Writing Streak</Text>
            </View>

            <View style={styles.patternCard}>
              <Ionicons name="book-outline" size={16} color={C.journalAccent} />
              <Text style={[styles.patternNum, { color: C.journalAccent }]}>{journalEntries.length}</Text>
              <Text style={styles.patternLabel}>total</Text>
              <Text style={styles.patternTitle}>Entries</Text>
            </View>

            {topMood && (
              <View style={[styles.patternCard, styles.patternCardWide]}>
                <View style={[styles.moodDot, { backgroundColor: MOOD_DATA[topMood.mood].color }]} />
                <Text style={[styles.patternNum, styles.patternNumMd, { color: MOOD_DATA[topMood.mood].color }]}>
                  {MOOD_DATA[topMood.mood].label}
                </Text>
                <Text style={styles.patternLabel}>{topMood.count} {topMood.count === 1 ? 'entry' : 'entries'}</Text>
                <Text style={styles.patternTitle}>Most Common Mood</Text>
              </View>
            )}

            {topTag && (
              <View style={styles.patternCard}>
                <Ionicons name="pricetag-outline" size={14} color={C.lavenderDim} />
                <Text style={[styles.patternNum, styles.patternNumSm, { color: C.lavenderDim }]}>
                  {topTag[0]}
                </Text>
                <Text style={styles.patternLabel}>{topTag[1]}×</Text>
                <Text style={styles.patternTitle}>Top Theme</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 28 },

    header: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

    section: { gap: 14 },
    sectionLabel: {
      fontSize: 9, fontFamily: 'Inter_700Bold',
      color: C.textMuted, letterSpacing: 2,
    },

    weekRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      backgroundColor: C.card, borderRadius: 18,
      borderWidth: 1, borderColor: C.border,
      padding: 16,
    },
    weekDayCol: { alignItems: 'center', gap: 8 },
    weekDayLabel: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1,
    },
    weekDot: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: C.card,
      borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    weekDayNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

    virtueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    virtueCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      padding: 14, gap: 8,
    },
    virtueCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    virtueName: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
    virtueNum: { fontSize: 28, fontFamily: 'Inter_700Bold' },
    virtueBarTrack: {
      height: 4, borderRadius: 2, overflow: 'hidden',
      backgroundColor: C.border, flexDirection: 'row',
    },
    virtueBarLeft: { height: 4, borderRadius: 2 },
    virtueTagsHint: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted },

    patternGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    patternCard: {
      flex: 1, minWidth: '40%',
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      padding: 16, gap: 4,
    },
    patternCardWide: { minWidth: '58%' },
    patternNum: { fontSize: 34, fontFamily: 'Inter_700Bold' },
    patternNumMd: { fontSize: 22, fontFamily: 'Inter_700Bold' },
    patternNumSm: { fontSize: 15, fontFamily: 'Inter_700Bold' },
    patternLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
    patternTitle: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: C.textSub, marginTop: 4,
    },
    moodDot: { width: 8, height: 8, borderRadius: 4 },
  });
}
