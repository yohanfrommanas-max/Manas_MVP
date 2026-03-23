import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalMood } from '@/context/AppContext';
import { useColors } from '@/constants/colors';

interface MoodBadgeStyle { bg: string; color: string; label: string }

function getMoodBadgeStyles(C: ReturnType<typeof useColors>): Record<JournalMood, MoodBadgeStyle> {
  return {
    calm: { bg: C.jSageLight, color: C.jSage, label: 'Calm' },
    grateful: { bg: C.jSageLight, color: C.jSage, label: 'Grateful' },
    restless: { bg: C.jEmberLight, color: C.jEmber, label: 'Restless' },
    driven: { bg: C.jGoldLight, color: C.jGold, label: 'Driven' },
    heavy: { bg: C.jStoneAlt, color: C.jInkMuted, label: 'Heavy' },
    reflective: { bg: C.jStoneAlt, color: C.jInkMuted, label: 'Reflective' },
    anxious: { bg: C.jEmberLight, color: C.jEmber, label: 'Anxious' },
  };
}

const REFLECTIONS = [
  { label: 'Evening Reflection', text: 'The practice of observation without judgment is its own form of courage. Each honest entry is a step forward.' },
  { label: 'Gentle Reminder', text: '"Make the best use of what is in your power, and take the rest as it happens." — Epictetus' },
  { label: 'Closing Thought', text: 'Progress rarely looks like perfection. What matters is that you showed up and wrote honestly.' },
  { label: 'Reflection', text: 'Every honest word written here is a small act of self-knowledge. That is enough.' },
  { label: 'Contemplation', text: '"Very little is needed to make a happy life; it is all within yourself, in your way of thinking." — Marcus Aurelius' },
  { label: 'Evening Note', text: 'Clarity is not always found — it is cultivated through steady attention to what is actually present.' },
];

function getReflection(entryId: string) {
  const idx = entryId.charCodeAt(entryId.length - 1) % REFLECTIONS.length;
  return REFLECTIONS[idx];
}

