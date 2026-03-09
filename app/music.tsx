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
  {
    id: 'rain', name: 'Rain', icon: 'rainy', color: '#7DD3FC',
    desc: 'Soft rain falls on broad leaves in a quiet garden. Let the steady, unhurried rhythm wash away the noise of the day.',
  },
  {
    id: 'ocean', name: 'Ocean Waves', icon: 'water', color: '#38BDF8',
    desc: 'The sea breathes in long, measured cycles — each wave arriving, each wave retreating. There is nothing to do but listen.',
  },
  {
    id: 'white-noise', name: 'White Noise', icon: 'radio', color: '#94A3B8',
    desc: 'An even blanket of sound that masks the irregular noises around you. The mind stops scanning and begins to rest.',
  },
  {
    id: 'forest', name: 'Forest', icon: 'leaf', color: '#6EE7B7',
    desc: 'Birds call from the canopy, wind moves through the leaves, and somewhere below a stream finds its way through stones. The forest is alive and entirely at peace.',
  },
  {
    id: 'brown-noise', name: 'Brown Noise', icon: 'volume-high', color: '#A16207',
    desc: 'Deeper and warmer than white noise — like standing beside a waterfall or inside a wooden ship underway. Heavy, grounding, and profoundly calming.',
  },
  {
    id: 'bowls', name: 'Tibetan Bowls', icon: 'musical-notes', color: '#D6AEFF',
    desc: 'Hammered singing bowls resonate at frequencies known to slow brainwaves. Each tone blooms and fades into a silence that feels fuller than the sound itself.',
  },
  {
    id: 'delta', name: 'Delta Waves', icon: 'pulse', color: '#818CF8',
    desc: 'Binaural tones tuned to the 0.5–4 Hz delta frequency range — the brainwave state of deep, dreamless sleep. Use with headphones for full effect.',
    premium: true,
  },
];

