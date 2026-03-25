import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { useCognitiveScores } from '@/hooks/useCognitiveScores';
import { formatEntryDate, wordCount, readingTime } from '@/utils/dateHelpers';

function getMoodData(C: Colors): Record<JournalMood, { color: string; label: string }> {
  return {
    calm: { color: C.moodCalm, label: 'Calm' },
    focused: { color: C.moodFocused, label: 'Focused' },
    anxious: { color: C.moodAnxious, label: 'Anxious' },
    tired: { color: C.moodTired, label: 'Tired' },
    energized: { color: C.moodEnergized, label: 'Energized' },
  };
}

export default function JournalDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry, deleteJournalEntry } = useApp();
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'This entry will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteJournalEntry(entry.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  };

  const dateStr = formatEntryDate(entry.timestamp);
  const wc = wordCount(entry.text);
  const rt = readingTime(entry.text);

  const cogScore = getScoreForDate(entry.date);
  const cogDelta = scoreDeltaForDate(entry.date);
  const hasGames = cogScore && cogScore.gamesPlayed > 0;
  const scoreWidthPct = hasGames ? `${Math.round(cogScore.score)}%` : '0%';

  const deltaStr = cogDelta === null ? null :
    cogDelta > 0 ? `+${cogDelta} vs avg` :
    cogDelta < 0 ? `${cogDelta} vs avg` : 'At average';

  const scoreColor = hasGames
    ? (cogScore.score >= 75 ? C.insightBarAbove : cogScore.score >= 55 ? C.insightBarAverage : C.insightBarBelow)
    : C.border;

  const hasTags = !!(entry.tags && entry.tags.length > 0);
  const hasTitle = !!(entry.title && entry.title.trim());

  return (
    <View style={styles.container}>
      <View style={[styles.moodStrip, { backgroundColor: moodColor, height: 4 }]} />

      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: topInset + 12,
          paddingBottom: botInset + 40,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.headerDate} numberOfLines={1}>{dateStr}</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerBtn} onPress={toggleStar} hitSlop={8}>
              <Ionicons
                name={entry.starred ? 'star' : 'star-outline'}
                size={20}
                color={entry.starred ? C.gold : C.textSub}
              />
            </Pressable>
            <Pressable style={styles.headerBtn} onPress={handleDelete} hitSlop={8} testID="entry-delete-btn">
              <Ionicons name="trash-outline" size={18} color={C.error} />
            </Pressable>
          </View>
        </View>

        {hasTitle && (
          <Text style={styles.entryTitle}>{entry.title}</Text>
        )}

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <View style={[styles.moodPill, { backgroundColor: moodColor + '22', borderColor: moodColor + '50' }]}>
              <View style={[styles.moodDot, { backgroundColor: moodColor }]} />
              <Text style={[styles.moodLabel, { color: moodColor }]}>{moodInfo.label}</Text>
            </View>
            <Text style={styles.readingMeta}>
              {wc} {wc === 1 ? 'word' : 'words'} · {rt}
            </Text>
          </View>

          {hasTags && (
            <View style={styles.tagsRow}>
              {entry.tags!.map(tag => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: C.gold + '14', borderColor: C.gold + '55' }]}>
                  <Text style={[styles.tagText, { color: C.gold }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {entry.prompt ? (
          <View style={styles.promptBlock}>
            {entry.promptCategory ? (
              <Text style={styles.promptCategory}>{entry.promptCategory.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.promptQuoteMark}>{'\u201C'}</Text>
            <Text style={styles.promptText}>{entry.prompt}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        <Text style={styles.entryText}>{entry.text}</Text>

        <Pressable
          style={styles.insightCard}
          onPress={() => router.push('/(tabs)/progress' as any)}
          testID="insight-card"
        >
          <Text style={styles.insightLabel}>YOUR MIND THAT DAY</Text>

          {hasGames ? (
            <>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreNum, { color: scoreColor }]}>{cogScore.score}</Text>
                {deltaStr && (
                  <View style={[styles.deltaBadge, { backgroundColor: scoreColor + '20' }]}>
                    <Text style={[styles.scoreDelta, { color: scoreColor }]}>{deltaStr}</Text>
                  </View>
                )}
              </View>
              <View style={styles.scoreBarTrack}>
                <View style={[styles.scoreBarFill, { width: scoreWidthPct, backgroundColor: scoreColor }]} />
              </View>
            </>
          ) : (
            <Text style={styles.noGamesText}>No brain games played that day.</Text>
          )}

          <View style={styles.insightFooter}>
            <Text style={styles.insightFooterText}>View Progress</Text>
            <Ionicons name="chevron-forward" size={11} color={C.textMuted} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    moodStrip: { width: '100%' },
    content: { paddingHorizontal: 20, gap: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    headerDate: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text, textAlign: 'center' },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    entryTitle: {
      fontSize: 26, fontFamily: 'Lora_700Bold',
      color: C.text, lineHeight: 34, letterSpacing: -0.3,
    },
    metaBlock: { gap: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    moodPill: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 100, borderWidth: 1,
    },
    moodDot: { width: 6, height: 6, borderRadius: 3 },
    moodLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    readingMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tagPill: {
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 100, borderWidth: 1,
    },
    tagText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
    promptBlock: { gap: 0 },
    promptCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5, marginBottom: 4,
    },
    promptQuoteMark: {
      fontSize: 40, fontFamily: 'Lora_700Bold',
      color: C.journalAccent, lineHeight: 30, opacity: 0.45,
      marginBottom: 2,
    },
    promptText: {
      fontSize: 15, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 24,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
    entryText: {
      fontSize: 18, fontFamily: 'Lora_400Regular',
      color: C.text, lineHeight: 30,
    },
    insightCard: {
      backgroundColor: C.backgroundElevated, borderRadius: 18,
      borderWidth: 1, borderColor: C.border,
      padding: 18, gap: 12, marginTop: 4,
    },
    insightLabel: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 2,
    },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    scoreNum: { fontSize: 38, fontFamily: 'Inter_700Bold' },
    deltaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
    scoreDelta: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    scoreBarTrack: {
      height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden',
    },
    scoreBarFill: { height: 6, borderRadius: 3 },
    noGamesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
    insightFooter: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    insightFooterText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textMuted },
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub },
  });
}
