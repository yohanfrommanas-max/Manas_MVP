import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { useCognitiveScores } from '@/hooks/useCognitiveScores';
import { formatMonthYear } from '@/utils/dateHelpers';

type SortMode = 'newest' | 'oldest' | 'mood' | 'score_high' | 'score_low';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'mood', label: 'By mood' },
  { key: 'score_high', label: 'Highest cognitive score' },
  { key: 'score_low', label: 'Lowest cognitive score' },
];

const MOOD_ORDER: Record<JournalMood, number> = {
  energized: 5, focused: 4, calm: 3, tired: 2, anxious: 1,
};

function getMoodData(C: Colors): Record<JournalMood, { color: string; label: string }> {
  return {
    calm: { color: C.moodCalm, label: 'Calm' },
    focused: { color: C.moodFocused, label: 'Focused' },
    anxious: { color: C.moodAnxious, label: 'Anxious' },
    tired: { color: C.moodTired, label: 'Tired' },
    energized: { color: C.moodEnergized, label: 'Energized' },
  };
}

function groupSorted(
  sorted: JournalEntry[],
): { monthKey: string; month: string; entries: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>();
  const order: string[] = [];
  for (const e of sorted) {
    const key = e.date.slice(0, 7);
    if (!map.has(key)) { map.set(key, []); order.push(key); }
    map.get(key)!.push(e);
  }
  return order.map(key => ({
    monthKey: key,
    month: formatMonthYear(key + '-01'),
    entries: map.get(key)!,
  }));
}

function formatRowDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase();
}

