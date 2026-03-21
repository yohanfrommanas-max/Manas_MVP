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
import { useCognitiveScores } from '@/hooks/useCognitiveScores';
import { getTodayPrompt, getGradientIndex } from '@/data/journalPrompts';
import { formatEntryDateShort, toDateStr } from '@/utils/dateHelpers';
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

function getScoreTier(score: number): 'above' | 'average' | 'below' {
  if (score >= 75) return 'above';
  if (score >= 55) return 'average';
  return 'below';
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

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry } = useApp();
  const { getScoreForDate } = useCognitiveScores();

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

        <View style={styles.streakRow}>
          <View style={styles.streakLeft}>
            <Ionicons name="flame" size={18} color={C.gold} />
            <Text style={styles.streakText}>
              {journalStreak} day streak
            </Text>
          </View>
          <Text style={styles.entriesCount}>
            {journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.92 }]}
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
            <Ionicons name="bookmark-outline" size={18} color={C.textSub} />
          </View>
          <Text style={styles.heroPrompt} numberOfLines={4}>
            {todayPrompt.text}
          </Text>
          <View style={styles.heroBottomRow}>
            <View style={{ flex: 1 }} />
            {todayEntry ? (
              <View style={styles.editedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={C.moodEnergized} />
                <Text style={[styles.editedText, { color: C.moodEnergized }]}>Written today</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={C.textSub} />
            )}
          </View>
        </Pressable>

        {journalEntries.length > 0 && (
          <Text style={styles.sectionTitle}>Previous entries</Text>
        )}

        {journalEntries.length === 0 ? (
          <Text style={styles.emptyLine}>Your first entry is waiting.</Text>
        ) : (
          pastEntries.map(entry => {
            const moodInfo = MOOD_DATA[entry.mood as JournalMood] ?? MOOD_DATA.focused;
            const scoreData = getScoreForDate(entry.date);
            const tier = scoreData && scoreData.gamesPlayed > 0 ? getScoreTier(scoreData.score) : null;
            const dotColor = tier === 'above' ? C.insightBarAbove : tier === 'average' ? C.insightBarAverage : tier === 'below' ? C.insightBarBelow : C.border;
            return (
              <Pressable
                key={entry.id}
                style={({ pressed }) => [styles.entryRow, pressed && { opacity: 0.75 }]}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })}
              >
                <View style={styles.entryLeft}>
                  <Text style={styles.entryDate}>{formatEntryDateShort(entry.timestamp)}</Text>
                  <Text style={styles.entryExcerpt} numberOfLines={1}>{entry.text}</Text>
                </View>
                <View style={styles.entryRight}>
                  <View style={[styles.moodPill, { backgroundColor: moodInfo.color + '25', borderColor: moodInfo.color + '50' }]}>
                    <Text style={[styles.moodPillText, { color: moodInfo.color }]}>{moodInfo.label}</Text>
                  </View>
                  <View style={[styles.scoreDot, { backgroundColor: dotColor }]} />
                  <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 14 },
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
    streakRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    streakText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
    entriesCount: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
    heroCard: {
      height: 220, borderRadius: 22, overflow: 'hidden',
      padding: 20, justifyContent: 'space-between',
    },
    heroTopRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    heroCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5,
    },
    heroPrompt: {
      fontSize: 22, fontFamily: 'Lora_700Bold',
      color: C.text, lineHeight: 32, flex: 1, marginVertical: 12,
    },
    heroBottomRow: {
      flexDirection: 'row', alignItems: 'center',
    },
    editedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    editedText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text },
    emptyLine: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: C.textMuted, textAlign: 'center', paddingTop: 32,
    },
    entryRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, paddingHorizontal: 16,
      backgroundColor: C.card, borderRadius: 14,
      borderWidth: 1, borderColor: C.border,
    },
    entryLeft: { flex: 1, gap: 4 },
    entryDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textSub },
    entryExcerpt: { fontSize: 14, fontFamily: 'Lora_400Regular', color: C.text, lineHeight: 20 },
    entryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    moodPill: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
      borderWidth: 1,
    },
    moodPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    scoreDot: { width: 8, height: 8, borderRadius: 4 },
  });
}
