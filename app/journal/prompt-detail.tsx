import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, ScrollView, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors, type Colors } from '@/constants/colors';
import { JOURNAL_IMAGES } from '@/data/journalImages';
import type { ImageAssetKey } from '@/data/journalPrompts';

export default function PromptDetailScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const { prompt, reflect, category, imageAsset } = useLocalSearchParams<{
    prompt: string;
    reflect: string;
    category: string;
    imageAsset: string;
  }>();

  const imgSrc = imageAsset && JOURNAL_IMAGES[imageAsset as ImageAssetKey]
    ? JOURNAL_IMAGES[imageAsset as ImageAssetKey]
    : JOURNAL_IMAGES['focus_1'];

  const handleStartWriting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/journal/new' as any,
      params: { prompt, promptCategory: category, imageAsset },
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={imgSrc} style={styles.hero} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={[styles.heroNav, { paddingTop: topInset + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={50} tint="dark" style={styles.backCircle}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </BlurView>
            ) : (
              <View style={[styles.backCircle, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.heroBottom}>
          <Text style={styles.heroCategory}>{(category ?? '').toUpperCase()}</Text>
          <Text style={styles.heroPrompt}>{prompt}</Text>
        </View>
      </ImageBackground>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: botInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.reflectLabel}>WHY THIS PROMPT</Text>
        <Text style={styles.reflectText}>{reflect}</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: botInset + 16 }]}>
        <Pressable style={styles.startBtn} onPress={handleStartWriting}>
          <Text style={styles.startBtnText}>Start writing</Text>
          <Ionicons name="create-outline" size={18} color={C.bg} />
        </Pressable>
        <Pressable
          style={styles.backToBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Text style={styles.backToBtnText}>Back to prompts</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(C: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    hero: { height: 280, justifyContent: 'space-between' },
    heroNav: { paddingHorizontal: 20 },
    backCircle: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    heroBottom: {
      paddingHorizontal: 22, paddingBottom: 24, gap: 8,
    },
    heroCategory: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: 'rgba(255,255,255,0.65)', letterSpacing: 2,
    },
    heroPrompt: {
      fontSize: 22, fontFamily: 'Lora_700Bold',
      color: '#FFFFFF', lineHeight: 32,
    },
    body: { paddingHorizontal: 22, paddingTop: 28, gap: 14 },
    reflectLabel: {
      fontSize: 10, fontFamily: 'Inter_600SemiBold',
      color: C.textMuted, letterSpacing: 2,
    },
    reflectText: {
      fontSize: 17, fontFamily: 'Lora_400Regular_Italic',
      color: C.textSub, lineHeight: 28,
    },
    footer: {
      paddingHorizontal: 20, paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
      backgroundColor: C.bg, gap: 10,
    },
    startBtn: {
      backgroundColor: C.lavender, borderRadius: 16,
      paddingVertical: 16, paddingHorizontal: 24,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    startBtnText: {
      fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.bg,
    },
    backToBtn: {
      alignItems: 'center', paddingVertical: 8,
    },
    backToBtnText: {
      fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted,
    },
  });
}
