import React, { useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  FlatList, ImageBackground, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { getTodayPrompt, getTodayQuote, getGradientIndex } from '@/data/journalPrompts';
import { JOURNAL_IMAGES } from '@/data/journalImages';
import { formatEntryDateShort, formatMonthYear, toDateStr } from '@/utils/dateHelpers';
import type { JournalMood } from '@/context/AppContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 48;

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

function TodayPromptCard() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { journalEntries } = useApp();
  const todayPrompt = getTodayPrompt();
  const journalStreak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);
  const todayStr = toDateStr();
  const todayEntry = journalEntries.find(e => e.date === todayStr);
  const imgSrc = JOURNAL_IMAGES[todayPrompt.imageAsset];

  const handlePress = () => {
    if (todayEntry) {
      router.push({ pathname: '/journal/[id]', params: { id: todayEntry.id } });
    } else {
      router.push({
        pathname: '/journal/prompt-detail' as any,
        params: {
          prompt: todayPrompt.text,
          reflect: todayPrompt.reflect,
          category: todayPrompt.category,
          imageAsset: todayPrompt.imageAsset,
        },
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width: CARD_W }, pressed && { opacity: 0.93 }]}
      onPress={handlePress}
    >
      <ImageBackground source={imgSrc} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.cardTop}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardCategoryLabel}>{todayPrompt.category.toUpperCase()}</Text>
            {todayEntry ? (
              <View style={styles.writtenBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
                <Text style={styles.writtenText}>Written</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardQuoteMark}>{'\u201C'}</Text>
          <Text style={styles.cardPromptText} numberOfLines={3}>{todayPrompt.text}</Text>
          <View style={styles.cardFooterRow}>
            <View style={styles.streakChip}>
              <Ionicons name="flame" size={12} color={C.gold} />
              <Text style={styles.streakText}>
                {journalStreak} {journalStreak === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {!todayEntry && (
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap to write</Text>
                <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function TodayQuoteCard({ gradientIdx }: { gradientIdx: number }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const todayQuote = getTodayQuote();
  const gradientPair = C.promptCardGradients[gradientIdx];

  return (
    <View style={[styles.card, { width: CARD_W }]}>
      <LinearGradient
        colors={gradientPair}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.quoteCardInner}>
        <Text style={styles.quoteQuoteMark}>{'\u201C'}</Text>
        <Text style={styles.quoteText}>{todayQuote.text}</Text>
        <Text style={styles.quoteAuthor}>— {todayQuote.author}</Text>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const gradientIdx = getGradientIndex();
  const todayStr = toDateStr();
  const todayEntry = journalEntries.find(e => e.date === todayStr);

  const pastEntries = journalEntries.filter(e => e.id !== todayEntry?.id);
  const grouped = useMemo(() => groupByMonth(pastEntries), [pastEntries]);
  const entryById = useMemo(() => {
    const m: Record<string, typeof journalEntries[0]> = {};
    for (const e of journalEntries) m[e.id] = e;
    return m;
  }, [journalEntries]);

  const heroCards = useMemo(() => [
    { key: 'prompt' },
    { key: 'quote' },
  ], []);

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
          <Pressable
            style={styles.bankBtn}
            onPress={() => router.push('/journal/prompt-bank' as any)}
          >
            <Ionicons name="library-outline" size={19} color={C.text} />
          </Pressable>
        </View>

        <View style={styles.heroSection}>
          <FlatList
            data={heroCards}
            keyExtractor={item => item.key}
            horizontal
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={CARD_W + 16}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.heroCardsRow}
            renderItem={({ item }) => {
              if (item.key === 'prompt') {
                return <TodayPromptCard />;
              }
              return <TodayQuoteCard gradientIdx={gradientIdx} />;
            }}
          />

          <Pressable
            style={styles.freeWriteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/journal/new' as any, params: { promptless: 'true' } });
            }}
          >
            <Ionicons name="pencil-outline" size={15} color={C.textSub} />
            <Text style={styles.freeWriteBtnText}>Write freely</Text>
          </Pressable>
        </View>

        {journalEntries.length === 0 && (
          <Text style={styles.emptyLine}>Your first entry is waiting.</Text>
        )}

        {grouped.map(({ month, ids }) => (
          <View key={month}>
            <Text style={styles.monthLabel}>{month.toUpperCase()}</Text>
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
    content: { gap: 16 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingBottom: 4,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    bankBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

    heroSection: { gap: 12 },
    heroCardsRow: {
      paddingHorizontal: 20, gap: 16,
      paddingRight: 32,
    },
    card: {
      height: 280, borderRadius: 24, overflow: 'hidden',
    },
    cardTop: {
      padding: 18,
    },
    cardTopRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    cardCategoryLabel: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: 'rgba(255,255,255,0.6)', letterSpacing: 1.8,
    },
    writtenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    writtenText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
    cardBottom: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: 18, gap: 4,
    },
    cardQuoteMark: {
      fontSize: 40, fontFamily: 'Lora_700Bold',
      color: 'rgba(255,255,255,0.4)', lineHeight: 30,
      marginBottom: 4,
    },
    cardPromptText: {
      fontSize: 19, fontFamily: 'Lora_700Bold',
      color: '#FFFFFF', lineHeight: 27,
    },
    cardFooterRow: {
      flexDirection: 'row', alignItems: 'center', marginTop: 10,
    },
    streakChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    streakText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.7)' },
    tapHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tapHintText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)' },

    quoteCardInner: {
      flex: 1, padding: 22, justifyContent: 'center', gap: 8,
    },
    quoteQuoteMark: {
      fontSize: 52, fontFamily: 'Lora_700Bold',
      color: C.textSub, lineHeight: 40, opacity: 0.3,
    },
    quoteText: {
      fontSize: 17, fontFamily: 'Lora_400Regular_Italic',
      color: C.text, lineHeight: 26,
    },
    quoteAuthor: {
      fontSize: 12, fontFamily: 'Inter_500Medium',
      color: C.textMuted, marginTop: 8,
    },

    freeWriteBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'center',
      paddingHorizontal: 18, paddingVertical: 9,
      borderRadius: 100, borderWidth: 1, borderColor: C.border,
      backgroundColor: C.card,
    },
    freeWriteBtnText: {
      fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub,
    },

    emptyLine: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: C.textMuted, textAlign: 'center',
      paddingTop: 16, paddingHorizontal: 20,
    },
    monthLabel: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5,
      marginBottom: 8, paddingHorizontal: 20,
    },
    monthGroup: {
      marginHorizontal: 16,
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
