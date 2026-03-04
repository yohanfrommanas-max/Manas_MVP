import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, JournalEntry } from '@/context/AppContext';
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
  1: 'thunderstorm', 2: 'cloudy', 3: 'partly-sunny', 4: 'sunny', 5: 'happy',
};

function EntryModal({ visible, onClose, onSave, defaultPrompt }: {
  visible: boolean; onClose: () => void;
  onSave: (content: string, mood: number) => void;
  defaultPrompt: string;
}) {
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const insets = useSafeAreaInsets();

  const save = () => {
    if (!content.trim()) return;
    onSave(content.trim(), mood);
    setContent('');
    setMood(3);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={eStyles.overlay}>
        <View style={[eStyles.modal, { paddingBottom: insets.bottom + 24 }]}>
          <LinearGradient colors={['#2A0D1A', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={eStyles.handle} />
          <View style={eStyles.modeRow}>
            <Pressable
              style={[eStyles.modeBtn, mode === 'guided' && { backgroundColor: C.rose + '25', borderColor: C.rose }]}
              onPress={() => setMode('guided')}
            >
              <Text style={[eStyles.modeBtnText, { color: mode === 'guided' ? C.rose : C.textSub }]}>Guided</Text>
            </Pressable>
            <Pressable
              style={[eStyles.modeBtn, mode === 'free' && { backgroundColor: C.rose + '25', borderColor: C.rose }]}
              onPress={() => setMode('free')}
            >
              <Text style={[eStyles.modeBtnText, { color: mode === 'free' ? C.rose : C.textSub }]}>Free Write</Text>
            </Pressable>
          </View>
          {mode === 'guided' && (
            <View style={eStyles.promptBox}>
              <Ionicons name="sparkles" size={14} color={C.rose} />
              <Text style={eStyles.promptText}>{defaultPrompt}</Text>
            </View>
          )}
          <TextInput
            style={eStyles.input}
            placeholder={mode === 'guided' ? 'Your thoughts...' : 'Begin writing...'}
            placeholderTextColor={C.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            selectionColor={C.rose}
            autoFocus
          />
          <View style={eStyles.moodRow}>
            <Text style={eStyles.moodLabel}>Mood</Text>
            {[1,2,3,4,5].map(m => (
              <Pressable key={m} onPress={() => setMood(m)}>
                <Ionicons name={MOOD_ICONS[m] as any} size={26} color={mood === m ? MOOD_COLORS[m] : C.textMuted} />
              </Pressable>
            ))}
          </View>
          <View style={eStyles.actions}>
            <Pressable style={eStyles.cancelBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={C.textSub} />
            </Pressable>
            <Pressable style={[eStyles.saveBtn, { opacity: content.trim() ? 1 : 0.4 }]} onPress={save}>
              <Ionicons name="checkmark" size={18} color={C.bg} />
              <Text style={eStyles.saveBtnText}>Save Entry</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { journalEntries, addJournalEntry, updateJournalEntry, toggleFavourite, isFavourite } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPromptIdx = new Date().getDay() % PROMPTS.length;
  const todayPrompt = PROMPTS[todayPromptIdx];

  const handleSave = (content: string, mood: number) => {
    const entry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      date: todayStr,
      prompt: todayPrompt,
      content,
      mood,
      timestamp: Date.now(),
      starred: false,
    };
    addJournalEntry(entry);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleStar = (id: string, starred: boolean) => {
    updateJournalEntry(id, { starred: !starred });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Journal</Text>
          <Pressable
            style={styles.newBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={22} color={C.text} />
          </Pressable>
        </View>

        {/* Today's prompt */}
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
          <Pressable style={styles.writeBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="journal" size={16} color={C.bg} />
            <Text style={styles.writeBtnText}>Write Now</Text>
          </Pressable>
        </View>

        {/* Entries */}
        {journalEntries.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Past Entries</Text>
            {journalEntries.map(entry => (
              <View key={entry.id} style={styles.entryCard}>
                <LinearGradient colors={[MOOD_COLORS[entry.mood] + '10', C.card]} style={StyleSheet.absoluteFill} />
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <Ionicons name={MOOD_ICONS[entry.mood] as any} size={16} color={MOOD_COLORS[entry.mood]} />
                    <Text style={styles.entryDate}>
                      {new Date(entry.timestamp).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Pressable onPress={() => toggleStar(entry.id, entry.starred)} hitSlop={8}>
                    <Ionicons name={entry.starred ? 'star' : 'star-outline'} size={16} color={entry.starred ? C.gold : C.textMuted} />
                  </Pressable>
                </View>
                {entry.prompt && <Text style={styles.entryPrompt} numberOfLines={1}>{entry.prompt}</Text>}
                <Text style={styles.entryContent} numberOfLines={4}>{entry.content}</Text>
                <View style={[styles.entryMoodBar, { backgroundColor: MOOD_COLORS[entry.mood] + '30' }]}>
                  <View style={[styles.entryMoodFill, { width: `${(entry.mood / 5) * 100}%`, backgroundColor: MOOD_COLORS[entry.mood] }]} />
                </View>
              </View>
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

      <EntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        defaultPrompt={todayPrompt}
      />
    </View>
  );
}

const eStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: { backgroundColor: C.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14, overflow: 'hidden', borderTopWidth: 1, borderColor: C.rose + '30' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 4 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, paddingVertical: 10, borderRadius: 100, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  modeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  promptBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: C.rose + '15', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.rose + '30' },
  promptText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22, fontStyle: 'italic' },
  input: {
    backgroundColor: C.card, borderRadius: 14, padding: 16, minHeight: 160,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 26,
    borderWidth: 1, borderColor: C.border,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  moodLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, backgroundColor: C.rose },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.bg },
});

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
  entryPrompt: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, fontStyle: 'italic' },
  entryContent: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 24 },
  entryMoodBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  entryMoodFill: { height: 4, borderRadius: 2 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyOrb: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
});
