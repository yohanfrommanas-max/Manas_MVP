import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors } from '@/constants/colors';
import { getTodayQuote } from '@/data/journalPrompts';

type TagFilter = 'All' | string;
type MoodFilter = 'all' | JournalMood;

const TAG_FILTER_OPTIONS: TagFilter[] = [
  'All', 'Gratitude', 'Mindfulness', 'Work', 'Challenges',
  'Goals', 'Health', 'Relationships', 'Learning', 'Spiritual',
];

const MOOD_FILTER_OPTIONS: { key: MoodFilter; label: string }[] = [
  { key: 'all', label: 'Any mood' },
  { key: 'calm', label: 'Calm' },
  { key: 'grateful', label: 'Grateful' },
  { key: 'restless', label: 'Restless' },
  { key: 'driven', label: 'Driven' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'reflective', label: 'Reflective' },
];

interface MoodStyle { bg: string; color: string; label: string }

function getMoodStyles(jGold: string, jGoldLight: string, jSage: string, jSageLight: string, jEmber: string, jEmberLight: string, jInkMuted: string, jStoneAlt: string): Record<JournalMood, MoodStyle> {
  return {
    calm: { bg: jSageLight, color: jSage, label: 'Calm' },
    grateful: { bg: jSageLight, color: jSage, label: 'Grateful' },
    restless: { bg: jEmberLight, color: jEmber, label: 'Restless' },
    driven: { bg: jGoldLight, color: jGold, label: 'Driven' },
    heavy: { bg: jStoneAlt, color: jInkMuted, label: 'Heavy' },
    reflective: { bg: jStoneAlt, color: jInkMuted, label: 'Reflective' },
    anxious: { bg: jEmberLight, color: jEmber, label: 'Anxious' },
  };
}

