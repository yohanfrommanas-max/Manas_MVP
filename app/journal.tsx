import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { getTodayPrompt, getGradientIndex } from '@/data/journalPrompts';
import { formatEntryDateShort, formatMonthYear, toDateStr } from '@/utils/dateHelpers';
import type { JournalMood } from '@/context/AppContext';

function getMoodData(C: Colors) {
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

function groupByMonth(entries: { date: string; id: string }[]): { month: string; ids: string[] }[] {
  const map = new Map<string, string[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e.id);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([k, ids]) => ({ month: formatMonthYear(k + '-01'), ids }));
}

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry } = useApp();

  const journalStreak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayPrompt = getTodayPrompt();
  const gradientIdx = getGradientIndex();
  const gradientPair = C.promptCardGradients[gradientIdx];

  const todayStr = toDateStr();
  const todayEntry = journalEntries.find(e => e.date === todayStr);

  const toggleStar = (id: string, starred: boolean) => {
    updateJournalEntry(id, { starred: !starred });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const pastEntries = journalEntries.filter(e => e.id !== todayEntry?.id);
  const grouped = useMemo(() => groupByMonth(pastEntries), [pastEntries]);
  const entryById = useMemo(() => {
    const m: Record<string, typeof journalEntries[0]> = {};
    for (const e of journalEntries) m[e.id] = e;
    return m;
  }, [journalEntries]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: topInset + 16,
          paddingBottom: botInset + 100,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Journal</Text>
          <View style={{ width: 40 }} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.93 }]}
          onPress={() => {
            if (todayEntry) {
              router.push({ pathname: '/journal/[id]', params: { id: todayEntry.id } });
            } else {
              router.push('/journal/new' as any);
            }
          }}
        >
          <LinearGradient
            colors={gradientPair}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.heroTopRow}>
            <Text style={styles.heroCategory}>{todayPrompt.category.toUpperCase()}</Text>
            {todayEntry ? (
              <View style={styles.writtenBadge}>
                <Ionicons name="checkmark-circle" size={13} color={C.moodEnergized} />
                <Text style={[styles.writtenText, { color: C.moodEnergized }]}>Done</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.heroQuoteMark}>{'\u201C'}</Text>

          <Text style={styles.heroPrompt} numberOfLines={3}>
            {todayPrompt.text}
          </Text>

          <View style={styles.heroBottomRow}>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={13} color={C.gold} />
              <Text style={styles.streakChipText}>
                {journalStreak} {journalStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Text style={styles.entriesChipText}>
              {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'}
            </Text>
            {!todayEntry && (
              <Ionicons name="arrow-forward" size={16} color={C.textSub} style={{ marginLeft: 6 }} />
            )}
          </View>
        </Pressable>

        {journalEntries.length === 0 && (
          <Text style={styles.emptyLine}>Your first entry is waiting.</Text>
        )}

        {grouped.map(({ month, ids }) => (
          <View key={month}>
            <Text style={styles.monthLabel}>{month}</Text>
            <View style={styles.monthGroup}>
              {ids.map((id, idx) => {
                const entry = entryById[id];
                if (!entry) return null;
                const moodInfo = MOOD_DATA[entry.mood as JournalMood] ?? MOOD_DATA.focused;
                const isLast = idx === ids.length - 1;
                return (
                  <Pressable
                    key={id}
                    style={({ pressed }) => [
                      styles.entryRow,
                      { borderLeftColor: moodInfo.color },
                      isLast && styles.entryRowLast,
                      pressed && { opacity: 0.72 },
                    ]}
                    onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })}
                  >
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryDate}>{formatEntryDateShort(entry.timestamp)}</Text>
                      {entry.starred && (
                        <Ionicons name="star" size={10} color={C.gold} />
                      )}
                    </View>
                    <Text style={styles.entryExcerpt} numberOfLines={1}>{entry.text}</Text>
                    <View style={styles.entryRight}>
                      <Text style={[styles.entryMoodLabel, { color: moodInfo.color }]}>{moodInfo.label}</Text>
                      <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 16 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 4,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
    heroCard: {
      height: 290, borderRadius: 24, overflow: 'hidden',
      padding: 20, justifyContent: 'space-between',
    },
    heroTopRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    heroCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.8,
    },
    writtenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    writtenText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    heroQuoteMark: {
      fontSize: 72, fontFamily: 'Lora_700Bold',
      color: C.textSub, lineHeight: 56, opacity: 0.25,
      marginTop: 4, marginBottom: -8,
    },
    heroPrompt: {
      fontSize: 21, fontFamily: 'Lora_700Bold',
      color: C.text, lineHeight: 30, flex: 1,
    },
    heroBottomRow: {
      flexDirection: 'row', alignItems: 'center',
    },
    streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    streakChipText: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.textSub,
    },
    entriesChipText: {
      fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted,
    },
    emptyLine: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: C.textMuted, textAlign: 'center', paddingTop: 40,
    },
    monthLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.2,
      marginBottom: 8,
    },
    monthGroup: {
      backgroundColor: C.card, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      overflow: 'hidden',
    },
    entryRow: {
      paddingVertical: 13, paddingHorizontal: 16,
      borderLeftWidth: 3,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      gap: 3,
    },
    entryRowLast: {
      borderBottomWidth: 0,
    },
    entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    entryDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textMuted },
    entryExcerpt: {
      fontSize: 14, fontFamily: 'Lora_400Regular',
      color: C.text, lineHeight: 20,
    },
    entryRight: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 2,
    },
    entryMoodLabel: {
      fontSize: 11, fontFamily: 'Inter_500Medium',
    },
  });
}
