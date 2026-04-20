import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Animated, Easing, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const LAV = '#A78BFA';
const LAV_D = '#7C5FD4';
const CYAN = '#22D3EE';
const SAGE = '#6EE7B7';
const SUB = '#7A8099';
const TEXT = '#E8E4DC';
const BORDER = 'rgba(255,255,255,0.06)';

export default function DeepDiveHome() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinRev = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={[S.inner, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge */}
        <View style={S.badge}>
          <LinearGradient colors={[LAV, CYAN]} style={S.badgeLogo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={{ fontSize: 10 }}>🧠</Text>
          </LinearGradient>
          <Text style={S.badgeText}>MANAS</Text>
          <View style={S.badgeSep} />
          <Text style={S.badgeCog}>COGNITIVE</Text>
        </View>

        {/* Orb */}
        <View style={S.orbWrap}>
          <Animated.View
            style={[S.orbOuter, { transform: [{ rotate: spin }] }]}
          >
            <LinearGradient
              colors={['rgba(167,139,250,0.7)', 'rgba(34,211,238,0.5)', 'rgba(110,231,183,0.4)', 'rgba(167,139,250,0.7)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          <Animated.View style={[S.orbInner, { transform: [{ rotate: spinRev }] }]}>
            <Text style={S.orbIcon}>📖</Text>
            <Text style={S.orbLbl}>DEEP DIVE</Text>
          </Animated.View>
        </View>

        {/* Title */}
        <Text style={S.title}>
          Deep <Text style={S.titleAccent}>Dive.</Text>
        </Text>

        {/* Tag */}
        <Text style={S.tag}>
          {'Read something real. Lock in the key points.\nThen prove it — inside a puzzle that demands\nyou think several moves ahead.'}
        </Text>

        {/* Pills */}
        <View style={S.pills}>
          {['Semantic Memory', 'Spatial Planning', 'Recall Under Load'].map(p => (
            <View key={p} style={S.pill}>
              <Text style={S.pillText}>{p}</Text>
            </View>
          ))}
        </View>

        {/* Cog box */}
        <View style={S.cogBox}>
          <Text style={S.cogLbl}>WHAT THIS TRAINS</Text>
          <Text style={S.cogTxt}>
            Reading activates episodic encoding. Flashcards drive consolidation. The Thread puzzle demands spatial planning while your recall is tested mid-game — a genuine dual-task cognitive load.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/deep-dive/topics');
          }}
          style={({ pressed }) => [S.cta, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
        >
          <LinearGradient
            colors={[LAV, LAV_D]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View>
            <Text style={S.ctaText}>Start today's Deep Dive</Text>
            <Text style={S.ctaSub}>3 topics · pick one · ~6 minutes</Text>
          </View>
          <Text style={S.ctaArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  inner: { paddingHorizontal: 24, paddingTop: 18 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 24,
  },
  badgeLogo: {
    width: 20, height: 20, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: 'rgba(167,139,250,0.9)', letterSpacing: 0.6 },
  badgeSep: { width: 1, height: 12, backgroundColor: 'rgba(167,139,250,0.25)' },
  badgeCog: { fontSize: 10, fontFamily: 'Inter_500Medium', color: SUB, letterSpacing: 0.6 },

  orbWrap: {
    width: 160, height: 160, borderRadius: 80,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, overflow: 'hidden',
  },
  orbOuter: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80, overflow: 'hidden',
  },
  orbInner: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  orbIcon: { fontSize: 34 },
  orbLbl: { fontSize: 9, letterSpacing: 1.4, color: SUB, fontFamily: 'Inter_500Medium' },

  title: {
    fontFamily: 'Lora_400Regular', fontSize: 40, color: TEXT,
    lineHeight: 42, letterSpacing: -1.5, textAlign: 'center', marginBottom: 10,
  },
  titleAccent: { color: LAV, fontFamily: 'Lora_400Regular_Italic' },

  tag: {
    fontSize: 13, color: SUB, lineHeight: 21, textAlign: 'center',
    marginBottom: 22, paddingHorizontal: 8,
  },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 24 },
  pill: {
    backgroundColor: '#1A1D27', borderWidth: 1, borderColor: BORDER,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: SUB, letterSpacing: 0.4 },

  cogBox: {
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 3, borderLeftColor: LAV,
    borderRadius: 13, padding: 14, marginBottom: 24,
  },
  cogLbl: { fontSize: 9, color: LAV, letterSpacing: 1.2, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  cogTxt: { fontSize: 12, color: SUB, lineHeight: 19 },

  cta: {
    borderRadius: 18, paddingHorizontal: 22, paddingVertical: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ctaText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0B0D12' },
  ctaSub: { fontSize: 11, color: 'rgba(11,13,18,0.5)', marginTop: 2 },
  ctaArrow: { fontSize: 22, color: '#0B0D12' },
});
