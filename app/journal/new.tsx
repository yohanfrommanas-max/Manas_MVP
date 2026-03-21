import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  Animated, Easing, KeyboardAvoidingView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { getTodayPrompt } from '@/data/journalPrompts';
import { toDateStr } from '@/utils/dateHelpers';
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

  const [text, setText] = useState('');
  const [mood, setMood] = useState<JournalMood | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayStr = toDateStr();
  const todayPrompt = getTodayPrompt();

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
      prompt: todayPrompt.text,
      promptCategory: todayPrompt.category,
      text: text.trim(),
      mood,
      timestamp: Date.now(),
      starred: false,
    };
    addJournalEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/journal' as any);
  };

  const moodBarHeight = 58 + botInset;

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
        <Text style={styles.headerTitle}>Today</Text>
        <Pressable onPress={handleSave} hitSlop={8}>
          <Text style={[styles.saveBtn, { opacity: text.trim() ? 1 : 0.45 }]}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: moodBarHeight + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={moodBarHeight}
      >
        <View style={styles.promptBlock}>
          <Text style={styles.promptCategory}>{todayPrompt.category.toUpperCase()}</Text>
          <Text style={styles.promptText}>{todayPrompt.text}</Text>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          scrollEnabled={false}
          blurOnSubmit={false}
          autoCorrect
          style={styles.input}
          placeholder="Begin writing..."
          placeholderTextColor={C.textMuted}
          selectionColor={C.journalAccent}
          textAlignVertical="top"
          testID="journal-input"
        />
      </KeyboardAwareScrollView>

      <Animated.View
        style={[
          styles.moodBar,
          { paddingBottom: botInset + 8, transform: [{ translateX: shakeAnim }] },
        ]}
      >
        {MOODS.map(({ key, label }) => {
          const isSelected = mood === key;
          const color = MOOD_COLORS[key];
          return (
            <Pressable
              key={key}
              onPress={() => {
                setMood(key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.moodOption}
              testID={`mood-${key}`}
            >
              <Text style={[styles.moodLabel, { color: isSelected ? color : C.textMuted }]}>
                {label}
              </Text>
              {isSelected && (
                <View style={[styles.moodUnderline, { backgroundColor: color }]} />
              )}
            </Pressable>
          );
        })}
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
    headerTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.text },
    saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.journalAccent },
    body: { paddingHorizontal: 20, paddingTop: 20, gap: 20, flexGrow: 1 },
    promptBlock: { gap: 6 },
    promptCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5,
    },
    promptText: {
      fontSize: 16, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 26,
    },
    input: {
      minHeight: 240, fontSize: 18,
      fontFamily: 'Lora_400Regular', lineHeight: 30,
      color: C.text, textAlignVertical: 'top',
    },
    moodBar: {
      flexDirection: 'row', justifyContent: 'space-around',
      paddingHorizontal: 16, paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    moodOption: { alignItems: 'center', gap: 4, paddingHorizontal: 4 },
    moodLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    moodUnderline: { height: 2, width: '100%', borderRadius: 1 },
  });
}
