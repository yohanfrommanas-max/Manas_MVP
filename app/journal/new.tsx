import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  KeyboardAvoidingView, ScrollView, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, JournalEntry } from '@/context/AppContext';
import C from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';

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

const MOOD_ICONS: Record<number, string> = {
  1: 'emoticon-cry-outline', 2: 'emoticon-sad-outline', 3: 'emoticon-neutral-outline',
  4: 'emoticon-happy-outline', 5: 'emoticon-excited-outline',
};
const MOOD_COLORS: Record<number, string> = {
  1: '#94A3B8', 2: '#7DD3FC', 3: '#FDE68A', 4: '#FCD34D', 5: C.gold,
};

async function fetchAiReflection(content: string, mood: number, prompt: string): Promise<string | null> {
  try {
    const url = new URL('/api/journal/reflect', getApiUrl());
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mood, prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.reflection ?? null;
  } catch {
    return null;
  }
}

export default function JournalNewScreen() {
  const insets = useSafeAreaInsets();
  const { addJournalEntry, updateJournalEntry } = useApp();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  const handleSave = async () => {
    if (!content.trim() || isSaving) return;
    setIsSaving(true);
    Keyboard.dismiss();
    const entry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      date: todayStr,
      prompt: todayPrompt,
      content: content.trim(),
      mood,
      timestamp: Date.now(),
      starred: false,
      aiLoading: true,
    };
    addJournalEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
    const reflection = await fetchAiReflection(entry.content, mood, todayPrompt);
    updateJournalEntry(entry.id, { aiReflection: reflection ?? undefined, aiLoading: false });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2A0D1A', '#0D0F14']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>New Entry</Text>
        <Pressable
          style={[styles.saveTopBtn, { opacity: content.trim() && !isSaving ? 1 : 0.35 }]}
          onPress={handleSave}
          disabled={!content.trim() || isSaving}
        >
          <Text style={styles.saveTopBtnText}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.promptCard}>
            <LinearGradient colors={[C.rose + '20', C.rose + '08', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.promptBadge}>
              <Ionicons name="sparkles" size={12} color={C.rose} />
              <Text style={styles.promptBadgeText}>Today's Prompt</Text>
            </View>
            <Text style={styles.promptText}>{todayPrompt}</Text>
          </View>

          <View style={styles.moodRow}>
            <Text style={styles.moodLabel}>Mood</Text>
            {[1, 2, 3, 4, 5].map(m => (
              <Pressable
                key={m}
                onPress={() => { setMood(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <MaterialCommunityIcons name={MOOD_ICONS[m] as any} size={30} color={mood === m ? MOOD_COLORS[m] : C.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={styles.inputWrapper}>
            <Pressable style={styles.dismissBtn} onPress={() => Keyboard.dismiss()}>
              <Ionicons name="chevron-down" size={18} color={C.textMuted} />
            </Pressable>
            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              scrollEnabled
              blurOnSubmit={false}
              autoCorrect
              autoFocus
              style={styles.input}
              placeholder="Start writing..."
              placeholderTextColor="#6B7280"
              selectionColor={C.rose}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: C.rose + '30',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  saveTopBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: C.rose },
  saveTopBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.bg },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 16, flexGrow: 1 },
  promptCard: {
    borderRadius: 16, overflow: 'hidden', padding: 16, gap: 10,
    borderWidth: 1, borderColor: C.rose + '30', backgroundColor: C.card,
  },
  promptBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promptBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.rose },
  promptText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 24, fontStyle: 'italic' },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  moodLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub },
  inputWrapper: { flex: 1, gap: 8 },
  dismissBtn: {
    alignSelf: 'flex-end', width: 36, height: 28, borderRadius: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, minHeight: 300,
    color: '#F1F0EB', fontSize: 16, lineHeight: 26,
    textAlignVertical: 'top', padding: 16,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
});
