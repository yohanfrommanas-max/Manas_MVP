import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  Animated, Easing, KeyboardAvoidingView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { toDateStr, formatNewEntryDate, wordCount } from '@/utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

const MOODS: { key: JournalMood; label: string }[] = [
  { key: 'calm', label: 'Calm' },
  { key: 'focused', label: 'Focused' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'tired', label: 'Tired' },
  { key: 'energized', label: 'Energized' },
];

function getMoodData(C: Colors): Record<JournalMood, string> {
  return {
    calm: C.moodCalm,
    focused: C.moodFocused,
    anxious: C.moodAnxious,
    tired: C.moodTired,
    energized: C.moodEnergized,
  };
}

export default function JournalNewScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MOOD_COLORS = useMemo(() => getMoodData(C), [C]);
  const insets = useSafeAreaInsets();
  const { addJournalEntry } = useApp();

  const { prompt, promptCategory, imageAsset, promptless } = useLocalSearchParams<{
    prompt?: string;
    promptCategory?: string;
    imageAsset?: string;
    promptless?: string;
  }>();

  const isFreeWrite = promptless === 'true';
  const hasPrompt = !isFreeWrite && !!prompt;

  const [text, setText] = useState('');
  const [mood, setMood] = useState<JournalMood | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayStr = toDateStr();
  const headerDate = formatNewEntryDate();
  const words = wordCount(text);

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

  const handleSave = () => {
    if (!text.trim()) return;
    if (!mood) {
      shake();
      return;
    }
    const entry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      date: todayStr,
      prompt: hasPrompt ? (prompt ?? '') : '',
      promptCategory: hasPrompt ? (promptCategory ?? '') : '',
      text: text.trim(),
      mood,
      timestamp: Date.now(),
      starred: false,
    };
    addJournalEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/journal' as Href);
  };

  const moodBarHeight = 72 + botInset;
  const selectedMoodColor = mood ? MOOD_COLORS[mood] : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" size={22} color={C.textMuted} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerDate}>{headerDate}</Text>
          <Text style={styles.wordCount}>{words} {words === 1 ? 'word' : 'words'}</Text>
        </View>

        <Pressable onPress={handleSave} hitSlop={8}>
          <Text style={[styles.saveBtn, { opacity: text.trim() ? 1 : 0.4 }]}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: moodBarHeight + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={moodBarHeight}
      >
        {hasPrompt && (
          <View style={styles.promptBlock}>
            <Text style={styles.promptCategory}>{(promptCategory ?? '').toUpperCase()}</Text>
            <Text style={styles.promptQuoteMark}>{'\u201C'}</Text>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
        )}

        {isFreeWrite && (
          <View style={styles.freeWriteHeader}>
            <Ionicons name="pencil-outline" size={14} color={C.textMuted} />
            <Text style={styles.freeWriteLabel}>Free write</Text>
          </View>
        )}

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          scrollEnabled={false}
          blurOnSubmit={false}
          autoCorrect
          style={styles.input}
          placeholder={isFreeWrite ? 'Write whatever is on your mind...' : 'Begin writing...'}
          placeholderTextColor={C.textMuted}
          selectionColor={C.journalAccent}
          textAlignVertical="top"
          testID="journal-input"
        />
      </KeyboardAwareScrollView>

      <Animated.View
        style={[
          styles.moodBar,
          { paddingBottom: botInset + 10, transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <View style={styles.moodSwatches}>
          {MOODS.map(({ key }) => {
            const isSelected = mood === key;
            const color = MOOD_COLORS[key];
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setMood(key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  isSelected && styles.swatchSelected,
                  !isSelected && { opacity: 0.4 },
                ]}
                testID={`mood-${key}`}
              />
            );
          })}
        </View>
        {mood && (
          <Text style={[styles.selectedMoodLabel, { color: selectedMoodColor ?? C.textMuted }]}>
            {MOODS.find(m => m.key === mood)?.label}
          </Text>
        )}
        {!mood && (
          <Text style={styles.moodHint}>How are you feeling?</Text>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    headerCenter: { alignItems: 'center', gap: 2 },
    headerDate: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
    wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
    saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.journalAccent },
    body: { paddingHorizontal: 22, paddingTop: 22, gap: 18, flexGrow: 1 },
    promptBlock: { gap: 2 },
    promptCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5, marginBottom: 4,
    },
    promptQuoteMark: {
      fontSize: 48, fontFamily: 'Lora_700Bold',
      color: C.journalAccent, lineHeight: 36,
      opacity: 0.5, marginBottom: 2,
    },
    promptText: {
      fontSize: 17, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 28,
    },
    freeWriteHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    freeWriteLabel: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.textMuted,
    },
    input: {
      minHeight: 200, fontSize: 18,
      fontFamily: 'Lora_400Regular', lineHeight: 30,
      color: C.text, textAlignVertical: 'top',
    },
    moodBar: {
      alignItems: 'center', gap: 6,
      paddingHorizontal: 24, paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    moodSwatches: { flexDirection: 'row', gap: 16 },
    swatch: {
      width: 28, height: 28, borderRadius: 14,
    },
    swatchSelected: {
      opacity: 1,
      transform: [{ scale: 1.2 }],
    },
    selectedMoodLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
    moodHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  });
}
