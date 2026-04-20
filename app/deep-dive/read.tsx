import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Animated, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';
import { sanitizeDashes } from '@/utils/sanitize';

function parseHtml(html: string) {
  const paragraphs = sanitizeDashes(html)
    .replace(/<\/p>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/?(strong|em|b|i)>/g, '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  return paragraphs;
}

function parseRichHtml(html: string): Array<{ text: string; bold: boolean; italic: boolean }[]> {
  const paragraphs: Array<{ text: string; bold: boolean; italic: boolean }[]> = [];
  const rawParas = sanitizeDashes(html).split('</p>').map(p => p.replace('<p>', '').trim()).filter(Boolean);

  for (const para of rawParas) {
    const spans: { text: string; bold: boolean; italic: boolean }[] = [];
    const regex = /<(strong|em)>(.*?)<\/\1>|([^<]+)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(para)) !== null) {
      if (m[1] === 'strong') {
        spans.push({ text: m[2], bold: true, italic: false });
      } else if (m[1] === 'em') {
        spans.push({ text: m[2], bold: false, italic: true });
      } else if (m[3]) {
        spans.push({ text: m[3], bold: false, italic: false });
      }
    }
    if (spans.length > 0) paragraphs.push(spans);
  }
  return paragraphs;
}

export default function ReadScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic } = useDeepDive();
  const scrollRef = useRef<ScrollView>(null);
  const [scrolled, setScrolled] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const paragraphs = useMemo(() => {
    if (!topic) return [];
    return parseRichHtml(topic.body);
  }, [topic]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const progress = contentOffset.y / Math.max(1, contentSize.height - layoutMeasurement.height);
    setReadProgress(Math.min(1, progress));
    if (progress > 0.1) setScrolled(true);
  }

  function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/deep-dive/flashcards');
  }

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.phaseNum, { color: C.lavender }]}>Phase 1 of 3</Text>
          <Text style={[styles.phaseLabel, { color: C.textMuted }]} numberOfLines={1}>Read · {topic.name}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Phase progress bar — fixed at 33% */}
      <View style={[styles.progressBg, { backgroundColor: C.border }]}>
        <View style={[styles.progressFill, { width: '33%', backgroundColor: C.lavender }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingBottom: botInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic header */}
        <View style={[styles.topicHeader, { borderColor: C.border }]}>
          <LinearGradient
            colors={[C.lavender + '20', C.wisteria + '08']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.topicEmoji}>{topic.icon}</Text>
          <View style={styles.topicMeta}>
            <Text style={[styles.topicName, { color: C.text }]}>{topic.name}</Text>
            <Text style={[styles.topicDomain, { color: C.lavender }]}>{topic.domain}</Text>
          </View>
        </View>

        {/* Reading time estimate */}
        <View style={styles.readInfo}>
          <Ionicons name="time-outline" size={14} color={C.textMuted} />
          <Text style={[styles.readInfoText, { color: C.textMuted }]}>~3 min read</Text>
          <View style={[styles.dot, { backgroundColor: C.textMuted }]} />
          <Ionicons name="book-outline" size={14} color={C.textMuted} />
          <Text style={[styles.readInfoText, { color: C.textMuted }]}>Read carefully. Quiz follows.</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {paragraphs.map((para, pi) => (
            <Text key={pi} style={[styles.para, { color: C.text }]}>
              {para.map((span, si) => (
                <Text
                  key={si}
                  style={[
                    span.bold && styles.bold,
                    span.italic && styles.italic,
                  ]}
                >
                  {span.text}
                </Text>
              ))}
            </Text>
          ))}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View style={[styles.footer, { paddingBottom: botInset + 16, backgroundColor: C.bg }]}>
        <LinearGradient
          colors={[C.bg + '00', C.bg]}
          style={styles.footerGrad}
          pointerEvents="none"
        />
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            { backgroundColor: readProgress > 0.7 ? C.lavender : C.card, borderColor: C.border },
            pressed && { opacity: 0.88 },
          ]}
          onPress={handleContinue}
        >
          <Text style={[styles.continueBtnText, { color: readProgress > 0.7 ? C.bg : C.text }]}>
            {readProgress > 0.7 ? 'Continue to Flashcards' : 'Skip to Flashcards'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={readProgress > 0.7 ? C.bg : C.text}
          />
        </Pressable>
        {readProgress < 0.7 && (
          <Text style={[styles.scrollHint, { color: C.textMuted }]}>
            Scroll to read the full article
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  progressBg: { height: 2, width: '100%' },
  progressFill: { height: 2, borderRadius: 1 },
  content: { paddingHorizontal: 20 },
  topicHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16,
    marginTop: 16, marginBottom: 12, overflow: 'hidden',
  },
  topicEmoji: { fontSize: 38 },
  topicMeta: { flex: 1, gap: 4 },
  topicName: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  topicDomain: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  readInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 20,
  },
  readInfoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dot: { width: 3, height: 3, borderRadius: 2 },
  body: { gap: 18 },
  para: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 28 },
  bold: { fontFamily: 'Inter_700Bold' },
  italic: { fontStyle: 'italic' },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  footerGrad: { position: 'absolute', top: -40, left: 0, right: 0, height: 40 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 16, padding: 16, borderWidth: 1,
  },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  scrollHint: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8 },
});
