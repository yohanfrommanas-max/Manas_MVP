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
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import C from '@/constants/colors';

const SOUNDS = [
  { id: 'rain',        name: 'Rain',           icon: 'rainy',         color: '#7DD3FC', desc: 'Gentle rainfall on leaves' },
  { id: 'ocean',       name: 'Ocean Waves',    icon: 'water',         color: '#38BDF8', desc: 'Rhythmic tides on the shore' },
  { id: 'white-noise', name: 'White Noise',    icon: 'radio',         color: '#94A3B8', desc: 'Steady masking noise' },
  { id: 'forest',      name: 'Forest',         icon: 'leaf',          color: C.sage,    desc: 'Birds, wind, crickets' },
  { id: 'brown-noise', name: 'Brown Noise',    icon: 'volume-high',   color: '#A16207', desc: 'Deep, warm static' },
  { id: 'bowls',       name: 'Tibetan Bowls',  icon: 'musical-notes', color: C.mauve,   desc: 'Harmonic singing bowls' },
  { id: 'delta',       name: 'Delta Waves',    icon: 'pulse',         color: '#818CF8', desc: 'Deep sleep brainwaves', premium: true },
];

const PLAYLISTS = [
  { id: 'focus',    name: 'Focus Flow',     desc: 'Deep concentration & flow states',    icon: 'headset',       color: C.lavender, bg: '#1A1035', tracks: 12, tracks_preview: ['Ambient Pulse', 'Theta Drift', 'Neural Flow', 'Deep Space'] },
  { id: 'morning',  name: 'Morning Rise',   desc: 'Gentle energy to start your day',     icon: 'sunny',         color: C.gold,     bg: '#2A1A00', tracks: 10, tracks_preview: ['Golden Hour', 'First Light', 'Soft Awakening', 'Dawn Chorus'] },
  { id: 'rest',     name: 'Deep Rest',      desc: 'Unwind and release the day',          icon: 'moon',          color: '#818CF8',  bg: '#1A1B4B', tracks: 14, tracks_preview: ['Night Drift', 'Still Waters', 'Quiet Mind', 'Fade Out'] },
  { id: 'anxiety',  name: 'Anxiety Relief', desc: 'Soothing tones to calm the mind',     icon: 'heart',         color: C.sage,     bg: '#0D2A1F', tracks: 9,  tracks_preview: ['Calm Shore', 'Breathe Easy', 'Soft Rain', 'Inner Peace'] },
  { id: 'creative', name: 'Creative Mode',  desc: 'Fuel your imagination',               icon: 'color-palette', color: C.rose,     bg: '#2A0D1A', tracks: 11, tracks_preview: ['Spark', 'Canvas', 'Daydream', 'Wandering'] },
  { id: 'golden',   name: 'Golden Hour',    desc: 'Warm, reflective evening vibes',      icon: 'sparkles',      color: C.gold,     bg: '#2A1A00', tracks: 8,  premium: true, tracks_preview: ['Amber Light', 'Gentle Glow', 'Warm Static', 'Dusk'] },
];

function EqBars({ color, playing }: { color: string; playing: boolean }) {
  const h1 = useSharedValue(0.3);
  const h2 = useSharedValue(0.6);
  const h3 = useSharedValue(0.4);

  React.useEffect(() => {
    if (!playing) return;
    h1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.2, { duration: 300 }), withTiming(0.8, { duration: 350 })), -1);
    h2.value = withRepeat(withSequence(withTiming(0.3, { duration: 350 }), withTiming(1, { duration: 400 }), withTiming(0.5, { duration: 300 })), -1);
    h3.value = withRepeat(withSequence(withTiming(0.7, { duration: 300 }), withTiming(0.2, { duration: 350 }), withTiming(1, { duration: 400 })), -1);
  }, [playing]);

  const s1 = useAnimatedStyle(() => ({ height: 24 * h1.value }));
  const s2 = useAnimatedStyle(() => ({ height: 24 * h2.value }));
  const s3 = useAnimatedStyle(() => ({ height: 24 * h3.value }));

  return (
    <View style={styles.eqRow}>
      {[s1, s2, s3].map((s, i) => (
        <Reanimated.View key={i} style={[styles.eqBar, s, { backgroundColor: playing ? color : color + '50' }]} />
      ))}
    </View>
  );
}

