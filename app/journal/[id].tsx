import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { useCognitiveScores } from '@/hooks/useCognitiveScores';
import { formatEntryDate } from '@/utils/dateHelpers';

function getMoodData(C: Colors): Record<JournalMood, { color: string; label: string }> {
  return {
    calm: { color: C.moodCalm, label: 'Calm' },
    focused: { color: C.moodFocused, label: 'Focused' },
    anxious: { color: C.moodAnxious, label: 'Anxious' },
    tired: { color: C.moodTired, label: 'Tired' },
    energized: { color: C.moodEnergized, label: 'Energized' },
  };
}

const SCORE_SEGMENTS = 10;

export default function JournalDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry } = useApp();
  const { getScoreForDate, scoreDeltaForDate } = useCognitiveScores();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const entry = journalEntries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Pressable style={[styles.backBtn, { margin: 20 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Entry not found</Text>
        </View>
      </View>
    );
  }

  const moodInfo = MOOD_DATA[entry.mood] ?? MOOD_DATA.focused;
  const moodColor = moodInfo.color;

  const toggleStar = () => {
    updateJournalEntry(entry.id, { starred: !entry.starred });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dateStr = formatEntryDate(entry.timestamp);

  const cogScore = getScoreForDate(entry.date);
  const cogDelta = scoreDeltaForDate(entry.date);
  const hasGames = cogScore && cogScore.gamesPlayed > 0;
  const filledSegments = hasGames ? Math.round((cogScore.score / 100) * SCORE_SEGMENTS) : 0;

  const deltaStr = cogDelta === null ? null :
    cogDelta > 0 ? `+${cogDelta} above avg` :
    cogDelta < 0 ? `${cogDelta} below avg` : 'At average';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[moodColor + '30', C.bg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.35 }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: topInset + 12,
          paddingBottom: botInset + 40,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.headerDate} numberOfLines={1}>{dateStr}</Text>
          <Pressable style={styles.starBtn} onPress={toggleStar} hitSlop={8}>
            <Ionicons
              name={entry.starred ? 'star' : 'star-outline'}
              size={20}
              color={entry.starred ? C.gold : C.textSub}
            />
          </Pressable>
        </View>

        <View style={styles.metaBlock}>
          <View style={[styles.moodPill, { backgroundColor: moodColor + '22', borderColor: moodColor + '50' }]}>
            <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
            <Text style={[styles.moodLabel, { color: moodColor }]}>{moodInfo.label}</Text>
          </View>
        </View>

        {entry.prompt ? (
          <View style={styles.promptBox}>
            <Text style={styles.promptCategory}>{(entry.promptCategory || 'Reflection').toUpperCase()}</Text>
            <Text style={styles.promptText}>{entry.prompt}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.entryBox}>
          <Text style={styles.entryText}>{entry.text}</Text>
        </View>

        <Pressable
          style={styles.insightCard}
          onPress={() => router.push('/(tabs)/progress' as any)}
          testID="insight-card"
        >
          <Text style={styles.insightLabel}>YOUR MIND THAT DAY</Text>
          {hasGames ? (
            <>
              <View style={styles.scoreBarRow}>
                {Array.from({ length: SCORE_SEGMENTS }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.scoreSegment,
                      {
                        backgroundColor: i < filledSegments
                          ? (cogScore.score >= 75 ? C.insightBarAbove : cogScore.score >= 55 ? C.insightBarAverage : C.insightBarBelow)
                          : C.border,
                      },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.scoreTextRow}>
                <Text style={styles.scoreNum}>{cogScore.score}</Text>
                {deltaStr && (
                  <Text style={[styles.scoreDelta, {
                    color: cogDelta! > 0 ? C.insightBarAbove : cogDelta! < 0 ? C.insightBarBelow : C.insightBarAverage,
                  }]}>
                    {deltaStr}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.noGamesText}>No games played — nothing to compare.</Text>
          )}
          <View style={styles.insightFooter}>
            <Text style={styles.insightFooterText}>View Progress</Text>
            <Ionicons name="chevron-forward" size={12} color={C.textMuted} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 18 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    headerDate: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    starBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    metaBlock: { gap: 8 },
    moodPill: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 100, borderWidth: 1,
    },
    moodDot: { width: 6, height: 6, borderRadius: 3 },
    moodLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    dateText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
    promptBox: {
      backgroundColor: C.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: C.border, gap: 6,
    },
    promptCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5,
    },
    promptText: {
      fontSize: 15, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 24,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
    entryBox: { gap: 0 },
    entryText: {
      fontSize: 18, fontFamily: 'Lora_400Regular',
      color: C.text, lineHeight: 30,
    },
    insightCard: {
      backgroundColor: C.backgroundElevated, borderRadius: 16,
      borderWidth: 1, borderColor: C.border,
      padding: 16, gap: 10, marginTop: 6,
    },
    insightLabel: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 2,
    },
    scoreBarRow: { flexDirection: 'row', gap: 4 },
    scoreSegment: { flex: 1, height: 6, borderRadius: 3 },
    scoreTextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    scoreNum: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text },
    scoreDelta: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    noGamesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
    insightFooter: {
      flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4,
    },
    insightFooterText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textMuted },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub },
  });
}
