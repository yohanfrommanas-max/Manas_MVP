import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/constants/colors';

export default function DeepDiveHome() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      <View style={[S.nav, { paddingTop: topInset + 8 }]}>
        <Pressable style={S.back} onPress={() => router.back()} hitSlop={12}>
          <Text style={[S.backArrow, { color: C.text }]}>←</Text>
        </Pressable>
      </View>

      <View style={S.body}>
        <View style={[S.badge, { borderColor: 'rgba(167,139,250,0.2)', backgroundColor: 'rgba(167,139,250,0.08)' }]}>
          <Text style={[S.badgeText, { color: 'rgba(167,139,250,0.9)' }]}>MANAS</Text>
          <View style={S.badgeSep} />
          <Text style={[S.badgeCog, { color: C.textSub }]}>COGNITIVE</Text>
        </View>

        <Text style={[S.title, { color: C.text }]}>
          Deep{' '}
          <Text style={{ color: '#A78BFA', fontStyle: 'italic' }}>Dive.</Text>
        </Text>

        <Text style={[S.coming, { color: C.textSub }]}>Coming soon</Text>

        <Text style={[S.desc, { color: C.textSub }]}>
          Read something real. Lock in the key points.{'\n'}
          Then prove it — inside a puzzle that demands{'\n'}
          you think several moves ahead.
        </Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: {
    width: 34, height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 8,
  },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8 },
  badgeSep: { width: 1, height: 12, backgroundColor: 'rgba(167,139,250,0.25)' },
  badgeCog: { fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.8 },
  title: {
    fontSize: 44, fontFamily: 'Lora_700Bold',
    letterSpacing: -1.5, textAlign: 'center', lineHeight: 52,
  },
  coming: {
    fontSize: 13, fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    opacity: 0.5,
  },
  desc: {
    fontSize: 14, fontFamily: 'Inter_400Regular',
    lineHeight: 24, textAlign: 'center', opacity: 0.65,
  },
});
