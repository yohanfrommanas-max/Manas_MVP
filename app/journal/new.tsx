import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  Animated, Easing, ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors } from '@/constants/colors';
import { toDateStr } from '@/utils/dateHelpers';
import { getTodayPrompt } from '@/data/journalPrompts';

const MOODS: { key: JournalMood; label: string }[] = [
  { key: 'calm', label: 'Calm' },
  { key: 'grateful', label: 'Grateful' },
  { key: 'restless', label: 'Restless' },
  { key: 'driven', label: 'Driven' },
  { key: 'heavy', label: 'Heavy' },
  { key: 'reflective', label: 'Reflective' },
  { key: 'anxious', label: 'Anxious' },
];

const TAGS = [
  'Achievements', 'Family', 'Gratitude', 'Challenges', 'Goals',
  'Health', 'Creative', 'Learning', 'Adventure', 'Mindfulness',
  'Spiritual', 'Work', 'Relationships',
];

function formatWriteDate(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en', { weekday: 'long' });
  const dayNum = now.getDate();
  const month = now.toLocaleDateString('en', { month: 'long' });
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${weekday}, ${dayNum} ${month} · ${timeOfDay}`;
}

export default function JournalNewScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { addJournalEntry } = useApp();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayStr = toDateStr();
  const writeDate = formatWriteDate();
  const todayPrompt = useMemo(() => getTodayPrompt(), []);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = () => {
    if (!text.trim()) return;
    if (!mood) { shake(); return; }
    const entry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      date: todayStr,
      prompt: todayPrompt.text,
      promptCategory: todayPrompt.category,
      text: text.trim(),
      mood,
      timestamp: Date.now(),
      starred: false,
      title: title.trim(),
      tags: selectedTags,
    };
    addJournalEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/journal/[id]' as Href, params: { id: entry.id } });
  };

  const canSave = text.trim().length > 0;

  const toolbarHeight = 60 + botInset;

  return (
    <View style={[styles.container, { backgroundColor: C.jStone }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.writeHd,
          { paddingTop: topInset + 8, borderBottomColor: C.jBorderFaint, transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <View style={styles.writeNav}>
          <Pressable
            style={[styles.btnBack, { backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.06)' : `${C.jInk}0F` }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.btnBackText, { color: C.jInkMuted }]}>← Back</Text>
          </Pressable>
          <Pressable
            style={[styles.btnSave, { backgroundColor: canSave ? C.jInk : C.jInkFaint }]}
            onPress={handleSave}
            testID="journal-save-btn"
          >
            <Text style={styles.btnSaveText}>Save</Text>
          </Pressable>
        </View>
        <Text style={[styles.writeDateSm, { color: C.jInkFaint }]}>{writeDate.toUpperCase()}</Text>
      </Animated.View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: toolbarHeight + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={toolbarHeight}
      >
        {/* Prompt card */}
        <View style={[styles.promptCard, { backgroundColor: C.jGoldLight }]}>
          <View style={[styles.promptCardBorder, { backgroundColor: C.jGold }]} />
          <Text style={[styles.promptLbl, { color: C.jGold }]}>TODAY'S PROMPT</Text>
          <Text style={[styles.promptTxt, { color: C.jInk }]}>{'\u201C'}{todayPrompt.text}{'\u201D'}</Text>
        </View>

        {/* Mood */}
        <Text style={[styles.fieldLbl, { color: C.jInkFaint }]}>MOOD</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRowWr}
        >
          {MOODS.map(({ key, label }) => {
            const isOn = mood === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.moodPill,
                  { borderColor: C.jBorderFaint },
                  isOn ? { backgroundColor: C.jInk, borderColor: C.jInk } : { backgroundColor: C.jCard },
                ]}
                onPress={() => {
                  setMood(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                testID={`mood-${key}`}
              >
                <Text style={[styles.moodPillText, isOn ? { color: '#FFFFFF' } : { color: C.jInkMuted }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tags */}
        <Text style={[styles.fieldLbl, { color: C.jInkFaint, marginTop: 14 }]}>TAGS</Text>
        <View style={styles.tagGridWr}>
          {TAGS.map(tag => {
            const isOn = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={[
                  styles.tagPill,
                  { borderColor: C.jBorderFaint },
                  isOn
                    ? { backgroundColor: C.jGoldLight, borderColor: C.jGold }
                    : { backgroundColor: C.jCard },
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagPillText,
                  isOn ? { color: '#7a5c2a' } : { color: C.jInkMuted },
                ]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Divider + Title */}
        <View style={[styles.divider, { backgroundColor: C.jBorderFaint }]} />
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.titleIn, { color: C.jInk }]}
          placeholder="Title…"
          placeholderTextColor={C.jInkFaint}
          returnKeyType="next"
          testID="journal-title-input"
        />

        {/* Divider + Body */}
        <View style={[styles.divider, { backgroundColor: C.jBorderFaint, marginTop: 6 }]} />
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          scrollEnabled={false}
          blurOnSubmit={false}
          autoCorrect
          style={[styles.bodyIn, { color: C.jInk }]}
          placeholder="Begin writing… let the thoughts arrive without judgment."
          placeholderTextColor={C.jInkFaint}
          textAlignVertical="top"
          testID="journal-input"
        />
      </KeyboardAwareScrollView>

      {/* Formatting toolbar */}
      <View style={[styles.writeToolbar, { paddingBottom: botInset + 10, borderTopColor: C.jBorderFaint, backgroundColor: C.jCard }]}>
        <Pressable style={styles.toolBtn} hitSlop={8}>
          <Text style={[styles.toolBtnText, { color: C.jInkMuted }]}>B</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} hitSlop={8}>
          <Text style={[styles.toolBtnTextItalic, { color: C.jInkMuted }]}>I</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} hitSlop={8}>
          <Text style={[styles.toolBtnText, { color: C.jInkMuted }]}>{'\u201C'}</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} hitSlop={8}>
          <Text style={[styles.toolBtnText, { color: C.jInkMuted }]}>#</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} hitSlop={8}>
          <Text style={[styles.toolBtnText, { color: C.jInkMuted }]}>⊞</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  writeHd: {
    paddingHorizontal: 24, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  writeNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  btnBack: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 100,
  },
  btnBackText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  btnSave: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 100,
  },
  btnSaveText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#FFFFFF' },
  writeDateSm: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    letterSpacing: 0.6, textAlign: 'center',
  },

  body: { gap: 0, flexGrow: 1 },

  promptCard: {
    margin: 16, marginHorizontal: 20,
    padding: 14, paddingLeft: 21,
    borderRadius: 14, overflow: 'hidden',
  },
  promptCardBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  promptLbl: {
    fontSize: 10, fontFamily: 'Inter_500Medium',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4,
  },
  promptTxt: { fontSize: 15, fontFamily: 'CormorantGaramond_300Light_Italic', lineHeight: 23 },

  fieldLbl: {
    fontSize: 10, fontFamily: 'Inter_500Medium',
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 8, paddingHorizontal: 20,
  },

  moodRowWr: { paddingHorizontal: 20, gap: 6, paddingBottom: 4 },
  moodPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1,
  },
  moodPillText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  tagGridWr: {
    paddingHorizontal: 20, flexDirection: 'row',
    flexWrap: 'wrap', gap: 6, paddingBottom: 12,
  },
  tagPill: {
    paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 100, borderWidth: 1,
  },
  tagPillText: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  divider: { height: 1, marginHorizontal: 20, marginVertical: 14 },

  titleIn: {
    fontSize: 22, fontFamily: 'CormorantGaramond_300Light',
    letterSpacing: -0.2, paddingHorizontal: 20,
    paddingVertical: 0, lineHeight: 30,
    minHeight: 36,
  },
  bodyIn: {
    fontSize: 16, fontFamily: 'CormorantGaramond_300Light',
    lineHeight: 30, paddingHorizontal: 20,
    minHeight: 180, textAlignVertical: 'top',
  },

  writeToolbar: {
    paddingTop: 10, paddingHorizontal: 16,
    borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  toolBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  toolBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  toolBtnTextItalic: { fontSize: 16, fontFamily: 'Lora_400Regular_Italic' },
});
