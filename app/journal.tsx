import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';

const PROMPTS = [
  "What's one thing you're grateful for today, and why?",
  "Describe a moment today when you felt truly present.",
  "What emotion has been most present for you lately?",
  "What would you tell your past self from a year ago?",
  "Describe your ideal peaceful moment. Where are you, what do you see?",
  "What's one small step you can take toward something that matters to you?",
  "What does your mind need most right now?",
  "Write about something that surprised you recently.",
];

const MOOD_COLORS: Record<number, string> = {
  1: '#94A3B8', 2: '#7DD3FC', 3: '#FDE68A', 4: '#FCD34D', 5: C.gold,
};

const MOOD_ICONS: Record<number, string> = {
  1: 'emoticon-cry-outline', 2: 'emoticon-sad-outline', 3: 'emoticon-neutral-outline',
  4: 'emoticon-happy-outline', 5: 'emoticon-excited-outline',
};

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { journalEntries, updateJournalEntry, deleteJournalEntry, toggleFavourite, isFavourite } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const todayPromptIdx = new Date().getDay() % PROMPTS.length;
  const todayPrompt = PROMPTS[todayPromptIdx];

  const toggleStar = (id: string, starred: boolean) => {
    updateJournalEntry(id, { starred: !starred });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete Entry?\n\nThis cannot be undone.')) {
        deleteJournalEntry(id);
      }
    } else {
      Alert.alert(
        'Delete Entry',
        'This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(id) },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Journal</Text>
          <Pressable
            style={styles.newBtn}
            onPress={() => router.push('/journal/new' as any)}
          >
            <Ionicons name="add" size={22} color={C.text} />
          </Pressable>
        </View>

        <View style={styles.promptCard}>
          <LinearGradient colors={[C.rose + '20', C.rose + '08', C.card]} style={StyleSheet.absoluteFill} />
          <View style={styles.promptHeader}>
            <View style={[styles.promptBadge, { backgroundColor: C.rose + '25' }]}>
              <Ionicons name="sparkles" size={12} color={C.rose} />
              <Text style={[styles.promptBadgeText, { color: C.rose }]}>Today's Prompt</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => toggleFavourite({ id: 'prompt-' + todayPromptIdx, type: 'journal', title: todayPrompt, color: C.rose, icon: 'journal' })}>
              <Ionicons name={isFavourite('prompt-' + todayPromptIdx) ? 'star' : 'star-outline'} size={18} color={isFavourite('prompt-' + todayPromptIdx) ? C.gold : C.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.promptText}>{todayPrompt}</Text>
          <Pressable style={styles.writeBtn} onPress={() => router.push('/journal/new' as any)}>
            <Ionicons name="journal" size={16} color={C.bg} />
            <Text style={styles.writeBtnText}>Write Now</Text>
          </Pressable>
        </View>

        {journalEntries.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Past Entries</Text>
            {journalEntries.map(entry => (
              <Pressable
                key={entry.id}
                style={({ pressed }) => [styles.entryCard, pressed && { opacity: 0.85 }]}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })}
              >
                <LinearGradient colors={[MOOD_COLORS[entry.mood] + '10', C.card]} style={StyleSheet.absoluteFill} />
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <MaterialCommunityIcons name={MOOD_ICONS[entry.mood] as any} size={16} color={MOOD_COLORS[entry.mood]} />
                    <Text style={styles.entryDate}>
                      {new Date(entry.timestamp).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.entryActions}>
                    {entry.aiLoading && (
                      <View style={styles.aiLoadingDot}>
                        <Ionicons name="sparkles" size={10} color={C.lavender} />
                      </View>
                    )}
                    {entry.aiReflection && !entry.aiLoading && (
                      <View style={styles.aiDot}>
                        <Ionicons name="sparkles" size={10} color={C.lavender} />
                      </View>
                    )}
                    <Pressable onPress={() => toggleStar(entry.id, entry.starred)} hitSlop={8}>
                      <Ionicons name={entry.starred ? 'star' : 'star-outline'} size={16} color={entry.starred ? C.gold : C.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(entry.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={C.textMuted} />
                    </Pressable>
                    <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                  </View>
                </View>
                {entry.prompt && <Text style={styles.entryPrompt} numberOfLines={1}>{entry.prompt}</Text>}
                <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
                <View style={[styles.entryMoodBar, { backgroundColor: MOOD_COLORS[entry.mood] + '30' }]}>
                  <View style={[styles.entryMoodFill, { width: `${(entry.mood / 5) * 100}%`, backgroundColor: MOOD_COLORS[entry.mood] }]} />
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyOrb}>
              <Ionicons name="journal-outline" size={40} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Begin your story</Text>
            <Text style={styles.emptySub}>Your thoughts and reflections will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  newBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.rose + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.rose + '50' },
  promptCard: { borderRadius: 20, overflow: 'hidden', padding: 18, gap: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  promptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promptBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  promptBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  promptText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 26, fontStyle: 'italic' },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: C.rose, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100 },
  writeBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.bg },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  entryCard: { borderRadius: 18, overflow: 'hidden', padding: 16, gap: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  entryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.lavender + '25', alignItems: 'center', justifyContent: 'center' },
  aiLoadingDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.lavender + '15', alignItems: 'center', justifyContent: 'center' },
  entryPrompt: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, fontStyle: 'italic' },
  entryContent: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 24 },
  entryMoodBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  entryMoodFill: { height: 4, borderRadius: 2 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyOrb: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
});
