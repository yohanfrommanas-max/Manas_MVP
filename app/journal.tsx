import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { getTodayPrompt, getTodayQuote } from '@/data/journalPrompts';
import { JOURNAL_IMAGES } from '@/data/journalImages';
import { toDateStr } from '@/utils/dateHelpers';

type MoodFilter = 'all' | JournalMood;

const MOOD_FILTERS: { key: MoodFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'calm', label: 'Calm' },
  { key: 'focused', label: 'Focused' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'tired', label: 'Tired' },
  { key: 'energized', label: 'Energized' },
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

function formatRowDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase();
}

function FrostPill({ children }: { children: React.ReactNode }) {
  const inner = <View style={pillInner}>{children}</View>;
  if (Platform.OS === 'ios') {
    return <BlurView intensity={18} tint="dark" style={pillWrap}>{inner}</BlurView>;
  }
  return <View style={[pillWrap, { backgroundColor: 'rgba(0,0,0,0.48)' }]}>{inner}</View>;
}

const pillWrap = { borderRadius: 100, overflow: 'hidden' } as const;
const pillInner = {
  flexDirection: 'row' as const, alignItems: 'center' as const,
  gap: 5, paddingHorizontal: 11, paddingVertical: 5,
};

function PromptCard() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { journalEntries } = useApp();
  const todayPrompt = getTodayPrompt();
  const todayStr = toDateStr();
  const todayEntry = useMemo(
    () => journalEntries.find(e => e.date === todayStr),
    [journalEntries, todayStr],
  );
  const imgSrc = JOURNAL_IMAGES[todayPrompt.imageAsset];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (todayEntry) {
      router.push({ pathname: '/journal/[id]' as Href, params: { id: todayEntry.id } });
    } else {
      router.push({
        pathname: '/journal/prompt-detail' as Href,
        params: {
          prompt: todayPrompt.text,
          reflect: todayPrompt.reflect,
          category: todayPrompt.category,
          imageAsset: todayPrompt.imageAsset,
        },
      });
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.promptCard, pressed && { opacity: 0.93 }]}
      onPress={handlePress}
    >
      <ImageBackground source={imgSrc} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,6,26,0.18)' }]} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.80)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.1 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={styles.cardTop}>
        <FrostPill>
          <Text style={styles.categoryLabel}>{todayPrompt.category.toUpperCase()}</Text>
        </FrostPill>
        {todayEntry && (
          <FrostPill>
            <View style={[styles.greenDot, { backgroundColor: C.success }]} />
            <Text style={styles.writtenLabel}>Written</Text>
          </FrostPill>
        )}
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.eyebrow}>Today's prompt</Text>
        <Text style={styles.promptText} numberOfLines={4}>{todayPrompt.text}</Text>
        {!todayEntry && (
          <View style={styles.tapHintRow}>
            <Text style={styles.tapHintText}>Tap to explore</Text>
            <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.5)" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const inkStyles = StyleSheet.create({
  card: {
    backgroundColor: '#18160F', borderRadius: 20,
    padding: 24, overflow: 'hidden',
  },
  watermark: {
    position: 'absolute', top: -6, left: 14,
    fontSize: 100, fontFamily: 'Lora_700Bold',
    color: '#F59E0B', opacity: 0.09, lineHeight: 100,
  },
  eyebrow: {
    fontSize: 9, fontFamily: 'Inter_600SemiBold',
    color: '#F59E0B', letterSpacing: 2, marginBottom: 12,
  },
  quote: {
    fontSize: 15, fontFamily: 'Lora_400Regular_Italic',
    color: '#FEFCF9', lineHeight: 25, marginBottom: 16,
  },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { width: 20, height: 1, backgroundColor: '#F59E0B', opacity: 0.4 },
  author: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(254,252,249,0.4)' },
});

function InkQuoteCard() {
  const quote = getTodayQuote();
  return (
    <View style={inkStyles.card}>
      <Text style={inkStyles.watermark}>{'\u201C'}</Text>
      <Text style={inkStyles.eyebrow}>TODAY'S WORDS</Text>
      <Text style={inkStyles.quote}>{quote.text}</Text>
      <View style={inkStyles.footer}>
        <View style={inkStyles.line} />
        <Text style={inkStyles.author}>{quote.author}</Text>
      </View>
    </View>
  );
}

