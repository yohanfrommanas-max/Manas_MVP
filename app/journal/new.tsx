import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  Animated, Easing, ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, type JournalEntry, type JournalMood } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import { toDateStr, formatNewEntryDate, wordCount, generateUUID } from '@/utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';

const MOODS: { key: JournalMood; label: string }[] = [
  { key: 'calm', label: 'Calm' },
  { key: 'focused', label: 'Focused' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'tired', label: 'Tired' },
  { key: 'energized', label: 'Energized' },
];

const TAGS = [
  'Control', 'Virtue', 'Gratitude', 'Adversity',
  'Memento Mori', 'Amor Fati', 'Reflection', 'Growth',
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

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = () => {
    if (!text.trim()) return;
    if (!mood) {
      shake();
      return;
    }
    const entry: JournalEntry = {
      id: generateUUID(),
      date: todayStr,
      prompt: hasPrompt ? (prompt ?? '') : '',
      promptCategory: hasPrompt ? (promptCategory ?? '') : '',
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

  const moodBarHeight = 72 + botInset;
  const selectedMoodColor = mood ? MOOD_COLORS[mood] : null;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
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
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput}
          placeholder="Title your entry..."
          placeholderTextColor={C.textMuted}
          selectionColor={C.journalAccent}
          returnKeyType="next"
          testID="journal-title-input"
        />

        {hasPrompt && (
          <View style={styles.promptCard}>
            <View style={[styles.promptCardBorder, { backgroundColor: C.gold }]} />
            <Text style={styles.promptCategory}>{(promptCategory ?? '').toUpperCase()}</Text>
            <Text style={styles.promptText}>{prompt}</Text>
          </View>
        )}

        {isFreeWrite && (
          <View style={styles.freeWriteHeader}>
            <Ionicons name="pencil-outline" size={14} color={C.textMuted} />
            <Text style={styles.freeWriteLabel}>Free write</Text>
          </View>
        )}

        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>THEMES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
          >
            {TAGS.map(tag => {
              const isOn = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagPill,
                    isOn
                      ? { backgroundColor: C.gold + '22', borderColor: C.gold + '88' }
                      : { backgroundColor: C.card, borderColor: C.border },
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagPillText,
                    isOn ? { color: C.gold } : { color: C.textSub },
                  ]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus={!hasPrompt && !isFreeWrite}
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
        <Text style={styles.moodHint}>
          {mood ? 'Feeling' : 'How are you feeling?'}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodPillRow}
          keyboardShouldPersistTaps="handled"
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
                style={[
                  styles.moodPill,
                  isSelected
                    ? { backgroundColor: color + '28', borderColor: color }
                    : { backgroundColor: C.card, borderColor: C.border },
                ]}
                testID={`mood-${key}`}
              >
                <View style={[styles.moodDot, { backgroundColor: color, opacity: isSelected ? 1 : 0.45 }]} />
                <Text style={[
                  styles.moodPillLabel,
                  { color: isSelected ? color : C.textSub },
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    headerCenter: { alignItems: 'center', gap: 2 },
    headerDate: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
    wordCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
    saveBtn: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.journalAccent },
    body: { paddingHorizontal: 22, paddingTop: 22, gap: 16, flexGrow: 1 },
    titleInput: {
      fontSize: 22, fontFamily: 'Lora_700Bold',
      color: C.text, paddingVertical: 0,
    },
    promptCard: {
      backgroundColor: C.gold + '14', borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 16,
      paddingLeft: 19, overflow: 'hidden', gap: 6,
    },
    promptCardBorder: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, opacity: 0.7,
    },
    promptCategory: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: C.gold, letterSpacing: 1.5,
    },
    promptText: {
      fontSize: 15, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 24,
    },
    freeWriteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    freeWriteLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.textMuted },
    tagsSection: { gap: 8 },
    tagsLabel: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 1.5,
    },
    tagsRow: { gap: 7 },
    tagPill: {
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 100, borderWidth: 1,
    },
    tagPillText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
    input: {
      minHeight: 180, fontSize: 18,
      fontFamily: 'Lora_400Regular', lineHeight: 30,
      color: C.text, textAlignVertical: 'top',
    },
    moodBar: {
      gap: 10,
      paddingHorizontal: 20, paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    moodHint: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', paddingLeft: 4 },
    moodPillRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingBottom: 4 },
    moodPill: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      paddingVertical: 8, paddingHorizontal: 14,
      borderRadius: 100, borderWidth: 1,
    },
    moodDot: { width: 8, height: 8, borderRadius: 4 },
    moodPillLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  });
}
