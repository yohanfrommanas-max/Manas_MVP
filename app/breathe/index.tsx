import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, DARK, type Colors } from '@/constants/colors';
const C = DARK;

const TECHNIQUES = [
  {
    id: 'box', name: 'Box Breathing',
    desc: 'Equal counts of inhale, hold, exhale, hold. Used by Navy SEALs to reduce stress and sharpen focus.',
    timing: '4s / 4s / 4s / 4s', icon: 'square-outline', color: C.sage,
  },
  {
    id: '478', name: '4-7-8 Technique',
    desc: 'Inhale for 4, hold for 7, exhale for 8. Activates the parasympathetic nervous system.',
    timing: '4s / 7s / 8s', icon: 'moon', color: '#818CF8',
  },
  {
    id: 'deep', name: 'Deep Calm',
    desc: 'Slow, extended exhales to lower heart rate and release tension.',
    timing: '4s / 0s / 8s', icon: 'leaf', color: C.sage,
  },
  {
    id: 'energize', name: 'Energize',
    desc: 'Short, sharp inhales and exhales to increase alertness and energy.',
    timing: '2s / 0s / 2s', icon: 'flash', color: C.gold,
  },
  {
    id: 'sigh', name: 'Physiological Sigh',
    desc: 'Double inhale through the nose followed by a long exhale. Fastest way to reduce stress.',
    timing: '2s+2s / 0s / 8s', icon: 'sync', color: C.mauve,
  },
];

export default function BreatheLibraryScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const { isFavourite, toggleFavourite } = useApp();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D2A1F', '#0D0F14']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.title}>Breathe</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>Choose a technique to begin</Text>

        {TECHNIQUES.map(t => {
          const fav = isFavourite(t.id);
          return (
            <Pressable
              key={t.id}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/breathe/[id]', params: { id: t.id } });
              }}
            >
              <LinearGradient
                colors={[t.color + '20', t.color + '08', C.card]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.cardMain}>
                <View style={[styles.cardIcon, { backgroundColor: t.color + '20', borderColor: t.color + '40' }]}>
                  <Ionicons name={t.icon as any} size={26} color={t.color} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{t.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{t.desc}</Text>
                  <View style={styles.timingRow}>
                    <Ionicons name="time-outline" size={12} color={C.textMuted} />
                    <Text style={[styles.timingText, { color: t.color }]}>{t.timing}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleFavourite({ id: t.id, type: 'breathe', title: t.name, color: t.color, icon: t.icon });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name={fav ? 'star' : 'star-outline'} size={20} color={fav ? C.gold : C.textMuted} />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} style={{ marginTop: 14 }} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, marginBottom: 4 },
  card: {
    borderRadius: 18, overflow: 'hidden', padding: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  cardMain: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cardBody: { flex: 1, gap: 6 },
  cardName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text },
  cardDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  timingText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  cardRight: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
});
}