function WaveAnimation({ color }: { color: string }) {
  const w1 = useSharedValue(1);
  const w2 = useSharedValue(1);
  const w3 = useSharedValue(1);

  React.useEffect(() => {
    w1.value = withRepeat(withSequence(withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1);
    w2.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(1.3, { duration: 1000 }), withTiming(1, { duration: 500 })), -1);
    w3.value = withRepeat(withSequence(withTiming(1, { duration: 750 }), withTiming(1.2, { duration: 1000 }), withTiming(1, { duration: 750 })), -1);
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

export default function MusicScreen() {
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, addWellnessMinutes } = useApp();
  const { play, stop } = useAmbientAudio();
  const [playing, setPlaying] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const playingPlaylist = PLAYLISTS.find(p => p.id === playing);
  const playingSound = SOUNDS.find(s => s.id === playing);
  const playingItem = playingPlaylist ?? playingSound;

  const togglePlaylist = (pl: typeof PLAYLISTS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === pl.id) {
      stop();
      setPlaying(null);
    } else {
      play(pl.id);
      setPlaying(pl.id);
      addWellnessMinutes(1);
    }
  };

  const toggleSound = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === id) {
      stop();
      setPlaying(null);
    } else {
      play(id);
      setPlaying(id);
    }
  };

  const stopAll = () => { stop(); setPlaying(null); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {playing && (
        <LinearGradient
          colors={[(playingPlaylist?.bg ?? (playingSound?.color ?? C.bg2) + '40'), C.bg]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
        />
      )}

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => { stopAll(); router.back(); }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>Music</Text>
        <View style={{ width: 40 }} />
      </View>

      {playing && playingItem ? (
        <View style={[styles.playerCard, { borderColor: (playingPlaylist?.color ?? playingSound?.color ?? C.lavender) + '40' }]}>
          <LinearGradient
            colors={[playingPlaylist?.bg ?? (playingSound?.color ?? C.bg2) + '30', C.card]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.playerArt, { backgroundColor: (playingPlaylist?.color ?? playingSound?.color ?? C.lavender) + '20' }]}>
            <Ionicons name={(playingItem as any).icon as any} size={34} color={playingPlaylist?.color ?? playingSound?.color ?? C.lavender} />
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{playingItem.name ?? (playingItem as any).name}</Text>
            <Text style={styles.playerDesc}>{playingItem.desc ?? (playingItem as any).desc}</Text>
            {playingPlaylist && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { backgroundColor: playingPlaylist.color, width: '35%' }]} />
              </View>
            )}
          </View>
          {playingPlaylist
            ? <EqBars color={playingPlaylist.color} playing />
            : <WaveAnimation color={playingSound?.color ?? C.lavender} />}
          <Pressable style={styles.playerStop} onPress={stopAll}>
            <Ionicons name="pause" size={18} color={C.text} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyPlayer}>
          <Ionicons name="musical-notes" size={36} color={C.textMuted} />
          <Text style={styles.emptyPlayerText}>Select a playlist or soundscape</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Soundscapes</Text>
      <View style={styles.soundGrid}>
        {SOUNDS.map(s => {
          const isPlaying = playing === s.id;
          const fav = isFavourite(s.id);
          return (
            <View key={s.id} style={[styles.soundCard, isPlaying && { borderColor: s.color }]}>
              {isPlaying && <LinearGradient colors={[s.color + '20', C.card]} style={StyleSheet.absoluteFill} />}
              <Pressable style={styles.soundFav} onPress={() => toggleFavourite({ id: s.id, type: 'sleep', title: s.name, color: s.color, icon: s.icon })}>
                <Ionicons name={fav ? 'star' : 'star-outline'} size={14} color={fav ? C.gold : C.textMuted} />
              </Pressable>
              {s.premium && (
                <View style={styles.soundPremium}>
                  <Ionicons name="star" size={10} color={C.gold} />
                </View>
              )}
              <View style={[styles.soundIcon, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={styles.soundName}>{s.name}</Text>
              <Text style={styles.soundDesc} numberOfLines={2}>{s.desc}</Text>
              <Pressable
                style={[styles.soundPlayBtn, { backgroundColor: isPlaying ? s.color : s.color + '25' }]}
                onPress={() => toggleSound(s.id)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={13} color={isPlaying ? C.bg : s.color} />
                <Text style={[styles.soundPlayText, { color: isPlaying ? C.bg : s.color }]}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Playlists</Text>
      {PLAYLISTS.map(pl => {
        const isPlaying = playing === pl.id;
        const fav = isFavourite(pl.id);
        return (
          <Pressable
            key={pl.id}
            style={({ pressed }) => [styles.playlistRow, isPlaying && { borderColor: pl.color }, pressed && { opacity: 0.8 }]}
            onPress={() => togglePlaylist(pl)}
          >
            {isPlaying && <LinearGradient colors={[pl.color + '15', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <View style={[styles.playlistArt, { backgroundColor: pl.color + '20' }]}>
              <Ionicons name={pl.icon as any} size={22} color={pl.color} />
            </View>
            <View style={styles.playlistInfo}>
              <View style={styles.playlistTitleRow}>
                <Text style={styles.playlistName}>{pl.name}</Text>
                {pl.premium && <Ionicons name="star" size={12} color={C.gold} />}
              </View>
              <Text style={styles.playlistDesc}>{pl.desc}</Text>
              <Text style={styles.playlistTracks}>{pl.tracks} tracks</Text>
            </View>
            <EqBars color={pl.color} playing={isPlaying} />
            <View style={styles.playlistActions}>
              <Pressable hitSlop={8} onPress={() => { toggleFavourite({ id: pl.id, type: 'music', title: pl.name, color: pl.color, icon: pl.icon }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Ionicons name={fav ? 'star' : 'star-outline'} size={16} color={fav ? C.gold : C.textMuted} />
              </Pressable>
              <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={28} color={pl.color} />
            </View>
          </Pressable>
        );
      })}

      {Platform.OS !== 'web' && (
        <View style={styles.nativeNote}>
          <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
          <Text style={styles.nativeNoteText}>Full audio available on web preview</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

  playerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  playerArt: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playerInfo: { flex: 1, gap: 6 },
  playerName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  playerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  progressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  playerStop: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  emptyPlayer: { height: 90, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  emptyPlayerText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },

  eqRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  eqBar: { width: 4, borderRadius: 2, minHeight: 4 },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  waveBar: { width: 4, height: 16, borderRadius: 2 },

  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },

  soundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  soundCard: { width: '47%', padding: 14, borderRadius: 18, gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  soundFav: { alignSelf: 'flex-end' },
  soundPremium: { position: 'absolute', top: 12, right: 36, backgroundColor: C.gold + '30', borderRadius: 6, padding: 3 },
  soundIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  soundName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.text },
  soundDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 16 },
  soundPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10 },
  soundPlayText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  playlistRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  playlistArt: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playlistInfo: { flex: 1, gap: 3 },
  playlistTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playlistName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  playlistDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  playlistTracks: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nativeNote: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingTop: 4 },
  nativeNoteText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
});