export default function JournalEntriesScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();
  const { getScoreForDate } = useCognitiveScores();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showSort, setShowSort] = useState(false);
  const sheetY = useRef(new Animated.Value(400)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openSort = () => {
    setShowSort(true);
    sheetY.setValue(400);
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        tension: 82,
        friction: 12,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  const closeSort = (onDone?: () => void) => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 400, duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0, duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => { setShowSort(false); onDone?.(); });
  };

  const pickSort = (mode: SortMode) => {
    setSortMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => closeSort(), 150);
  };

  const sorted = useMemo(() => {
    const arr = [...journalEntries];
    switch (sortMode) {
      case 'newest':
        return arr.sort((a, b) => b.timestamp - a.timestamp);
      case 'oldest':
        return arr.sort((a, b) => a.timestamp - b.timestamp);
      case 'mood':
        return arr.sort((a, b) => (MOOD_ORDER[b.mood] ?? 0) - (MOOD_ORDER[a.mood] ?? 0));
      case 'score_high':
        return arr.sort(
          (a, b) =>
            (getScoreForDate(b.date)?.score ?? 0) - (getScoreForDate(a.date)?.score ?? 0),
        );
      case 'score_low':
        return arr.sort(
          (a, b) =>
            (getScoreForDate(a.date)?.score ?? 0) - (getScoreForDate(b.date)?.score ?? 0),
        );
    }
  }, [journalEntries, sortMode, getScoreForDate]);

  const groups = useMemo(() => groupSorted(sorted), [sorted]);

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
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </Pressable>
          <Text style={styles.title}>My entries</Text>
          <Pressable style={styles.iconBtn} onPress={openSort}>
            <Ionicons name="options-outline" size={20} color={C.text} />
          </Pressable>
        </View>

        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No entries yet</Text>
          </View>
        ) : (
          groups.map(({ monthKey, month, entries }) => (
            <View key={monthKey}>
              <Text style={styles.monthLabel}>{month.toUpperCase()}</Text>
              <View style={styles.monthGroup}>
                {entries.map((entry, idx) => {
                  const moodInfo = MOOD_DATA[entry.mood as JournalMood] ?? MOOD_DATA.focused;
                  const cogScore = getScoreForDate(entry.date);
                  const hasScore = !!(cogScore && cogScore.gamesPlayed > 0);
                  const dotColor = hasScore
                    ? cogScore!.score >= 75
                      ? C.insightBarAbove
                      : cogScore!.score >= 55
                        ? C.insightBarAverage
                        : C.insightBarBelow
                    : C.border;
                  const isLast = idx === entries.length - 1;

                  return (
                    <Pressable
                      key={entry.id}
                      style={({ pressed }) => [
                        styles.entryRow,
                        !isLast && styles.entryRowBorder,
                        pressed && { opacity: 0.7, backgroundColor: C.cardAlt },
                      ]}
                      onPress={() =>
                        router.push({ pathname: '/journal/[id]', params: { id: entry.id } })
                      }
                    >
                      <View style={[styles.moodBar, { backgroundColor: moodInfo.color }]} />
                      <View style={styles.entryContent}>
                        <View style={styles.entryTop}>
                          <Text style={styles.entryDate}>{formatRowDate(entry.date)}</Text>
                          <View style={styles.entryBadges}>
                            <View style={[
                              styles.moodPill,
                              { backgroundColor: moodInfo.color + '1A', borderColor: moodInfo.color + '55' },
                            ]}>
                              <View style={[styles.moodDot, { backgroundColor: moodInfo.color }]} />
                              <Text style={[styles.moodLabel, { color: moodInfo.color }]}>
                                {moodInfo.label}
                              </Text>
                            </View>
                            <View style={[styles.scoreDot, { backgroundColor: dotColor }]} />
                            <Ionicons name="chevron-forward" size={13} color={C.border} />
                          </View>
                        </View>
                        <Text style={styles.excerpt} numberOfLines={2}>{entry.text}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {showSort && (
        <View style={[StyleSheet.absoluteFill, styles.sortRoot]}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.sortOverlay, { opacity: overlayOpacity }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeSort()} />
          </Animated.View>
          <Animated.View
            style={[
              styles.sortSheet,
              { transform: [{ translateY: sheetY }], paddingBottom: botInset + 16 },
            ]}
          >
            <View style={styles.sortHandle} />
            <Text style={styles.sortTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt, idx) => (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [
                  styles.sortOption,
                  idx < SORT_OPTIONS.length - 1 && styles.sortOptionBorder,
                  pressed && { opacity: 0.68 },
                ]}
                onPress={() => pickSort(opt.key)}
              >
                <Text style={[
                  styles.sortLabel,
                  sortMode === opt.key && { color: C.lavender, fontFamily: 'Inter_600SemiBold' },
                ]}>
                  {opt.label}
                </Text>
                {sortMode === opt.key ? (
                  <View style={[styles.checkCircle, { backgroundColor: C.lavender }]}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={[styles.checkCircle, styles.checkEmpty, { borderColor: C.border }]} />
                )}
              </Pressable>
            ))}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 16 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    title: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: C.text },
    iconBtn: {
      width: 38, height: 38, borderRadius: 13,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },

    emptyState: { paddingTop: 80, alignItems: 'center' },
    emptyText: {
      fontSize: 16, fontFamily: 'Lora_400Regular_Italic', color: C.textMuted,
    },

    monthLabel: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 2, marginBottom: 8,
    },
    monthGroup: {
      backgroundColor: C.card, borderRadius: 20,
      borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    entryRow: {
      flexDirection: 'row', alignItems: 'stretch',
    },
    entryRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    moodBar: {
      width: 3, opacity: 0.7,
    },
    entryContent: {
      flex: 1, paddingVertical: 15, paddingHorizontal: 14, gap: 7,
    },
    entryTop: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    entryDate: {
      fontSize: 11, fontFamily: 'Inter_700Bold',
      color: C.textSub, letterSpacing: 0.4,
    },
    entryBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    moodPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 100, borderWidth: 1,
    },
    moodDot: { width: 5, height: 5, borderRadius: 2.5 },
    moodLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
    scoreDot: { width: 7, height: 7, borderRadius: 3.5 },
    excerpt: {
      fontSize: 14, fontFamily: 'Lora_400Regular_Italic',
      color: C.textMuted, lineHeight: 21,
    },

    sortRoot: { zIndex: 50 },
    sortOverlay: { backgroundColor: 'rgba(0,0,0,0.5)' },
    sortSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.card,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
      borderColor: C.border,
      paddingTop: 12, paddingHorizontal: 20,
    },
    sortHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.border, alignSelf: 'center', marginBottom: 12,
    },
    sortTitle: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.2, marginBottom: 4,
    },
    sortOption: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingVertical: 15,
    },
    sortOptionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    sortLabel: {
      fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text,
    },
    checkCircle: {
      width: 22, height: 22, borderRadius: 11,
      alignItems: 'center', justifyContent: 'center',
    },
    checkEmpty: { borderWidth: 1.5 },
  });
}