function calcJournalStreak(entries: JournalEntry[]): number {
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

function countThisWeek(entries: JournalEntry[]): number {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return entries.filter(e => {
    const d = new Date(e.timestamp);
    return d >= monday && d <= sunday;
  }).length;
}

function formatEntryCardDate(timestamp: number): string {
  const d = new Date(timestamp);
  const weekday = d.toLocaleDateString('en', { weekday: 'long' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('en', { month: 'short' });
  const hour = d.getHours();
  const min = d.getMinutes();
  const ampm = hour < 12 ? 'am' : 'pm';
  const h12 = hour % 12 || 12;
  const minStr = min.toString().padStart(2, '0');
  return `${weekday}, ${dayNum} ${month} · ${h12}:${minStr} ${ampm}`;
}

export default function JournalScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { journalEntries } = useApp();

  const [selectedTag, setSelectedTag] = useState<TagFilter>('All');
  const [selectedMood, setSelectedMood] = useState<MoodFilter>('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const MOOD_STYLES = useMemo(() =>
    getMoodStyles(C.jGold, C.jGoldLight, C.jSage, C.jSageLight, C.jEmber, C.jEmberLight, C.jInkMuted, C.jStoneAlt),
    [C],
  );

  const streak = useMemo(() => calcJournalStreak(journalEntries), [journalEntries]);
  const thisWeekCount = useMemo(() => countThisWeek(journalEntries), [journalEntries]);
  const quote = useMemo(() => getTodayQuote(), []);

  const filteredEntries = useMemo(() => {
    let list = [...journalEntries].sort((a, b) => b.timestamp - a.timestamp);
    if (selectedTag !== 'All') {
      list = list.filter(e => e.tags && e.tags.includes(selectedTag));
    }
    if (selectedMood !== 'all') {
      list = list.filter(e => e.mood === selectedMood);
    }
    return list;
  }, [journalEntries, selectedTag, selectedMood]);

  const now = new Date();
  const weekday = now.toLocaleDateString('en', { weekday: 'long' });
  const dayNum = now.getDate();
  const month = now.toLocaleDateString('en', { month: 'long' });
  const year = now.getFullYear();

  const streakBarPct = Math.min(streak / 10, 1);
  const entriesBarPct = Math.min(journalEntries.length / 30, 1);
  const weekBarPct = Math.min(thisWeekCount / 7, 1);

  return (
    <View style={[styles.container, { backgroundColor: C.jStone }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 8, paddingBottom: botInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date bar */}
        <View style={styles.dateBar}>
          <Text style={[styles.dateLine, { color: C.jInkFaint }]}>{weekday}</Text>
          <Text style={[styles.dateBig, { color: C.jInk }]}>
            {dayNum} {month},{' '}
            <Text style={[styles.dateBigItalic, { color: C.jGold }]}>{year}</Text>
          </Text>
        </View>

        {/* Quote card — always dark */}
        <Pressable
          style={[styles.quoteCard, { backgroundColor: C.jQuoteCard }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={styles.quoteLabel}>TODAY'S QUOTE</Text>
          <Text style={styles.quoteText}>{'\u201C'}{quote.text}{'\u201D'}</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </Pressable>

        {/* Practice section */}
        <View style={styles.secHd}>
          <Text style={[styles.secTitle, { color: C.jInk }]}>Practice</Text>
        </View>
        <View style={styles.streakRow}>
          <View style={[styles.streakCard, { backgroundColor: C.jCard }]}>
            <Text style={[styles.streakNum, { color: C.jInk }]}>{streak}</Text>
            <Text style={[styles.streakLbl, { color: C.jInkFaint }]}>DAY STREAK</Text>
            <View style={[styles.streakBar, { backgroundColor: C.jStoneAlt }]}>
              <View style={[styles.streakBarFill, { width: `${Math.round(streakBarPct * 100)}%`, backgroundColor: C.jGold }]} />
            </View>
          </View>
          <View style={[styles.streakCard, { backgroundColor: C.jCard }]}>
            <Text style={[styles.streakNum, { color: C.jInk }]}>{journalEntries.length}</Text>
            <Text style={[styles.streakLbl, { color: C.jInkFaint }]}>ENTRIES</Text>
            <View style={[styles.streakBar, { backgroundColor: C.jStoneAlt }]}>
              <View style={[styles.streakBarFill, { width: `${Math.round(entriesBarPct * 100)}%`, backgroundColor: C.jSage }]} />
            </View>
          </View>
          <View style={[styles.streakCard, { backgroundColor: C.jCard }]}>
            <Text style={[styles.streakNum, { color: C.jInk }]}>{thisWeekCount}</Text>
            <Text style={[styles.streakLbl, { color: C.jInkFaint }]}>THIS WEEK</Text>
            <View style={[styles.streakBar, { backgroundColor: C.jStoneAlt }]}>
              <View style={[styles.streakBarFill, { width: `${Math.round(weekBarPct * 100)}%`, backgroundColor: C.jEmber }]} />
            </View>
          </View>
        </View>

        {/* Entries section header */}
        <View style={styles.secHd}>
          <Text style={[styles.secTitle, { color: C.jInk }]}>Entries</Text>
          <Pressable onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/journal/insights' as Href);
          }}>
            <Text style={[styles.secAction, { color: C.jGold }]}>Insights</Text>
          </Pressable>
        </View>

        {/* Tag filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { paddingHorizontal: 20 }]}
        >
          {TAG_FILTER_OPTIONS.map(tag => {
            const isOn = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                style={[
                  styles.filterChip,
                  { borderColor: C.jBorderFaint },
                  isOn ? { backgroundColor: C.jInk, borderColor: C.jInk } : { backgroundColor: C.jCard },
                ]}
                onPress={() => {
                  setSelectedTag(tag);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.filterChipText, isOn ? { color: '#FFFFFF' } : { color: C.jInkMuted }]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Mood filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { paddingHorizontal: 20, paddingBottom: 16 }]}
        >
          {MOOD_FILTER_OPTIONS.map(({ key, label }) => {
            const isOn = selectedMood === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterChip,
                  { borderColor: C.jBorderFaint },
                  isOn ? { backgroundColor: C.jInk, borderColor: C.jInk } : { backgroundColor: C.jCard },
                ]}
                onPress={() => {
                  setSelectedMood(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.filterChipText, isOn ? { color: '#FFFFFF' } : { color: C.jInkMuted }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Entry cards */}
        <View style={styles.entriesList}>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: C.jInkFaint }]}>
                {journalEntries.length === 0 ? 'No entries yet' : 'No entries match your filters'}
              </Text>
            </View>
          ) : (
            filteredEntries.slice(0, 20).map(entry => {
              const moodStyle = MOOD_STYLES[entry.mood] ?? MOOD_STYLES.calm;
              const dateStr = formatEntryCardDate(entry.timestamp);
              const hasTags = !!(entry.tags && entry.tags.length > 0);
              return (
                <Pressable
                  key={entry.id}
                  style={({ pressed }) => [
                    styles.entryCard,
                    { backgroundColor: C.jCard, borderColor: C.jBorderFaint },
                    pressed && { opacity: 0.92 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/journal/[id]' as Href, params: { id: entry.id } });
                  }}
                >
                  <View style={styles.entryMeta}>
                    <Text style={[styles.entryDateSm, { color: C.jInkFaint }]}>{dateStr}</Text>
                    <View style={[styles.moodBadge, { backgroundColor: moodStyle.bg }]}>
                      <Text style={[styles.moodBadgeText, { color: moodStyle.color }]}>{moodStyle.label}</Text>
                    </View>
                  </View>
                  {!!(entry.title) && (
                    <Text style={[styles.entryTitle, { color: C.jInk }]} numberOfLines={1}>
                      {entry.title}
                    </Text>
                  )}
                  <Text style={[styles.entryPreview, { color: C.jInkFaint }]} numberOfLines={2}>
                    {entry.text}
                  </Text>
                  {hasTags && (
                    <View style={styles.tagRow}>
                      {entry.tags!.slice(0, 3).map(tag => (
                        <View key={tag} style={[styles.tagPill, { borderColor: C.jBorderFaint }]}>
                          <Text style={[styles.tagPillText, { color: C.jInkMuted }]}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: botInset + 24, backgroundColor: C.jInk }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/journal/new' as Href);
        }}
        testID="journal-fab"
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { gap: 0 },

  // Date bar
  dateBar: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 18 },
  dateLine: { fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  dateBig: { fontSize: 26, fontFamily: 'CormorantGaramond_300Light', letterSpacing: -0.3 },
  dateBigItalic: { fontFamily: 'CormorantGaramond_300Light_Italic', letterSpacing: -0.3 },

  // Quote card
  quoteCard: {
    marginHorizontal: 20, marginBottom: 20,
    borderRadius: 20, padding: 22,
    paddingHorizontal: 24,
  },
  quoteLabel: {
    fontSize: 10, fontFamily: 'Inter_500Medium',
    color: '#C4A96B', letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 10,
  },
  quoteText: {
    fontSize: 17, fontFamily: 'CormorantGaramond_300Light_Italic',
    color: '#FEFCF9', lineHeight: 27, marginBottom: 12,
  },
  quoteAuthor: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(254,252,249,0.35)', letterSpacing: 0.8 },

  // Section header
  secHd: {
    paddingHorizontal: 24, paddingBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
  },
  secTitle: { fontSize: 20, fontFamily: 'CormorantGaramond_400Regular', letterSpacing: -0.2 },
  secAction: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  // Streak cards row
  streakRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  streakCard: { flex: 1, borderRadius: 16, padding: 14, paddingHorizontal: 16, alignItems: 'center' },
  streakNum: { fontSize: 28, fontFamily: 'CormorantGaramond_400Regular', lineHeight: 32, marginBottom: 3 },
  streakLbl: { fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  streakBar: { height: 3, borderRadius: 10, width: '100%', overflow: 'hidden' },
  streakBarFill: { height: 3, borderRadius: 10 },

  // Filter rows
  filterRow: { gap: 7, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  // Entries list
  entriesList: { paddingHorizontal: 20, gap: 10 },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, fontFamily: 'CormorantGaramond_400Regular_Italic' },

  // Entry card
  entryCard: { borderRadius: 16, padding: 18, paddingHorizontal: 20, borderWidth: 0 },
  entryMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  entryDateSm: { fontSize: 11, fontFamily: 'Inter_400Regular', letterSpacing: 0.4 },
  moodBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  moodBadgeText: { fontSize: 10, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
  entryTitle: { fontSize: 17, fontFamily: 'CormorantGaramond_400Regular', marginBottom: 6, lineHeight: 22 },
  entryPreview: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  tagRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 10 },
  tagPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  tagPillText: { fontSize: 10, fontFamily: 'Inter_400Regular', letterSpacing: 0.2 },

  // FAB
  fab: {
    position: 'absolute', right: 24,
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  fabPlus: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Inter_400Regular', lineHeight: 32 },
});