function formatDetailDate(timestamp: number): string {
  const d = new Date(timestamp);
  const weekday = d.toLocaleDateString('en', { weekday: 'long' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('en', { month: 'long' });
  const hour = d.getHours();
  const min = d.getMinutes();
  const ampm = hour < 12 ? 'am' : 'pm';
  const h12 = hour % 12 || 12;
  const minStr = min.toString().padStart(2, '0');
  return `${weekday}, ${dayNum} ${month} · ${h12}:${minStr} ${ampm}`;
}

export default function JournalDetailScreen() {
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { journalEntries, deleteJournalEntry } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const entry = journalEntries.find(e => e.id === id);

  const MOOD_BADGES = useMemo(() => getMoodBadgeStyles(C), [C]);

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: C.jStone, paddingTop: topInset }]}>
        <Pressable style={[styles.btnIcon, { margin: 24, backgroundColor: `${C.jInk}0F` }]} onPress={() => router.back()}>
          <Text style={[styles.backArrow, { color: C.jInkMuted }]}>{'‹'}</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: C.jInkFaint }]}>Entry not found</Text>
        </View>
      </View>
    );
  }

  const moodBadge = MOOD_BADGES[entry.mood] ?? MOOD_BADGES.calm;
  const hasTags = !!(entry.tags && entry.tags.length > 0);
  const hasTitle = !!(entry.title && entry.title.trim());
  const dateStr = formatDetailDate(entry.timestamp);
  const reflection = getReflection(entry.id);
  const bodyParagraphs = entry.text.split(/\n\n+/).filter(p => p.trim());

  const handleMore = () => {
    Alert.alert(
      'Options',
      undefined,
      [
        {
          text: 'Delete Entry',
          style: 'destructive',
          onPress: () => {
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
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.jStone }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: botInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: back circle + three-dot circle */}
        <View style={styles.detailHdNav}>
          <Pressable
            style={[styles.btnIcon, { backgroundColor: `${C.jInk}0F` }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backArrow, { color: C.jInkMuted }]}>{'‹'}</Text>
          </Pressable>
          <Pressable
            style={[styles.btnIcon, { backgroundColor: `${C.jInk}0F` }]}
            onPress={handleMore}
            testID="entry-delete-btn"
          >
            <Text style={[styles.dotsIcon, { color: C.jInkMuted }]}>{'···'}</Text>
          </Pressable>
        </View>

        {/* Date */}
        <Text style={[styles.detailDate, { color: C.jInkFaint }]}>{dateStr.toUpperCase()}</Text>

        {/* Title */}
        {hasTitle && (
          <Text style={[styles.detailTitle, { color: C.jInk }]}>{entry.title}</Text>
        )}

        {/* Mood badge + tags */}
        <View style={styles.detailMoodRow}>
          <View style={[styles.moodBadge, { backgroundColor: moodBadge.bg }]}>
            <Text style={[styles.moodBadgeText, { color: moodBadge.color }]}>{moodBadge.label}</Text>
          </View>
          {hasTags && entry.tags!.map(tag => (
            <View key={tag} style={[styles.tagChip, { borderColor: C.jBorderFaint }]}>
              <Text style={[styles.tagChipText, { color: C.jInkMuted }]}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Body */}
        <View style={styles.detailBody}>
          {bodyParagraphs.length > 0 ? (
            bodyParagraphs.map((para, idx) => (
              <Text
                key={idx}
                style={[
                  styles.detailBodyText,
                  { color: C.jInk, marginTop: idx > 0 ? 22 : 0 },
                ]}
              >
                {para.trim()}
              </Text>
            ))
          ) : (
            <Text style={[styles.detailBodyText, { color: C.jInk }]}>{entry.text}</Text>
          )}
        </View>

        {/* Reflection card */}
        <View style={[styles.reflCard, { backgroundColor: C.jSageLight, borderLeftColor: C.jSage }]}>
          <Text style={[styles.reflLbl, { color: C.jSage }]}>{reflection.label.toUpperCase()}</Text>
          <Text style={[styles.reflTxt, { color: C.jInkMuted }]}>{reflection.text}</Text>
        </View>

        {/* Continue button */}
        <View style={styles.continueBtnWrap}>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: C.jInk, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/journal/new' as Href);
            }}
          >
            <Text style={styles.continueBtnText}>Continue this reflection →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 0 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 15, fontFamily: 'CormorantGaramond_400Regular' },

  // Header
  detailHdNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 20,
  },
  btnIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 22, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  dotsIcon: { fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 2, lineHeight: 16 },

  // Date
  detailDate: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    letterSpacing: 0.6, paddingHorizontal: 24, marginBottom: 8,
  },

  // Title
  detailTitle: {
    fontSize: 30, fontFamily: 'CormorantGaramond_300Light',
    lineHeight: 36, letterSpacing: -0.4,
    paddingHorizontal: 24, marginBottom: 14,
  },

  // Mood + tags row
  detailMoodRow: {
    flexDirection: 'row', alignItems: 'center',
    flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 24, marginBottom: 24,
  },
  moodBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  moodBadgeText: { fontSize: 10, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  tagChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  tagChipText: { fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 0.2 },

  // Body
  detailBody: { paddingHorizontal: 24, marginBottom: 24 },
  detailBodyText: {
    fontSize: 17, fontFamily: 'CormorantGaramond_300Light',
    lineHeight: 32,
  },

  // Reflection card
  reflCard: {
    marginHorizontal: 20, padding: 20,
    borderRadius: 16, borderLeftWidth: 3,
    marginBottom: 20,
  },
  reflLbl: {
    fontSize: 10, fontFamily: 'Inter_500Medium',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6,
  },
  reflTxt: {
    fontSize: 15, fontFamily: 'CormorantGaramond_300Light_Italic', lineHeight: 24,
  },

  // Continue button
  continueBtnWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  continueBtn: {
    padding: 16, borderRadius: 16, alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 17, fontFamily: 'CormorantGaramond_300Light',
    color: '#FEFCF9',
  },
});