function EntryRow({
  entry,
  moodInfo,
  isLast,
}: {
  entry: JournalEntry;
  moodInfo: { color: string; label: string };
  isLast: boolean;
}) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.entryRow,
        !isLast && styles.entryRowBorder,
        pressed && { opacity: 0.7, backgroundColor: C.cardAlt },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/journal/[id]' as Href, params: { id: entry.id } });
      }}
    >
      <View style={[styles.entryMoodBar, { backgroundColor: moodInfo.color }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryTop}>
          <Text style={styles.entryDateStr}>{formatRowDate(entry.date)}</Text>
          <View style={styles.entryBadges}>
            <View style={[
              styles.moodPill,
              { backgroundColor: moodInfo.color + '1A', borderColor: moodInfo.color + '55' },
            ]}>
              <View style={[styles.moodDot, { backgroundColor: moodInfo.color }]} />
              <Text style={[styles.moodLabel, { color: moodInfo.color }]}>{moodInfo.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={12} color={C.border} />
          </View>
        </View>
        {!!entry.title && (
          <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
        )}
        <Text style={styles.entryExcerpt} numberOfLines={2}>{entry.text}</Text>
        {!!(entry.tags && entry.tags.length > 0) && (
          <View style={styles.entryTagsRow}>
            {entry.tags.slice(0, 3).map(tag => (
              <View key={tag} style={[styles.entryTag, { borderColor: C.border }]}>
                <Text style={styles.entryTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_DATA = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const streak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);

  const filteredEntries = useMemo(() => {
    const sorted = [...journalEntries].sort((a, b) => b.timestamp - a.timestamp);
    if (selectedMood === 'all') return sorted;
    return sorted.filter(e => e.mood === selectedMood);
  }, [journalEntries, selectedMood]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, {
          paddingTop: topInset + 20,
          paddingBottom: botInset + 100,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="chevron-down" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Journal</Text>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconBtnSm}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/journal/insights' as Href);
              }}
            >
              <Ionicons name="bar-chart-outline" size={18} color={C.text} />
            </Pressable>
            <Pressable
              style={styles.iconBtnSm}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/journal/entries' as Href);
              }}
            >
              <Ionicons name="list-outline" size={18} color={C.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.streakRow}>
          <Ionicons name="flame" size={15} color={C.gold} />
          <Text style={styles.streakText}>
            {streak === 0
              ? 'Start your streak'
              : `${streak} ${streak === 1 ? 'day' : 'days'} streak`}
          </Text>
        </View>

        <PromptCard />

        <InkQuoteCard />

        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {MOOD_FILTERS.map(({ key, label }) => {
              const isActive = selectedMood === key;
              const moodColor = key !== 'all' ? MOOD_DATA[key as JournalMood].color : C.lavender;
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.filterChip,
                    isActive
                      ? { backgroundColor: moodColor, borderColor: moodColor }
                      : { backgroundColor: C.card, borderColor: C.border },
                  ]}
                  onPress={() => {
                    setSelectedMood(key);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.filterChipText,
                    isActive ? { color: '#FFFFFF' } : { color: C.textSub },
                  ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={styles.promptBankRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/journal/prompt-bank' as Href);
            }}
          >
            <Ionicons name="library-outline" size={13} color={C.textMuted} />
            <Text style={styles.promptBankText}>Explore prompt bank</Text>
            <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
          </Pressable>
        </View>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {journalEntries.length === 0 ? 'No entries yet' : 'No entries for this mood'}
            </Text>
          </View>
        ) : (
          <View style={styles.entriesCard}>
            {filteredEntries.slice(0, 15).map((entry, idx) => {
              const moodInfo = MOOD_DATA[entry.mood as JournalMood] ?? MOOD_DATA.focused;
              return (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  moodInfo={moodInfo}
                  isLast={idx === Math.min(filteredEntries.length, 15) - 1}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: botInset + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: '/journal/new' as Href, params: { promptless: 'true' } });
        }}
        testID="journal-fab"
      >
        <Ionicons name="pencil" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 20 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    },
    title: { flex: 1, fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' },
    iconBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },
    headerRight: { flexDirection: 'row', gap: 8 },
    iconBtnSm: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },

    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    streakText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub },

    promptCard: {
      minHeight: 280, borderRadius: 26, overflow: 'hidden',
      justifyContent: 'space-between',
    },
    cardTop: {
      flexDirection: 'row', alignItems: 'flex-start',
      justifyContent: 'space-between', padding: 18,
    },
    categoryLabel: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: 'rgba(255,255,255,0.85)', letterSpacing: 1.6,
    },
    greenDot: { width: 6, height: 6, borderRadius: 3 },
    writtenLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
    cardBottom: { padding: 20, gap: 6 },
    eyebrow: {
      fontSize: 13, fontFamily: 'Lora_400Regular_Italic',
      color: 'rgba(255,255,255,0.55)',
    },
    promptText: {
      fontSize: 20, fontFamily: 'Lora_700Bold',
      color: '#FFFFFF', lineHeight: 29,
    },
    tapHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    tapHintText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)' },

    filtersSection: { gap: 10 },
    filtersRow: { gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 100, borderWidth: 1,
    },
    filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    promptBankRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2,
    },
    promptBankText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },

    emptyState: { paddingVertical: 32, alignItems: 'center' },
    emptyText: { fontSize: 15, fontFamily: 'Lora_400Regular_Italic', color: C.textMuted },

    entriesCard: {
      backgroundColor: C.card, borderRadius: 20,
      borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    entryRow: { flexDirection: 'row', alignItems: 'stretch' },
    entryRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    entryMoodBar: { width: 3, opacity: 0.7 },
    entryContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 },
    entryTop: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    entryDateStr: { fontSize: 11, fontFamily: 'Inter_700Bold', color: C.textSub, letterSpacing: 0.4 },
    entryBadges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    moodPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 100, borderWidth: 1,
    },
    moodDot: { width: 5, height: 5, borderRadius: 2.5 },
    moodLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
    entryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
    entryExcerpt: {
      fontSize: 13, fontFamily: 'Lora_400Regular_Italic',
      color: C.textMuted, lineHeight: 20,
    },
    entryTagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 2 },
    entryTag: {
      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, borderWidth: 1,
    },
    entryTagText: { fontSize: 9, fontFamily: 'Inter_500Medium', color: C.textMuted },

    fab: {
      position: 'absolute', right: 24,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: C.lavender,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: C.lavender, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4, shadowRadius: 12,
      elevation: 8,
    },
  });
}
