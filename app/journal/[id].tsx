import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, DARK, type Colors } from '@/constants/colors';
const C = DARK;

const MOOD_COLORS: Record<number, string> = {
  1: '#94A3B8', 2: '#7DD3FC', 3: '#FDE68A', 4: '#FCD34D', 5: '#F59E0B',
};

const MOOD_ICONS: Record<number, string> = {
  1: 'emoticon-cry-outline', 2: 'emoticon-sad-outline', 3: 'emoticon-neutral-outline',
  4: 'emoticon-happy-outline', 5: 'emoticon-excited-outline',
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Awful', 2: 'Down', 3: 'Okay', 4: 'Good', 5: 'Great',
};

export default function JournalDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry, user } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const entry = journalEntries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <LinearGradient colors={['#2A0D1A', C.bg]} style={StyleSheet.absoluteFill} />
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Entry not found</Text>
        </View>
      </View>
    );
  }

  const toggleStar = () => {
    updateJournalEntry(entry.id, { starred: !entry.starred });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const moodColor = MOOD_COLORS[entry.mood] ?? C.textSub;
  const dateStr = new Date(entry.timestamp).toLocaleDateString('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = new Date(entry.timestamp).toLocaleTimeString('en', {
    hour: '2-digit', minute: '2-digit',
  });

  const isPremium = user?.plan === 'premium';

  return (
    <View style={styles.container}>
      <LinearGradient colors={[moodColor + '20', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 12, paddingBottom: botInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Pressable style={styles.starBtn} onPress={toggleStar} hitSlop={8}>
            <Ionicons name={entry.starred ? 'star' : 'star-outline'} size={22} color={entry.starred ? C.gold : C.textSub} />
          </Pressable>
        </View>

        {/* Date & mood */}
        <View style={styles.metaBlock}>
          <View style={[styles.moodPill, { backgroundColor: moodColor + '20', borderColor: moodColor + '40' }]}>
            <MaterialCommunityIcons name={MOOD_ICONS[entry.mood] as any} size={16} color={moodColor} />
            <Text style={[styles.moodLabel, { color: moodColor }]}>{MOOD_LABELS[entry.mood]}</Text>
          </View>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.timeText}>{timeStr}</Text>
        </View>

        {/* Prompt */}
        {entry.prompt ? (
          <View style={styles.promptBox}>
            <LinearGradient colors={[C.rose + '15', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.promptBadge}>
              <Ionicons name="sparkles" size={11} color={C.rose} />
              <Text style={styles.promptBadgeText}>Prompt</Text>
            </View>
            <Text style={styles.promptText}>{entry.prompt}</Text>
          </View>
        ) : null}

        {/* Entry text */}
        <View style={styles.entryBox}>
          <Text style={styles.entryText}>{entry.content}</Text>
        </View>

        {/* AI Reflection */}
        {entry.aiLoading ? (
          <View style={styles.reflectCard}>
            <LinearGradient colors={[C.lavender + '15', C.wisteria + '08']} style={StyleSheet.absoluteFill} />
            <View style={styles.reflectHeader}>
              <Ionicons name="sparkles" size={14} color={C.lavender} />
              <Text style={styles.reflectTitle}>Manas reflects…</Text>
            </View>
            <View style={styles.shimmerRow}>
              <View style={[styles.shimmer, { width: '90%' }]} />
              <View style={[styles.shimmer, { width: '75%' }]} />
              <View style={[styles.shimmer, { width: '60%' }]} />
            </View>
          </View>
        ) : entry.aiReflection ? (
          <View style={styles.reflectCard}>
            <LinearGradient colors={[C.lavender + '15', C.wisteria + '08']} style={StyleSheet.absoluteFill} />
            <View style={styles.reflectHeader}>
              <Ionicons name="sparkles" size={14} color={C.lavender} />
              <Text style={styles.reflectTitle}>Manas reflects…</Text>
            </View>
            {isPremium ? (
              <Text style={styles.reflectText}>{entry.aiReflection}</Text>
            ) : (
              <View>
                <Text style={[styles.reflectText, { opacity: 0.15 }]} numberOfLines={3}>
                  {entry.aiReflection}
                </Text>
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={20} color={C.lavender} />
                  <Text style={styles.lockText}>Unlock with Premium</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  starBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  metaBlock: { gap: 6 },
  moodPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1,
  },
  moodLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dateText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  timeText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  promptBox: {
    borderRadius: 16, padding: 16, gap: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.rose + '30', backgroundColor: C.card,
  },
  promptBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  promptBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.rose },
  promptText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22, fontStyle: 'italic' },
  entryBox: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  entryText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 28 },
  reflectCard: {
    borderRadius: 18, padding: 18, gap: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.lavender + '30', backgroundColor: C.card,
  },
  reflectHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reflectTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.lavender },
  reflectText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 25 },
  shimmerRow: { gap: 8 },
  shimmer: { height: 12, borderRadius: 6, backgroundColor: C.lavender + '25' },
  lockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.card + 'CC',
  },
  lockText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.lavender },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub },
});
}
