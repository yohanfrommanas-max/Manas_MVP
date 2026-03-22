import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { getTodayPrompt, getTodayQuote } from '@/data/journalPrompts';
import { JOURNAL_IMAGES } from '@/data/journalImages';
import { toDateStr } from '@/utils/dateHelpers';

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

function FrostPill({ children }: { children: React.ReactNode }) {
  const inner = (
    <View style={pillInner}>{children}</View>
  );
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={18} tint="dark" style={pillWrap}>
        {inner}
      </BlurView>
    );
  }
  return (
    <View style={[pillWrap, { backgroundColor: 'rgba(0,0,0,0.48)' }]}>
      {inner}
    </View>
  );
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

function QuoteBlock() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const quote = getTodayQuote();

  return (
    <View style={styles.quoteBlock}>
      <Text style={styles.quoteWatermark}>{'\u201C'}</Text>
      <View style={styles.quoteInner}>
        <Text style={styles.quoteText}>{quote.text}</Text>
        <Text style={styles.quoteAuthor}>— {quote.author}</Text>
      </View>
    </View>
  );
}

export default function JournalScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const streak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);

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
          <Text style={styles.title}>Journal</Text>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/journal/entries' as Href);
            }}
          >
            <Ionicons name="list-outline" size={20} color={C.text} />
          </Pressable>
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

        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.btnFilled, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/journal/new' as Href, params: { promptless: 'true' } });
            }}
          >
            <Ionicons name="pencil-outline" size={15} color="#FFFFFF" />
            <Text style={styles.btnFilledText}>Write freely</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.72 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/journal/prompt-bank' as Href);
            }}
          >
            <Ionicons name="library-outline" size={15} color={C.text} />
            <Text style={styles.btnGhostText}>Explore prompts</Text>
          </Pressable>
        </View>

        <QuoteBlock />
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, gap: 20 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text },
    iconBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
      alignItems: 'center', justifyContent: 'center',
    },

    streakRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    streakText: {
      fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub,
    },

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
    cardBottom: {
      padding: 20, gap: 6,
    },
    eyebrow: {
      fontSize: 13, fontFamily: 'Lora_400Regular_Italic',
      color: 'rgba(255,255,255,0.55)',
    },
    promptText: {
      fontSize: 20, fontFamily: 'Lora_700Bold',
      color: '#FFFFFF', lineHeight: 29,
    },
    tapHintRow: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
    },
    tapHintText: {
      fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)',
    },

    actionsRow: { flexDirection: 'row', gap: 12 },
    btnFilled: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 14, borderRadius: 16,
      backgroundColor: C.lavender,
    },
    btnFilledText: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF',
    },
    btnGhost: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 7, paddingVertical: 14, borderRadius: 16,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
    },
    btnGhostText: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text,
    },

    quoteBlock: {
      paddingVertical: 6, paddingLeft: 20,
      borderLeftWidth: 2, borderLeftColor: C.journalAccent,
      overflow: 'hidden',
    },
    quoteWatermark: {
      position: 'absolute', top: -18, left: 2,
      fontSize: 100, fontFamily: 'Lora_700Bold',
      color: C.journalAccent, opacity: 0.10,
      lineHeight: 100,
    },
    quoteInner: { gap: 10 },
    quoteText: {
      fontSize: 16, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 26,
    },
    quoteAuthor: {
      fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted,
    },
  });
}
