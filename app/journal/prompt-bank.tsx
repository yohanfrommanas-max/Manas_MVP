import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  FlatList, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors, type Colors } from '@/constants/colors';
import PROMPTS, { PROMPT_CATEGORIES, type JournalPrompt, type PromptCategory } from '@/data/journalPrompts';
import { JOURNAL_IMAGES } from '@/data/journalImages';

function getCategoryData(C: Colors): Record<PromptCategory, { pill: string; pillText: string }> {
  return {
    'On focus': { pill: C.promptCardGradients[0][0], pillText: '#C6D9F0' },
    'On the body': { pill: C.promptCardGradients[2][0], pillText: '#B0DFC8' },
    'On letting go': { pill: C.promptCardGradients[5][0], pillText: '#E8D0E8' },
    'On connection': { pill: C.promptCardGradients[1][0], pillText: '#D4BFFF' },
    'On effort': { pill: C.promptCardGradients[3][0], pillText: '#F0D4B8' },
    'On stillness': { pill: C.promptCardGradients[4][0], pillText: '#C0D8F8' },
  };
}

function PromptCard({
  item,
  height,
  isSelected,
  onPress,
}: {
  item: JournalPrompt;
  height: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const imgSrc = JOURNAL_IMAGES[item.imageAsset];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.gridCard,
        { height },
        isSelected && styles.gridCardSelected,
        pressed && { opacity: 0.88 },
      ]}
      onPress={onPress}
    >
      <ImageBackground source={imgSrc} style={StyleSheet.absoluteFill} resizeMode="cover">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCategory}>{item.category.toUpperCase()}</Text>
          <Text style={styles.gridText} numberOfLines={3}>{item.text}</Text>
        </View>
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          </View>
        )}
      </ImageBackground>
    </Pressable>
  );
}

export default function PromptBankScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const CAT_DATA = useMemo(() => getCategoryData(C), [C]);
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'All'>('All');
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);

  const filteredPrompts = useMemo(() => {
    if (activeCategory === 'All') return PROMPTS;
    return PROMPTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const handleWriteThis = () => {
    if (!selectedPrompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/journal/prompt-detail' as Href,
      params: {
        prompt: selectedPrompt.text,
        reflect: selectedPrompt.reflect,
        category: selectedPrompt.category,
        imageAsset: selectedPrompt.imageAsset,
      },
    });
  };

  const handleSelectPrompt = (item: JournalPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPrompt(prev => prev?.text === item.text ? null : item);
  };

  type RenderItem = { left: JournalPrompt; right: JournalPrompt | null; index: number };

  const rows: RenderItem[] = useMemo(() => {
    const result: RenderItem[] = [];
    for (let i = 0; i < filteredPrompts.length; i += 2) {
      result.push({ left: filteredPrompts[i], right: filteredPrompts[i + 1] ?? null, index: i });
    }
    return result;
  }, [filteredPrompts]);

  const pillCategories: Array<PromptCategory | 'All'> = ['All', ...PROMPT_CATEGORIES];

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>Prompt Bank</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={rows}
        keyExtractor={item => `row-${item.index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: botInset + 100 }]}
        ListHeaderComponent={
          <FlatList
            data={pillCategories}
            keyExtractor={cat => cat}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
            renderItem={({ item: cat }) => {
              const isActive = activeCategory === cat;
              const catStyle = cat !== 'All' ? CAT_DATA[cat as PromptCategory] : null;
              return (
                <Pressable
                  style={[
                    styles.pill,
                    isActive && { backgroundColor: catStyle?.pill ?? C.lavender },
                    !isActive && { backgroundColor: C.card, borderColor: C.border },
                  ]}
                  onPress={() => {
                    setActiveCategory(cat);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[
                    styles.pillText,
                    isActive && { color: catStyle?.pillText ?? '#FFFFFF' },
                    !isActive && { color: C.textSub },
                  ]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            }}
          />
        }
        renderItem={({ item: row, index }) => {
          const leftHeight = index % 2 === 0 ? 190 : 145;
          const rightHeight = index % 2 === 0 ? 145 : 190;
          return (
            <View style={styles.gridRow}>
              <View style={{ flex: 1 }}>
                <PromptCard
                  item={row.left}
                  height={leftHeight}
                  isSelected={selectedPrompt?.text === row.left.text}
                  onPress={() => handleSelectPrompt(row.left)}
                />
              </View>
              {row.right ? (
                <View style={{ flex: 1 }}>
                  <PromptCard
                    item={row.right}
                    height={rightHeight}
                    isSelected={selectedPrompt?.text === row.right.text}
                    onPress={() => handleSelectPrompt(row.right!)}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: botInset + 16 }]}>
        <Pressable
          style={[
            styles.writeBtn,
            !selectedPrompt && styles.writeBtnDisabled,
          ]}
          onPress={handleWriteThis}
          disabled={!selectedPrompt}
        >
          <Text style={[styles.writeBtnText, !selectedPrompt && { color: C.textMuted }]}>
            {selectedPrompt ? 'Write to this prompt' : 'Select a prompt above'}
          </Text>
          {selectedPrompt && (
            <Ionicons name="arrow-forward" size={18} color={C.bg} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingBottom: 12, paddingTop: 4,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
    pillsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
    pill: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 100, borderWidth: 1,
    },
    pillText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    listContent: { paddingHorizontal: 12, gap: 0 },
    gridRow: {
      flexDirection: 'row', gap: 8, marginBottom: 8,
    },
    gridCard: {
      borderRadius: 18, overflow: 'hidden',
    },
    gridCardSelected: {
      borderWidth: 2, borderColor: C.lavender,
    },
    gridCardContent: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: 14, gap: 6,
    },
    gridCategory: {
      fontSize: 9, fontFamily: 'Inter_600SemiBold',
      color: 'rgba(255,255,255,0.6)', letterSpacing: 1.4,
    },
    gridText: {
      fontSize: 13, fontFamily: 'Lora_700Bold',
      color: '#FFFFFF', lineHeight: 18,
    },
    selectedCheckmark: {
      position: 'absolute', top: 10, right: 10,
    },
    footer: {
      paddingHorizontal: 20, paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    writeBtn: {
      backgroundColor: C.lavender, borderRadius: 16,
      paddingVertical: 16, paddingHorizontal: 24,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    writeBtnDisabled: {
      backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    },
    writeBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.bg,
    },
  });
}
