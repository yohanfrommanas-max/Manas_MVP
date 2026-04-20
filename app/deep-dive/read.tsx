import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDeepDive } from '@/context/DeepDiveContext';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const LAV = '#A78BFA';
const LAV_D = '#7C5FD4';
const SAGE = '#6EE7B7';
const TEXT = '#E8E4DC';
const SUB = '#7A8099';
const BORDER = 'rgba(255,255,255,0.06)';

function parseBody(html: string): React.ReactNode[] {
  const paras = html.split(/<\/?p>/g).filter(s => s.trim());
  return paras.map((para, pi) => {
    const parts: React.ReactNode[] = [];
    const regex = /<(strong|em)>(.*?)<\/\1>/gs;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(para)) !== null) {
      if (m.index > last) parts.push(para.slice(last, m.index));
      if (m[1] === 'strong') {
        parts.push(
          <Text key={`s${pi}${m.index}`} style={{ color: TEXT, fontFamily: 'Lora_700Bold' }}>{m[2]}</Text>
        );
      } else {
        parts.push(
          <Text key={`e${pi}${m.index}`} style={{ color: SAGE, fontStyle: 'italic' }}>{m[2]}</Text>
        );
      }
      last = m.index + m[0].length;
    }
    if (last < para.length) parts.push(para.slice(last));
    return (
      <Text key={pi} style={S.bodyPara}>{parts}</Text>
    );
  });
}

export default function ReadScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { topic } = useDeepDive();

  if (!topic) { router.replace('/deep-dive/topics'); return null; }

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={S.nav}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={S.backArrow}>←</Text>
        </Pressable>
        <View style={S.navInfo}>
          <Text style={S.navPhase}>Phase 1 of 3 · Read</Text>
          <Text style={S.navTitle} numberOfLines={1}>{topic.name}</Text>
        </View>
      </View>
      <View style={S.phaseBar}>
        <View style={[S.phaseFill, { width: '33%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: botPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.body}>
          <Text style={S.icon}>{topic.icon}</Text>
          <Text style={S.title}>{topic.name}</Text>
          <Text style={S.domain}>{topic.domain}</Text>
          <View>{parseBody(topic.body)}</View>
        </View>

        {/* CTA */}
        <View style={S.ctaWrap}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/deep-dive/flashcards');
            }}
            style={({ pressed }) => [S.cta, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
          >
            <LinearGradient
              colors={[LAV, LAV_D]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View>
              <Text style={S.ctaText}>Got it — show me the key points</Text>
              <Text style={S.ctaSub}>4 flashcards · then Thread</Text>
            </View>
            <Text style={S.ctaArr}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(11,13,18,0.96)',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1A1D27', borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 15, color: '#E8E4DC' },
  navInfo: { flex: 1 },
  navPhase: { fontSize: 9, color: LAV, letterSpacing: 1.2, fontFamily: 'Inter_500Medium', marginBottom: 1 },
  navTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#E8E4DC' },

  phaseBar: { height: 2, backgroundColor: '#1A1D27' },
  phaseFill: { height: 2, backgroundColor: LAV },

  body: { padding: 22 },
  icon: { fontSize: 36, marginBottom: 14 },
  title: { fontFamily: 'Lora_400Regular', fontSize: 23, color: '#E8E4DC', lineHeight: 29, letterSpacing: -0.5, marginBottom: 4 },
  domain: { fontSize: 9, letterSpacing: 1.2, color: LAV, fontFamily: 'Inter_500Medium', marginBottom: 18 },
  bodyPara: {
    fontFamily: 'Lora_400Regular', fontSize: 15,
    color: 'rgba(232,228,220,0.82)', lineHeight: 28, marginBottom: 16,
  },

  ctaWrap: { paddingHorizontal: 22, paddingBottom: 8 },
  cta: {
    borderRadius: 18, paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ctaText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0B0D12' },
  ctaSub: { fontSize: 11, color: 'rgba(11,13,18,0.5)', marginTop: 2 },
  ctaArr: { fontSize: 20, color: '#0B0D12' },
});
