import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

const SLIDE_DURATION = 180;

export default function FlashcardsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [cardIndex, setCardIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const cards = topic.cards;
  const card = cards[cardIndex];
  const isLast = cardIndex === cards.length - 1;
  const isFirst = cardIndex === 0;

  function slideTo(direction: 'left' | 'right', newIndex: number) {
    if (isAnimating.current) return;
    isAnimating.current = true;
    const outTo = direction === 'left' ? -350 : 350;
    const inFrom = direction === 'left' ? 350 : -350;

    Animated.timing(slideAnim, {
      toValue: outTo,
      duration: SLIDE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(inFrom);
      setCardIndex(newIndex);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  }

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      router.push('/deep-dive/thread');
    } else {
      slideTo('left', cardIndex + 1);
    }
  }

  function handlePrev() {
    if (isFirst) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    slideTo('right', cardIndex - 1);
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.phaseLabel, { color: C.sage }]}>Phase 2 of 3</Text>
          <Text style={[styles.phaseSub, { color: C.textMuted }]}>Flashcards</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
        <View style={[styles.progressFill, { backgroundColor: C.sage, width: '66%' }]} />
      </View>

      {/* Topic name */}
      <Text style={[styles.topicName, { color: C.textSub }]} numberOfLines={1}>
        {topic.name}
      </Text>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < cardIndex ? C.sage : i === cardIndex ? C.lavender : C.border,
                width: i === cardIndex ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: C.card, borderColor: C.lavender + '40' },
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={[C.lavender + '16', C.bg + '00']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.kpBadge, { backgroundColor: C.lavender + '20' }]}>
            <Text style={[styles.kpText, { color: C.lavender }]}>{card.kp}</Text>
          </View>
          <Text style={[styles.cardMain, { color: C.text }]}>{card.main}</Text>
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <Text style={[styles.cardDetail, { color: C.textSub }]}>{card.detail}</Text>
        </Animated.View>
      </View>

      {/* Navigation */}
      <View style={[styles.nav, { paddingBottom: botInset + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.prevBtn,
            { borderColor: C.border, backgroundColor: C.card },
            isFirst && { opacity: 0.35 },
            pressed && !isFirst && { opacity: 0.75 },
          ]}
          onPress={handlePrev}
          disabled={isFirst}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
          <Text style={[styles.prevBtnText, { color: C.text }]}>Prev</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: isLast ? C.sage : C.lavender },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.nextBtnText, { color: C.bg }]}>
            {isLast ? 'Start Thread' : 'Next'}
          </Text>
          <Ionicons
            name={isLast ? 'git-network-outline' : 'chevron-forward'}
            size={18}
            color={C.bg}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 0,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phaseLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  phaseSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  progressTrack: { height: 3, marginTop: 10, marginHorizontal: 0 },
  progressFill: { height: 3 },
  topicName: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    paddingHorizontal: 20, marginTop: 12, marginBottom: 4,
  },
  dots: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 20,
    marginBottom: 16,
  },
  dot: { height: 4, borderRadius: 2 },
  cardArea: {
    flex: 1, paddingHorizontal: 20, overflow: 'hidden',
  },
  card: {
    flex: 1, borderRadius: 22, borderWidth: 1,
    padding: 24, overflow: 'hidden', gap: 16,
    justifyContent: 'center',
  },
  kpBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 100,
  },
  kpText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  cardMain: { fontSize: 20, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  divider: { height: 1, marginVertical: 4 },
  cardDetail: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  nav: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16,
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  prevBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  nextBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
