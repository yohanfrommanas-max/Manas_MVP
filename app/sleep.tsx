import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: 'rainy', color: '#7DD3FC', desc: 'Gentle rainfall on leaves' },
  { id: 'ocean', name: 'Ocean Waves', icon: 'water', color: '#38BDF8', desc: 'Rhythmic tides on the shore' },
  { id: 'white-noise', name: 'White Noise', icon: 'radio', color: '#94A3B8', desc: 'Steady pink noise masking' },
  { id: 'forest', name: 'Forest', icon: 'leaf', color: C.sage, desc: 'Birds, wind, crickets' },
  { id: 'brown-noise', name: 'Brown Noise', icon: 'volume-high', color: '#A16207', desc: 'Deep, warm static' },
  { id: 'bowls', name: 'Tibetan Bowls', icon: 'musical-notes', color: C.mauve, desc: 'Harmonic singing bowls' },
  { id: 'delta', name: 'Delta Waves', icon: 'pulse', color: '#818CF8', desc: 'Deep sleep brainwaves', premium: true },
];

const TIMERS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
  { label: 'Until Morning', value: -1 },
];

function WaveAnimation({ color }: { color: string }) {
  const w1 = useSharedValue(1);
  const w2 = useSharedValue(1);
  const w3 = useSharedValue(1);

  React.useEffect(() => {
    w1.value = withRepeat(withSequence(withTiming(1.3, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1);
    w2.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(1.3, { duration: 1200 }), withTiming(1, { duration: 600 })), -1);
    w3.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(1.2, { duration: 1200 }), withTiming(1, { duration: 900 })), -1);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ scaleY: w1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ scaleY: w2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ scaleY: w3.value }] }));

  return (
    <View style={styles.waveRow}>
      {[s1, s2, s3, s2, s1].map((s, i) => (
        <Reanimated.View key={i} style={[styles.waveBar, s, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, addWellnessMinutes } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);
  const [timer, setTimer] = useState<number | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const togglePlay = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === id) { setPlaying(null); }
    else { setPlaying(id); }
  };

  const selectTimer = (val: number) => {
    setTimer(val);
    if (val > 0) addWellnessMinutes(val);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const playingSound = SOUNDS.find(s => s.id === playing);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#1A1B4B', '#0D1025', C.bg]} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:0,y:1}} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>Sleep</Text>
        <View style={{ width: 40 }} />
      </View>

      {playing && playingSound ? (
        <View style={styles.nowPlaying}>
          <LinearGradient colors={[playingSound.color + '20', C.card]} style={StyleSheet.absoluteFill} />
          <View style={styles.nowPlayingIcon}>
            <Ionicons name={playingSound.icon as any} size={32} color={playingSound.color} />
          </View>
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingLabel}>Now Playing</Text>
            <Text style={styles.nowPlayingName}>{playingSound.name}</Text>
          </View>
          <WaveAnimation color={playingSound.color} />
          <Pressable onPress={() => setPlaying(null)} style={styles.stopBtn}>
            <Ionicons name="stop" size={20} color={C.text} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.moonHero}>
          <Ionicons name="moon" size={60} color={'#818CF8'} />
          <Text style={styles.heroTitle}>Rest & Restore</Text>
          <Text style={styles.heroSub}>Select a sound to begin your sleep journey</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Sound Library</Text>
      <View style={styles.soundGrid}>
        {SOUNDS.map(s => {
          const isPlaying = playing === s.id;
          const fav = isFavourite(s.id);
          return (
            <View key={s.id} style={[styles.soundCard, isPlaying && { borderColor: s.color }]}>
              {isPlaying && <LinearGradient colors={[s.color + '20', C.card]} style={StyleSheet.absoluteFill} />}
              <Pressable style={styles.soundFav} onPress={() => toggleFavourite({ id: s.id, type: 'sleep', title: s.name, color: s.color, icon: s.icon })}>
                <Ionicons name={fav ? 'bookmark' : 'bookmark-outline'} size={14} color={fav ? C.gold : C.textMuted} />
              </Pressable>
              {s.premium && (
                <View style={styles.soundPremium}>
                  <Ionicons name="star" size={10} color={C.gold} />
                </View>
              )}
              <View style={[styles.soundIcon, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
              </View>
              <Text style={styles.soundName}>{s.name}</Text>
              <Text style={styles.soundDesc} numberOfLines={2}>{s.desc}</Text>
              <Pressable
                style={[styles.soundPlayBtn, { backgroundColor: isPlaying ? s.color : s.color + '25' }]}
                onPress={() => togglePlay(s.id)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? C.bg : s.color} />
                <Text style={[styles.soundPlayText, { color: isPlaying ? C.bg : s.color }]}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Sleep Timer</Text>
      <View style={styles.timerRow}>
        {TIMERS.map(t => (
          <Pressable
            key={t.value}
            style={[styles.timerChip, timer === t.value && { backgroundColor: '#818CF8' + '25', borderColor: '#818CF8' }]}
            onPress={() => selectTimer(t.value)}
          >
            <Text style={[styles.timerText, { color: timer === t.value ? '#818CF8' : C.textSub }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  nowPlaying: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  nowPlayingIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  nowPlayingInfo: { flex: 1, gap: 2 },
  nowPlayingLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  nowPlayingName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, height: 20, borderRadius: 2 },
  stopBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  moonHero: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  heroTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  heroSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  soundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  soundCard: {
    width: '47%', padding: 14, borderRadius: 18, gap: 8,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  soundFav: { alignSelf: 'flex-end' },
  soundPremium: { position: 'absolute', top: 12, right: 36, backgroundColor: C.gold + '30', borderRadius: 6, padding: 3 },
  soundIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  soundName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.text },
  soundDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 16 },
  soundPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7, borderRadius: 10 },
  soundPlayText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  timerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timerChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  timerText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