const PLAYLISTS = [
  {
    id: 'focus',
    name: 'Focus Flow',
    desc: 'Deep concentration & flow states',
    icon: 'headset',
    color: C.lavender,
    bg: '#1A1035',
    tracks: [
      { title: 'Theta Drift', duration: '6:12' },
      { title: 'Neural Garden', duration: '5:44' },
      { title: 'Sustained Attention', duration: '7:03' },
      { title: 'Frequency Bath', duration: '8:30' },
      { title: 'Inner Compass', duration: '5:18' },
      { title: 'Deep Current', duration: '9:01' },
      { title: 'Still Point', duration: '4:55' },
      { title: 'Lucid Ground', duration: '6:40' },
      { title: 'Open Field', duration: '7:22' },
      { title: 'Slow Burn', duration: '8:15' },
      { title: 'Convergence', duration: '5:50' },
      { title: 'The Work', duration: '10:00' },
    ],
  },
  {
    id: 'morning',
    name: 'Morning Rise',
    desc: 'Gentle energy to start your day',
    icon: 'sunny',
    color: C.gold,
    bg: '#2A1A00',
    tracks: [
      { title: 'First Light', duration: '4:20' },
      { title: 'Golden Hour', duration: '5:08' },
      { title: 'Soft Awakening', duration: '3:55' },
      { title: 'Dawn Chorus', duration: '6:30' },
      { title: 'Morning Mist', duration: '4:44' },
      { title: 'Birdsong & Dew', duration: '5:22' },
      { title: 'Gentle Rise', duration: '6:00' },
      { title: 'Open Window', duration: '4:12' },
      { title: 'Morning Pages', duration: '7:00' },
      { title: 'New Beginning', duration: '5:35' },
    ],
  },
  {
    id: 'rest',
    name: 'Deep Rest',
    desc: 'Unwind and release the day',
    icon: 'moon',
    color: '#818CF8',
    bg: '#1A1B4B',
    tracks: [
      { title: 'Night Drift', duration: '7:44' },
      { title: 'Still Waters', duration: '8:12' },
      { title: 'Quiet Mind', duration: '6:30' },
      { title: 'Fade Out', duration: '9:00' },
      { title: 'Indigo Hour', duration: '7:20' },
      { title: 'Descending', duration: '8:55' },
      { title: 'Slow Exhale', duration: '6:10' },
      { title: 'The Long Dark', duration: '10:30' },
      { title: 'Lullaby for Adults', duration: '5:48' },
      { title: 'Hypnagogic', duration: '8:00' },
      { title: 'Gravity Well', duration: '7:15' },
      { title: 'Zero Degrees', duration: '6:40' },
      { title: 'Last Light', duration: '5:22' },
      { title: 'Into the Deep', duration: '11:00' },
    ],
  },
  {
    id: 'anxiety',
    name: 'Anxiety Relief',
    desc: 'Soothing tones to calm the mind',
    icon: 'heart',
    color: C.sage,
    bg: '#0D2A1F',
    tracks: [
      { title: 'Calm Shore', duration: '6:15' },
      { title: 'Breathe Easy', duration: '5:00' },
      { title: 'Soft Rain', duration: '7:30' },
      { title: 'Inner Peace', duration: '8:00' },
      { title: 'The Gentle Return', duration: '5:45' },
      { title: 'Ground & Hold', duration: '6:55' },
      { title: 'Safe Harbour', duration: '7:10' },
      { title: 'Parasympathetic', duration: '9:00' },
      { title: 'After the Storm', duration: '6:00' },
    ],
  },
  {
    id: 'creative',
    name: 'Creative Mode',
    desc: 'Fuel your imagination',
    icon: 'color-palette',
    color: C.rose,
    bg: '#2A0D1A',
    tracks: [
      { title: 'Spark', duration: '4:30' },
      { title: 'Canvas', duration: '6:10' },
      { title: 'Daydream', duration: '5:55' },
      { title: 'Wandering', duration: '7:20' },
      { title: 'The Studio', duration: '6:45' },
      { title: 'Alchemy', duration: '5:30' },
      { title: 'Free Association', duration: '8:00' },
      { title: 'Colour Theory', duration: '4:50' },
      { title: 'Strange Attractor', duration: '7:00' },
      { title: 'Blue Sky Thinking', duration: '6:15' },
      { title: 'The Workshop', duration: '9:20' },
    ],
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    desc: 'Warm, reflective evening vibes',
    icon: 'sparkles',
    color: C.gold,
    bg: '#2A1A00',
    premium: true,
    tracks: [
      { title: 'Amber Light', duration: '6:00' },
      { title: 'Gentle Glow', duration: '5:30' },
      { title: 'Warm Static', duration: '7:15' },
      { title: 'Dusk', duration: '8:00' },
      { title: 'The Long Evening', duration: '6:40' },
      { title: 'Settling In', duration: '5:55' },
      { title: 'Embers', duration: '7:30' },
      { title: 'Good Night, World', duration: '9:00' },
    ],
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
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPlaylist(prev => prev === id ? null : id);
  };

  const toggleSound = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (playing === id) { stop(); setPlaying(null); }
    else { play(id); setPlaying(id); }
  };

  const stopAll = () => { stop(); setPlaying(null); };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100 }]}
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
            <Text style={styles.playerName}>{(playingItem as any).name}</Text>
            <Text style={styles.playerDesc} numberOfLines={2}>{(playingItem as any).desc}</Text>
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
              <View style={styles.soundCardTop}>
                <Pressable onPress={() => toggleFavourite({ id: s.id, type: 'sleep', title: s.name, color: s.color, icon: s.icon })}>
                  <Ionicons name={fav ? 'star' : 'star-outline'} size={14} color={fav ? C.gold : C.textMuted} />
                </Pressable>
                {s.premium && (
                  <View style={styles.soundPremium}>
                    <Ionicons name="star" size={10} color={C.gold} />
                    <Text style={styles.soundPremiumText}>PRO</Text>
                  </View>
                )}
              </View>
              <View style={[styles.soundIcon, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={styles.soundName}>{s.name}</Text>
              <Text style={styles.soundDesc}>{s.desc}</Text>
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
        const expanded = expandedPlaylist === pl.id;
        return (
          <View key={pl.id} style={[styles.playlistBlock, isPlaying && { borderColor: pl.color }]}>
            {isPlaying && <LinearGradient colors={[pl.color + '12', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
            <View style={styles.playlistRow}>
              <View style={[styles.playlistArt, { backgroundColor: pl.color + '20' }]}>
                <Ionicons name={pl.icon as any} size={22} color={pl.color} />
              </View>
              <Pressable style={styles.playlistInfoTouch} onPress={() => toggleExpand(pl.id)}>
                <View style={styles.playlistTitleRow}>
                  <Text style={styles.playlistName}>{pl.name}</Text>
                  {pl.premium && <Ionicons name="star" size={12} color={C.gold} />}
                </View>
                <Text style={styles.playlistDesc}>{pl.desc}</Text>
                <Text style={styles.playlistTracks}>{pl.tracks.length} tracks</Text>
              </Pressable>
              <EqBars color={pl.color} playing={isPlaying} />
              <View style={styles.playlistActions}>
                <Pressable hitSlop={8} onPress={() => { toggleFavourite({ id: pl.id, type: 'music', title: pl.name, color: pl.color, icon: pl.icon }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Ionicons name={fav ? 'star' : 'star-outline'} size={16} color={fav ? C.gold : C.textMuted} />
                </Pressable>
                <Pressable onPress={() => togglePlaylist(pl)}>
                  <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={30} color={pl.color} />
                </Pressable>
              </View>
            </View>

            {expanded && (
              <View style={styles.trackList}>
                <View style={styles.trackDivider} />
                {pl.tracks.map((track, i) => (
                  <View key={i} style={styles.trackRow}>
                    <Text style={styles.trackNum}>{(i + 1).toString().padStart(2, '0')}</Text>
                    <Text style={styles.trackTitle}>{track.title}</Text>
                    <Text style={styles.trackDuration}>{track.duration}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable style={styles.expandToggle} onPress={() => toggleExpand(pl.id)}>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
              <Text style={styles.expandText}>{expanded ? 'Hide tracks' : 'Show tracks'}</Text>
            </Pressable>
          </View>
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

  playerCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  playerArt: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  playerInfo: { flex: 1, gap: 6 },
  playerName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  playerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 18 },
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
  soundCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soundPremium: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.gold + '25', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  soundPremiumText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: C.gold },
  soundIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  soundName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.text },
  soundDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 16 },
  soundPlayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, borderRadius: 10 },
  soundPlayText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  playlistBlock: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  playlistRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  playlistArt: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  playlistInfoTouch: { flex: 1, gap: 3 },
  playlistTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playlistName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  playlistDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  playlistTracks: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  playlistActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  trackList: { paddingHorizontal: 14, paddingBottom: 4 },
  trackDivider: { height: 1, backgroundColor: C.border, marginBottom: 8 },
  trackRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 14 },
  trackNum: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, width: 24, textAlign: 'right' },
  trackTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text },
  trackDuration: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },

  expandToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  expandText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted },
});
