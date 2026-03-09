import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import C from '@/constants/colors';

type Tab = 'Sleepcasts' | 'Visualizations' | 'Stretches';

const SLEEPCASTS = [
  { id: 'sc-library',   title: 'The Old Library',         desc: 'A quiet evening among towering shelves and the scent of old books. Pages turn softly in the lamplight.', narrator: 'James', duration: '45 min', color: '#6366F1', icon: 'book' },
  { id: 'sc-train',     title: 'Night Train to Nowhere',  desc: 'Drift off to the gentle rumble of a sleeper train crossing dark countryside under a canopy of stars.', narrator: 'Sarah', duration: '38 min', color: C.wisteria, icon: 'time' },
  { id: 'sc-provence',  title: 'Lavender Fields',         desc: 'A slow walk through Provence as the evening light fades warm and golden over rolling purple hills.', narrator: 'James', duration: '42 min', color: C.lavender, icon: 'flower' },
  { id: 'sc-shepherd',  title: 'The Mountain Shepherd',   desc: 'Follow a shepherd home as the first stars appear above a quiet highland valley wrapped in mist.', narrator: 'Sarah', duration: '50 min', color: '#818CF8', icon: 'cloudy-night' },
  { id: 'sc-beekeeper', title: "The Beekeeper's Garden",  desc: 'A summer garden at dusk — bees returning home, jasmine in the warm air, the day quietly ending.', narrator: 'Emma', duration: '35 min', color: C.gold, icon: 'sunny' },
];

const VISUALIZATIONS = [
  { id: 'vis-forest',   title: 'Forest Clearing',         desc: 'A moonlit glade where silence holds you gently',             duration: '12 min', color: C.sage,     icon: 'leaf' },
  { id: 'vis-water',    title: 'Floating on Still Water',  desc: 'Drift on a calm, warm lake as every thought dissolves',       duration: '10 min', color: '#7DD3FC', icon: 'water' },
  { id: 'vis-mountain', title: 'Mountain Summit at Dawn',  desc: 'Breathe cool air above a valley slowly waking below',         duration: '15 min', color: C.wisteria, icon: 'cloud' },
  { id: 'vis-desert',   title: 'Desert Night Sky',         desc: 'Lie on warm sand beneath an infinite dome of stars',          duration: '12 min', color: '#818CF8', icon: 'moon' },
  { id: 'vis-warmth',   title: 'Warm Light Bath',          desc: 'A golden light melts tension away, from crown to toe',        duration: '8 min',  color: C.gold,    icon: 'sunny' },
];

