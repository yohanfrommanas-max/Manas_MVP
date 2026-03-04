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

const PLAYLISTS = [
  {
    id: 'focus', name: 'Focus Flow', desc: 'Deep concentration & flow states',
    icon: 'headset', color: C.lavender, bg: '#1A1035', tracks: 12,
    tracks_preview: ['Ambient Pulse', 'Theta Drift', 'Neural Flow', 'Deep Space'],
  },
  {
    id: 'morning', name: 'Morning Rise', desc: 'Gentle energy to start your day',
    icon: 'sunny', color: C.gold, bg: '#2A1A00', tracks: 10,
    tracks_preview: ['Golden Hour', 'First Light', 'Soft Awakening', 'Dawn Chorus'],
  },
  {
    id: 'rest', name: 'Deep Rest', desc: 'Unwind and release the day',
    icon: 'moon', color: '#818CF8', bg: '#1A1B4B', tracks: 14,
    tracks_preview: ['Night Drift', 'Still Waters', 'Quiet Mind', 'Fade Out'],
  },
  {
    id: 'anxiety', name: 'Anxiety Relief', desc: 'Soothing tones to calm the mind',
    icon: 'heart', color: C.sage, bg: '#0D2A1F', tracks: 9,
    tracks_preview: ['Calm Shore', 'Breathe Easy', 'Soft Rain', 'Inner Peace'],
  },
  {
    id: 'creative', name: 'Creative Mode', desc: 'Fuel your imagination',
    icon: 'color-palette', color: C.rose, bg: '#2A0D1A', tracks: 11,
    tracks_preview: ['Spark', 'Canvas', 'Daydream', 'Wandering'],
  },
  {
    id: 'golden', name: 'Golden Hour', desc: 'Warm, reflective evening vibes',
    icon: 'sparkles', color: C.gold, bg: '#2A1A00', tracks: 8, premium: true,
    tracks_preview: ['Amber Light', 'Gentle Glow', 'Warm Static', 'Dusk'],
  },
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

export default function MusicScreen() {
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, addWellnessMinutes } = useApp();
  const [playing, setPlaying] = useState<string | null>(null);
  const [selected, setSelected] = useState<typeof PLAYLISTS[0] | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const playingPlaylist = PLAYLISTS.find(p => p.id === playing);

  const play = (pl: typeof PLAYLISTS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === pl.id) setPlaying(null);
    else { setPlaying(pl.id); setSelected(pl); addWellnessMinutes(1); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {playing && (
        <LinearGradient colors={[playingPlaylist?.bg ?? C.bg2, C.bg]} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:0,y:0.5}} />
      )}

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.title}>Music</Text>
        <View style={{ width: 40 }} />
      </View>

      {playing && playingPlaylist ? (
        <View style={[styles.playerCard, { borderColor: playingPlaylist.color + '40' }]}>
          <LinearGradient colors={[playingPlaylist.bg, C.card]} style={StyleSheet.absoluteFill} />
          <View style={[styles.playerArt, { backgroundColor: playingPlaylist.color + '20' }]}>
            <Ionicons name={playingPlaylist.icon as any} size={36} color={playingPlaylist.color} />
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{playingPlaylist.name}</Text>
            <Text style={styles.playerDesc}>{playingPlaylist.desc}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { backgroundColor: playingPlaylist.color, width: '35%' }]} />
            </View>
          </View>
          <EqBars color={playingPlaylist.color} playing />
          <Pressable style={styles.playerStop} onPress={() => setPlaying(null)}>
            <Ionicons name="pause" size={18} color={C.text} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.emptyPlayer}>
          <Ionicons name="musical-notes" size={40} color={C.textMuted} />
          <Text style={styles.emptyPlayerText}>Select a playlist to begin</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Playlists</Text>
      {PLAYLISTS.map(pl => {
        const isPlaying = playing === pl.id;
        const fav = isFavourite(pl.id);
        return (
          <Pressable
            key={pl.id}
            style={({ pressed }) => [styles.playlistRow, isPlaying && { borderColor: pl.color }, pressed && { opacity: 0.8 }]}
            onPress={() => play(pl)}
          >
            {isPlaying && <LinearGradient colors={[pl.color + '15', 'transparent']} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:1,y:0}} />}
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
                <Ionicons name={fav ? 'bookmark' : 'bookmark-outline'} size={16} color={fav ? C.gold : C.textMuted} />
              </Pressable>
              <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={28} color={pl.color} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  playerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  playerArt: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playerInfo: { flex: 1, gap: 6 },
  playerName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  playerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  progressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  playerStop: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  emptyPlayer: { height: 100, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border },
  emptyPlayerText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  eqRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
  eqBar: { width: 4, borderRadius: 2, minHeight: 4 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  playlistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  playlistArt: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playlistInfo: { flex: 1, gap: 3 },
  playlistTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playlistName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  playlistDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  playlistTracks: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