const STRETCHES = [
  { id: 'str-winddown',  title: '5-Min Wind Down',         desc: 'Signal your body it is time to rest',                          duration: '5 min',  difficulty: 'Easy',     steps: 6,  icon: 'body',          color: C.lavender },
  { id: 'str-neck',      title: 'Neck & Shoulder Release', desc: 'Dissolve the tension carried in your upper body from the day', duration: '8 min',  difficulty: 'Easy',     steps: 8,  icon: 'man',           color: C.mauve },
  { id: 'str-fullbody',  title: 'Full Body Unwind',         desc: 'A head-to-toe sequence to prepare every muscle for rest',     duration: '15 min', difficulty: 'Moderate', steps: 12, icon: 'fitness',       color: C.sage },
  { id: 'str-hip',       title: 'Hip & Lower Back',         desc: 'Open the areas most affected by sitting and stress',          duration: '10 min', difficulty: 'Moderate', steps: 9,  icon: 'body-outline',  color: '#818CF8' },
  { id: 'str-spine',     title: 'Gentle Spine Stretch',     desc: 'Slow, careful movements to decompress and lengthen the spine', duration: '7 min', difficulty: 'Easy',     steps: 7,  icon: 'accessibility', color: C.rose },
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
  const { play, stop } = useAmbientAudio();
  const [activeTab, setActiveTab] = useState<Tab>('Sleepcasts');
  const [playing, setPlaying] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const togglePlay = (id: string, color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === id) {
      stop();
      setPlaying(null);
    } else {
      play(id);
      setPlaying(id);
      addWellnessMinutes(1);
    }
  };

  const stopAll = () => { stop(); setPlaying(null); };

  const startStretch = (title: string, duration: string) => {
    const mins = parseInt(duration);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWellnessMinutes(mins);
    Alert.alert('Starting Session', `${title}\n\nFind a comfortable position on your mat or bed and follow along at your own pace.`, [{ text: 'Begin', style: 'default' }]);
  };

  const playingCast = SLEEPCASTS.find(s => s.id === playing) ?? VISUALIZATIONS.find(v => v.id === playing);

  const TABS: Tab[] = ['Sleepcasts', 'Visualizations', 'Stretches'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#1A1B4B', '#0D1025', C.bg]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => { stopAll(); router.back(); }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>Sleep</Text>
        <View style={{ width: 40 }} />
      </View>

      {playing && playingCast ? (
        <View style={styles.nowPlaying}>
          <LinearGradient colors={[playingCast.color + '25', C.card]} style={StyleSheet.absoluteFill} />
          <View style={[styles.nowPlayingIcon, { backgroundColor: playingCast.color + '20' }]}>
            <Ionicons name={playingCast.icon as any} size={28} color={playingCast.color} />
          </View>
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingLabel}>Now Playing</Text>
            <Text style={styles.nowPlayingName}>{playingCast.title}</Text>
          </View>
          <WaveAnimation color={playingCast.color} />
          <Pressable onPress={stopAll} style={styles.stopBtn}>
            <Ionicons name="stop" size={18} color={C.text} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.hero}>
          <Ionicons name="moon" size={52} color="#818CF8" />
          <Text style={styles.heroTitle}>Rest & Restore</Text>
          <Text style={styles.heroSub}>Stories, visuals and stretches for deep, restorative sleep</Text>
        </View>
      )}

      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
            onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'Sleepcasts' && (
        <View style={styles.castList}>
          {SLEEPCASTS.map(cast => {
            const isPlaying = playing === cast.id;
            const fav = isFavourite(cast.id);
            return (
              <View key={cast.id} style={[styles.castCard, isPlaying && { borderColor: cast.color + '80' }]}>
                <LinearGradient colors={[cast.color + '30', cast.color + '10', C.card]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.castTop}>
                  <View style={[styles.castIcon, { backgroundColor: cast.color + '25' }]}>
                    <Ionicons name={cast.icon as any} size={28} color={cast.color} />
                  </View>
                  <View style={styles.castMeta}>
                    <View style={styles.narratorTag}>
                      <Ionicons name="mic" size={11} color={C.textMuted} />
                      <Text style={styles.narratorText}>{cast.narrator}</Text>
                    </View>
                    <View style={styles.durationTag}>
                      <Ionicons name="time-outline" size={11} color={C.textMuted} />
                      <Text style={styles.durationText}>{cast.duration}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => toggleFavourite({ id: cast.id, type: 'sleep', title: cast.title, color: cast.color, icon: cast.icon })}
                    hitSlop={8}
                  >
                    <Ionicons name={fav ? 'star' : 'star-outline'} size={18} color={fav ? C.gold : C.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.castTitle}>{cast.title}</Text>
                <Text style={styles.castDesc} numberOfLines={2}>{cast.desc}</Text>
                <Pressable
                  style={[styles.castPlayBtn, { backgroundColor: isPlaying ? cast.color : cast.color + '25' }]}
                  onPress={() => togglePlay(cast.id, cast.color)}
                >
                  {isPlaying && <WaveAnimation color={C.bg} />}
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color={isPlaying ? C.bg : cast.color} />
                  <Text style={[styles.castPlayText, { color: isPlaying ? C.bg : cast.color }]}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {activeTab === 'Visualizations' && (
        <View style={styles.visGrid}>
          {VISUALIZATIONS.map(vis => {
            const isPlaying = playing === vis.id;
            const fav = isFavourite(vis.id);
            return (
              <View key={vis.id} style={[styles.visCard, isPlaying && { borderColor: vis.color }]}>
                {isPlaying && <LinearGradient colors={[vis.color + '25', C.card]} style={StyleSheet.absoluteFill} />}
                <View style={styles.visCardTop}>
                  <View style={[styles.visIcon, { backgroundColor: vis.color + '20' }]}>
                    <Ionicons name={vis.icon as any} size={22} color={vis.color} />
                  </View>
                  <Pressable
                    onPress={() => toggleFavourite({ id: vis.id, type: 'sleep', title: vis.title, color: vis.color, icon: vis.icon })}
                    hitSlop={8}
                  >
                    <Ionicons name={fav ? 'star' : 'star-outline'} size={15} color={fav ? C.gold : C.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.visTitle}>{vis.title}</Text>
                <Text style={styles.visDesc} numberOfLines={2}>{vis.desc}</Text>
                <View style={styles.visDuration}>
                  <Ionicons name="time-outline" size={11} color={C.textMuted} />
                  <Text style={styles.visDurationText}>{vis.duration}</Text>
                </View>
                <Pressable
                  style={[styles.visPlayBtn, { backgroundColor: isPlaying ? vis.color : vis.color + '25' }]}
                  onPress={() => togglePlay(vis.id, vis.color)}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={13} color={isPlaying ? C.bg : vis.color} />
                  <Text style={[styles.visPlayText, { color: isPlaying ? C.bg : vis.color }]}>
                    {isPlaying ? 'Pause' : 'Begin'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {activeTab === 'Stretches' && (
        <View style={styles.stretchList}>
          {STRETCHES.map(str => {
            const fav = isFavourite(str.id);
            return (
              <Pressable
                key={str.id}
                style={({ pressed }) => [styles.stretchRow, pressed && { opacity: 0.8 }]}
                onPress={() => startStretch(str.title, str.duration)}
              >
                <LinearGradient colors={[str.color + '15', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <View style={[styles.stretchIcon, { backgroundColor: str.color + '20' }]}>
                  <Ionicons name={str.icon as any} size={24} color={str.color} />
                </View>
                <View style={styles.stretchInfo}>
                  <View style={styles.stretchTitleRow}>
                    <Text style={styles.stretchTitle}>{str.title}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: str.difficulty === 'Easy' ? C.sage + '20' : C.gold + '20' }]}>
                      <Text style={[styles.diffText, { color: str.difficulty === 'Easy' ? C.sage : C.gold }]}>{str.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.stretchDesc} numberOfLines={1}>{str.desc}</Text>
                  <View style={styles.stretchMeta}>
                    <Ionicons name="time-outline" size={11} color={C.textMuted} />
                    <Text style={styles.stretchMetaText}>{str.duration}</Text>
                    <Text style={styles.stretchDot}>·</Text>
                    <Text style={styles.stretchMetaText}>{str.steps} poses</Text>
                  </View>
                </View>
                <View style={styles.stretchRight}>
                  <Pressable
                    onPress={() => toggleFavourite({ id: str.id, type: 'sleep', title: str.title, color: str.color, icon: str.icon })}
                    hitSlop={8}
                  >
                    <Ionicons name={fav ? 'star' : 'star-outline'} size={17} color={fav ? C.gold : C.textMuted} />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

  nowPlaying: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  nowPlayingIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nowPlayingInfo: { flex: 1, gap: 2 },
  nowPlayingLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  nowPlayingName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, height: 18, borderRadius: 2 },
  stopBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  heroTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 20 },

  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: { flex: 1, paddingVertical: 10, borderRadius: 100, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  tabPillActive: { backgroundColor: '#818CF8' + '25', borderColor: '#818CF8' },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub },
  tabTextActive: { color: '#818CF8', fontFamily: 'Inter_600SemiBold' },

  castList: { gap: 14 },
  castCard: { borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 10, overflow: 'hidden', backgroundColor: C.card },
  castTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  castIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  castMeta: { flex: 1, gap: 6 },
  narratorTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  narratorText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  durationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  castTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.3 },
  castDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 },
  castPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14 },
  castPlayText: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  visGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  visCard: { width: '47%', padding: 14, borderRadius: 18, gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  visCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  visTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.text },
  visDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 16 },
  visDuration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  visDurationText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  visPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10 },
  visPlayText: { fontSize: 12, fontFamily: 'Inter_700Bold' },

  stretchList: { gap: 12 },
  stretchRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  stretchIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stretchInfo: { flex: 1, gap: 4 },
  stretchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stretchTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text, flex: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  diffText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  stretchDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  stretchMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stretchMetaText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  stretchDot: { fontSize: 11, color: C.textMuted },
  stretchRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
