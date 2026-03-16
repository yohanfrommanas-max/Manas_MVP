import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, Modal, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useColors, DARK, type Colors } from '@/constants/colors';
const C = DARK;

const { width: SCREEN_W } = Dimensions.get('window');

interface Track {
  id: string;
  title: string;
  mood: string;
  genre: string;
  duration: string;
  icon: string;
  color: string;
  audioKey: string;
}

interface UserPlaylist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  lastPlayed: number;
}

type TabKey = 'discover' | 'music' | 'playlists' | 'favorites';
type SortMode = 'title' | 'date' | 'lastPlayed';

const GENRES: { name: string; color: string; icon: string }[] = [
  { name: 'Focus', color: C.lavender, icon: 'headset' },
  { name: 'Sleep', color: '#818CF8', icon: 'moon' },
  { name: 'Work', color: C.gold, icon: 'briefcase' },
  { name: 'Study', color: C.sage, icon: 'book' },
  { name: 'Binaural Beats', color: '#D6AEFF', icon: 'pulse' },
  { name: 'White Noise', color: '#94A3B8', icon: 'radio' },
  { name: 'Run', color: '#F87171', icon: 'fitness' },
  { name: 'Classical', color: C.rose, icon: 'musical-notes' },
];

const ALL_TRACKS: Track[] = [
  { id: 't1', title: 'Deep Current', mood: 'Focused', genre: 'Focus', duration: '5:30', icon: 'headset', color: C.lavender, audioKey: 'focus' },
  { id: 't2', title: 'Neural Garden', mood: 'Flow', genre: 'Focus', duration: '6:12', icon: 'headset', color: C.lavender, audioKey: 'focus' },
  { id: 't3', title: 'Theta Drift', mood: 'Calm Focus', genre: 'Focus', duration: '7:03', icon: 'headset', color: C.lavender, audioKey: 'focus' },
  { id: 't4', title: 'Night Drift', mood: 'Restful', genre: 'Sleep', duration: '8:12', icon: 'moon', color: '#818CF8', audioKey: 'rest' },
  { id: 't5', title: 'Quiet Mind', mood: 'Peaceful', genre: 'Sleep', duration: '6:30', icon: 'moon', color: '#818CF8', audioKey: 'rest' },
  { id: 't6', title: 'Into the Deep', mood: 'Dreamy', genre: 'Sleep', duration: '11:00', icon: 'moon', color: '#818CF8', audioKey: 'rest' },
  { id: 't7', title: 'Steady Pace', mood: 'Productive', genre: 'Work', duration: '4:45', icon: 'briefcase', color: C.gold, audioKey: 'morning' },
  { id: 't8', title: 'The Grind', mood: 'Energised', genre: 'Work', duration: '5:20', icon: 'briefcase', color: C.gold, audioKey: 'morning' },
  { id: 't9', title: 'Open Office', mood: 'Ambient', genre: 'Work', duration: '6:00', icon: 'briefcase', color: C.gold, audioKey: 'morning' },
  { id: 't10', title: 'Revision Mode', mood: 'Concentrated', genre: 'Study', duration: '5:55', icon: 'book', color: C.sage, audioKey: 'focus' },
  { id: 't11', title: 'Library Hours', mood: 'Quiet', genre: 'Study', duration: '7:10', icon: 'book', color: C.sage, audioKey: 'focus' },
  { id: 't12', title: 'Delta Pulse', mood: 'Meditative', genre: 'Binaural Beats', duration: '8:00', icon: 'pulse', color: '#D6AEFF', audioKey: 'delta' },
  { id: 't13', title: 'Alpha Sync', mood: 'Relaxed', genre: 'Binaural Beats', duration: '6:45', icon: 'pulse', color: '#D6AEFF', audioKey: 'bowls' },
  { id: 't14', title: 'Gentle Static', mood: 'Neutral', genre: 'White Noise', duration: '10:00', icon: 'radio', color: '#94A3B8', audioKey: 'white-noise' },
  { id: 't15', title: 'Brown Blanket', mood: 'Warm', genre: 'White Noise', duration: '9:30', icon: 'radio', color: '#94A3B8', audioKey: 'brown-noise' },
  { id: 't16', title: 'Pace Maker', mood: 'Driven', genre: 'Run', duration: '4:00', icon: 'fitness', color: '#F87171', audioKey: 'morning' },
  { id: 't17', title: 'Trail Runner', mood: 'Energetic', genre: 'Run', duration: '3:45', icon: 'fitness', color: '#F87171', audioKey: 'morning' },
  { id: 't18', title: 'Clair de Lune', mood: 'Serene', genre: 'Classical', duration: '5:15', icon: 'musical-notes', color: C.rose, audioKey: 'bowls' },
  { id: 't19', title: 'Gymnopédie', mood: 'Gentle', genre: 'Classical', duration: '4:30', icon: 'musical-notes', color: C.rose, audioKey: 'bowls' },
  { id: 't20', title: 'Moonlight Sonata', mood: 'Pensive', genre: 'Classical', duration: '6:20', icon: 'musical-notes', color: C.rose, audioKey: 'bowls' },
];

const DAILY_MIXES = [
  { id: 'mix-morning', name: 'Morning', subtitle: 'Start fresh', icon: 'sunny', color: C.gold, bg: '#2A1A00', trackIds: ['t7', 't8', 't16', 't17'] },
  { id: 'mix-focus', name: 'Focus', subtitle: 'Deep work', icon: 'headset', color: C.lavender, bg: '#1A1035', trackIds: ['t1', 't2', 't3', 't10'] },
  { id: 'mix-evening', name: 'Evening', subtitle: 'Wind down', icon: 'moon', color: '#818CF8', bg: '#1A1B4B', trackIds: ['t4', 't5', 't6', 't18'] },
  { id: 'mix-energy', name: 'Energy', subtitle: 'Get moving', icon: 'flash', color: '#F87171', bg: '#2A0D0D', trackIds: ['t16', 't17', 't8', 't7'] },
];

const TRENDING_IDS = ['t1', 't4', 't14', 't18', 't12'];

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function TrackCard({
  track, isActive, onPlay, rightContent,
}: {
  track: Track;
  isActive: boolean;
  onPlay: () => void;
  rightContent?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPlay}
      style={[
        s.trackCard,
        isActive && { borderColor: track.color + '80', backgroundColor: track.color + '10' },
      ]}
    >
      <View style={[s.trackIcon, { backgroundColor: track.color + '20' }]}>
        <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={20} color={track.color} />
      </View>
      <View style={s.trackInfo}>
        <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
        <Text style={s.trackMood}>{track.mood}</Text>
        <Text style={s.trackGenre}>{track.genre}</Text>
      </View>
      {rightContent}
    </Pressable>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

export default function MusicScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, addWellnessMinutes } = useApp();
  const { play: playAudio, stop: stopAudio } = useAmbientAudio();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<Track[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [openMixId, setOpenMixId] = useState<string | null>(null);
  const [mixSearch, setMixSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortMode, setSortMode] = useState<SortMode>('title');
  const [showSortModal, setShowSortModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPlaylistExpanded, setMenuPlaylistExpanded] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistMenuId, setPlaylistMenuId] = useState<string | null>(null);
  const [addingSongsPlaylistId, setAddingSongsPlaylistId] = useState<string | null>(null);
  const [renamingPlaylistId, setRenamingPlaylistId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [customSleepInput, setCustomSleepInput] = useState('');
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trackIndex = useMemo(() => {
    const m = new Map<string, Track>();
    ALL_TRACKS.forEach(t => m.set(t.id, t));
    return m;
  }, []);

  const playTrack = useCallback((track: Track) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopAudio();
    playAudio(track.audioKey);
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    addWellnessMinutes(1);
    setHistory(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 20);
    });
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => (p >= 1 ? 0 : p + 0.005));
    }, 500);
  }, [playAudio, stopAudio, addWellnessMinutes]);

  const pauseTrack = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
    if (progressRef.current) clearInterval(progressRef.current);
  }, [stopAudio]);

  const resumeTrack = useCallback(() => {
    if (currentTrack) {
      playAudio(currentTrack.audioKey);
      setIsPlaying(true);
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress(p => (p >= 1 ? 0 : p + 0.005));
      }, 500);
    }
  }, [currentTrack, playAudio]);

  const nextTrack = useCallback(() => {
    if (!currentTrack) return;
    const idx = ALL_TRACKS.findIndex(t => t.id === currentTrack.id);
    const next = ALL_TRACKS[(idx + 1) % ALL_TRACKS.length];
    playTrack(next);
  }, [currentTrack, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack) return;
    const idx = ALL_TRACKS.findIndex(t => t.id === currentTrack.id);
    const prev = ALL_TRACKS[(idx - 1 + ALL_TRACKS.length) % ALL_TRACKS.length];
    playTrack(prev);
  }, [currentTrack, playTrack]);

  const stopAll = useCallback(() => {
    stopAudio();
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
  }, [stopAudio]);

  useEffect(() => {
    if (!sleepTimerEnd) return;
    sleepRef.current = setInterval(() => {
      const rem = Math.max(0, sleepTimerEnd - Date.now());
      setSleepRemaining(rem);
      if (rem <= 0) {
        pauseTrack();
        setSleepTimerEnd(null);
        setSleepRemaining(0);
        if (sleepRef.current) clearInterval(sleepRef.current);
      }
    }, 1000);
    return () => { if (sleepRef.current) clearInterval(sleepRef.current); };
  }, [sleepTimerEnd, pauseTrack]);

  useEffect(() => () => {
    if (progressRef.current) clearInterval(progressRef.current);
    if (sleepRef.current) clearInterval(sleepRef.current);
  }, []);

  const startSleepTimer = (mins: number) => {
    if (mins <= 0) return;
    setSleepTimerEnd(Date.now() + mins * 60 * 1000);
    setSleepRemaining(mins * 60 * 1000);
    setShowSleepModal(false);
  };

  const clearSleepTimer = () => {
    setSleepTimerEnd(null);
    setSleepRemaining(0);
    if (sleepRef.current) clearInterval(sleepRef.current);
  };

  const toggleTrackFav = (track: Track) => {
    toggleFavourite({ id: track.id, type: 'music', title: track.title, color: track.color, icon: track.icon });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const createPlaylist = () => {
    const pl: UserPlaylist = { id: genId(), name: `Playlist ${userPlaylists.length + 1}`, trackIds: [], createdAt: Date.now(), lastPlayed: 0 };
    setUserPlaylists(prev => [pl, ...prev]);
  };

  const saveMixAsPlaylist = (mix: typeof DAILY_MIXES[0]) => {
    const exists = userPlaylists.find(p => p.name === mix.name + ' Mix');
    if (exists) {
      setDownloadToast('Already in Playlists');
      setTimeout(() => setDownloadToast(null), 2000);
      return;
    }
    const pl: UserPlaylist = { id: genId(), name: mix.name + ' Mix', trackIds: mix.trackIds, createdAt: Date.now(), lastPlayed: 0 };
    setUserPlaylists(prev => [pl, ...prev]);
    setDownloadToast('Saved to Playlists');
    setTimeout(() => setDownloadToast(null), 2000);
  };

  const renamePlaylist = (id: string, name: string) => {
    setUserPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
    setRenamingPlaylistId(null);
  };

  const deletePlaylist = (id: string) => {
    Alert.alert('Delete Playlist', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setUserPlaylists(prev => prev.filter(p => p.id !== id)) },
    ]);
  };

  const addTrackToPlaylist = (playlistId: string, trackId: string) => {
    setUserPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      if (p.trackIds.includes(trackId)) return p;
      return { ...p, trackIds: [...p.trackIds, trackId] };
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setUserPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, trackIds: p.trackIds.filter(id => id !== trackId) };
    }));
  };

  const markPlaylistPlayed = useCallback((playlistId: string) => {
    setUserPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, lastPlayed: Date.now() } : p));
  }, []);

  const shufflePlaylist = (pl: UserPlaylist) => {
    if (pl.trackIds.length === 0) return;
    const shuffled = [...pl.trackIds].sort(() => Math.random() - 0.5);
    const first = trackIndex.get(shuffled[0]);
    if (first) { playTrack(first); markPlaylistPlayed(pl.id); }
  };

  const filteredTracks = useMemo(() => {
    if (!genreFilter) return ALL_TRACKS;
    return ALL_TRACKS.filter(t => t.genre === genreFilter);
  }, [genreFilter]);

  const favTracks = useMemo(() => ALL_TRACKS.filter(t => isFavourite(t.id)), [isFavourite]);

  const forYouTracks = useMemo(() => {
    if (history.length === 0) return [];
    const genres = [...new Set(history.map(t => t.genre))];
    return ALL_TRACKS.filter(t => genres.includes(t.genre) && !history.some(h => h.id === t.id)).slice(0, 6);
  }, [history]);

  const sortedPlaylists = useMemo(() => {
    let pls = [...userPlaylists];
    if (playlistSearch.trim()) {
      const q = playlistSearch.toLowerCase();
      pls = pls.filter(p => p.name.toLowerCase().includes(q));
    }
    if (sortMode === 'title') pls.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortMode === 'date') pls.sort((a, b) => b.createdAt - a.createdAt);
    else pls.sort((a, b) => b.lastPlayed - a.lastPlayed);
    return pls;
  }, [userPlaylists, playlistSearch, sortMode]);

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const sec = totalSecs % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const durationToMs = (dur: string) => {
    const [m, sec] = dur.split(':').map(Number);
    return (m * 60 + sec) * 1000;
  };

  const addingSongsPlaylist = addingSongsPlaylistId ? userPlaylists.find(p => p.id === addingSongsPlaylistId) : null;

  useEffect(() => {
    if (addingSongsPlaylistId && !addingSongsPlaylist) setAddingSongsPlaylistId(null);
  }, [addingSongsPlaylistId, addingSongsPlaylist]);

  if (showNowPlaying && currentTrack) {
    return (
      <View style={[s.container, { paddingTop: topInset }]}>
        <LinearGradient colors={[currentTrack.color + '25', C.bg, C.bg]} style={StyleSheet.absoluteFill} />
        <View style={s.npHeader}>
          <Pressable onPress={() => setShowNowPlaying(false)} hitSlop={12}>
            <Ionicons name="chevron-down" size={24} color={C.text} />
          </Pressable>
          <Text style={s.npTitle}>Now Playing</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={s.npBody}>
          <View style={[s.npArt, { borderColor: currentTrack.color + '40' }]}>
            <Ionicons name="musical-note" size={64} color={currentTrack.color} />
          </View>
          <Text style={s.npTrackName}>{currentTrack.title}</Text>
          <Text style={s.npTrackMood}>{currentTrack.mood}</Text>
          <Text style={s.npTrackGenre}>{currentTrack.genre}</Text>
          <View style={s.npProgressWrap}>
            <View style={s.npProgressTrack}>
              <View style={[s.npProgressFill, { width: `${progress * 100}%`, backgroundColor: currentTrack.color }]} />
            </View>
            <View style={s.npTimeRow}>
              <Text style={s.npTime}>{formatTime(progress * durationToMs(currentTrack.duration))}</Text>
              <Text style={s.npTime}>-{formatTime((1 - progress) * durationToMs(currentTrack.duration))}</Text>
            </View>
          </View>
          <View style={s.npControls}>
            <Pressable onPress={prevTrack} hitSlop={12}><Ionicons name="play-skip-back" size={28} color={C.text} /></Pressable>
            <Pressable onPress={isPlaying ? pauseTrack : resumeTrack} style={[s.npPlayBtn, { backgroundColor: currentTrack.color }]}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={C.bg} />
            </Pressable>
            <Pressable onPress={nextTrack} hitSlop={12}><Ionicons name="play-skip-forward" size={28} color={C.text} /></Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (addingSongsPlaylistId && addingSongsPlaylist) {
    const pl = addingSongsPlaylist;
    return (
      <View style={[s.container, { paddingTop: topInset }]}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => setAddingSongsPlaylistId(null)}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={s.headerTitle}>Add to {pl.name}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + 20, gap: 8 }} showsVerticalScrollIndicator={false}>
          {ALL_TRACKS.map(track => {
            const alreadyIn = pl.trackIds.includes(track.id);
            return (
              <Pressable
                key={track.id}
                style={[s.trackCard, alreadyIn && { opacity: 0.5 }]}
                onPress={() => { if (!alreadyIn) addTrackToPlaylist(pl.id, track.id); }}
                disabled={alreadyIn}
              >
                <View style={[s.trackIcon, { backgroundColor: track.color + '20' }]}>
                  <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={20} color={track.color} />
                </View>
                <View style={s.trackInfo}>
                  <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
                  <Text style={s.trackMood}>{track.mood}</Text>
                </View>
                {alreadyIn ? (
                  <Ionicons name="checkmark-circle" size={22} color={C.sage} />
                ) : (
                  <Ionicons name="add-circle-outline" size={22} color={C.textSub} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  const renderMixDetail = () => {
    const mix = DAILY_MIXES.find(m => m.id === openMixId);
    if (!mix) return null;
    const mixTracks = mix.trackIds.map(id => trackIndex.get(id)).filter(Boolean) as Track[];
    const artSize = SCREEN_W - 80;
    return (
      <View style={{ flex: 1 }}>
        <Pressable style={s.mixDetailBackBtn} onPress={() => setOpenMixId(null)}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: bottomInset + (currentTrack ? 130 : 20) }} showsVerticalScrollIndicator={false}>
          <View style={s.mixDetailArtWrap}>
            <LinearGradient colors={[mix.bg, mix.color + '40', '#0D0F14']} style={[s.mixDetailArt, { width: artSize, height: artSize }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={mix.icon as keyof typeof Ionicons.glyphMap} size={80} color={mix.color} />
            </LinearGradient>
          </View>
          <View style={s.mixDetailInfo}>
            <Text style={s.mixDetailBigTitle}>{mix.name}</Text>
            <Text style={s.mixDetailBigSub}>{mix.subtitle} · {mixTracks.length} tracks</Text>
          </View>
          <View style={s.mixDetailActions}>
            <Pressable
              style={[s.mixDetailPlayBtn, { backgroundColor: mix.color }]}
              onPress={() => { const first = mixTracks[0]; if (first) playTrack(first); }}
            >
              <Ionicons name="play" size={18} color={C.bg} />
              <Text style={s.mixDetailPlayBtnText}>Play All</Text>
            </Pressable>
            <Pressable
              style={s.mixDetailSaveBtn}
              onPress={() => saveMixAsPlaylist(mix)}
            >
              <Ionicons name="add-circle-outline" size={18} color={C.lavender} />
              <Text style={s.mixDetailSaveBtnText}>Save to Library</Text>
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: 20, gap: 8, marginTop: 8 }}>
            {mixTracks.map((track, idx) => {
              const active = currentTrack?.id === track.id;
              const fav = isFavourite(track.id);
              return (
                <View key={track.id}>
                  <Pressable
                    style={[s.trackCard, active && { borderColor: track.color + '80', backgroundColor: track.color + '10' }]}
                    onPress={() => playTrack(track)}
                  >
                    <View style={[s.trendBadge, { backgroundColor: C.cardAlt }]}>
                      <Text style={s.trendNum}>{idx + 1}</Text>
                    </View>
                    <View style={[s.trackIcon, { backgroundColor: track.color + '20' }]}>
                      <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={18} color={track.color} />
                    </View>
                    <View style={s.trackInfo}>
                      <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
                      <Text style={s.trackMood}>{track.mood} · {track.duration}</Text>
                    </View>
                    {fav && (
                      <Ionicons name="heart" size={16} color={C.error} />
                    )}
                    <Pressable hitSlop={8} onPress={() => { setOpenMenuId(openMenuId === track.id ? null : track.id); setMenuPlaylistExpanded(false); }}>
                      <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
                    </Pressable>
                  </Pressable>
                  {openMenuId === track.id && renderTrackMenu(track)}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDiscover = () => {
    if (openMixId) return renderMixDetail();
    return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + (currentTrack ? 130 : 20), gap: 24 }} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Recently Played" />
      {history.length === 0 ? (
        <View style={s.emptySmall}><Text style={s.emptyText}>Nothing played yet</Text></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {history.slice(0, 8).map(track => (
            <Pressable key={track.id} style={s.hCard} onPress={() => playTrack(track)}>
              <View style={[s.hCardIcon, { backgroundColor: track.color + '20' }]}>
                <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={24} color={track.color} />
              </View>
              <Text style={s.hCardTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={s.hCardSub} numberOfLines={1}>{track.mood}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {forYouTracks.length > 0 && (
        <>
          <SectionHeader title="For You" right={
            <Pressable onPress={() => setHistory([])}><Text style={s.clearBtn}>Clear</Text></Pressable>
          } />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {forYouTracks.map(track => (
              <Pressable key={track.id} style={s.hCard} onPress={() => playTrack(track)}>
                <View style={[s.hCardIcon, { backgroundColor: track.color + '20' }]}>
                  <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={24} color={track.color} />
                </View>
                <Text style={s.hCardTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={s.hCardSub} numberOfLines={1}>{track.mood}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <SectionHeader title="Daily Mixes" />
      <View style={s.mixGrid}>
        {DAILY_MIXES.map(mix => (
          <Pressable
            key={mix.id}
            style={s.mixCard}
            onPress={() => { setOpenMixId(mix.id); setMixSearch(''); }}
          >
            <LinearGradient colors={[mix.bg, C.card]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <View style={[s.mixIconWrap, { backgroundColor: mix.color + '25' }]}>
              <Ionicons name={mix.icon as keyof typeof Ionicons.glyphMap} size={24} color={mix.color} />
            </View>
            <Text style={s.mixName}>{mix.name}</Text>
            <Text style={s.mixSub}>{mix.subtitle}</Text>
            <View style={s.mixTrackCount}>
              <Text style={s.mixTrackCountText}>{mix.trackIds.length} tracks</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Trending" />
      {TRENDING_IDS.map((id, idx) => {
        const track = trackIndex.get(id);
        if (!track) return null;
        const active = currentTrack?.id === track.id;
        return (
          <Pressable key={id} style={[s.trendRow, active && { borderColor: track.color + '60' }]} onPress={() => playTrack(track)}>
            <View style={[s.trendBadge, { backgroundColor: idx === 0 ? C.gold + '30' : C.card }]}>
              <Text style={[s.trendNum, idx === 0 && { color: C.gold }]}>{idx + 1}</Text>
            </View>
            <View style={[s.trendIcon, { backgroundColor: track.color + '20' }]}>
              <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={18} color={track.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={s.trackMood}>{track.mood} · {track.genre}</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => { setOpenMenuId(openMenuId === track.id ? null : track.id); setMenuPlaylistExpanded(false); }}>
              <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
            </Pressable>
            {openMenuId === track.id && renderTrackMenu(track)}
          </Pressable>
        );
      })}
    </ScrollView>
    );
  };

  const renderTrackMenu = (track: Track) => (
    <View style={s.inlineMenu}>
      <Pressable style={s.menuItem} onPress={() => { toggleTrackFav(track); setOpenMenuId(null); setMenuPlaylistExpanded(false); }}>
        <Ionicons name={isFavourite(track.id) ? 'heart-dislike' : 'heart'} size={16} color={C.text} />
        <Text style={s.menuText}>{isFavourite(track.id) ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
      </Pressable>
      <Pressable style={s.menuItem} onPress={() => { setOpenMenuId(null); setMenuPlaylistExpanded(false); setDownloadToast(track.title); setTimeout(() => setDownloadToast(null), 2000); }}>
        <Ionicons name="download" size={16} color={C.text} />
        <Text style={s.menuText}>Download</Text>
      </Pressable>
      <Pressable style={s.menuItem} onPress={() => setMenuPlaylistExpanded(prev => !prev)}>
        <Ionicons name="add" size={16} color={C.text} />
        <Text style={[s.menuText, { flex: 1 }]}>Add to Playlist</Text>
        <Ionicons name={menuPlaylistExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.textMuted} />
      </Pressable>
      {menuPlaylistExpanded && (
        <View style={s.nestedPlaylistList}>
          {userPlaylists.length === 0 ? (
            <Text style={s.nestedEmptyText}>No playlists yet</Text>
          ) : (
            userPlaylists.map(pl => {
              const inPl = pl.trackIds.includes(track.id);
              return (
                <Pressable
                  key={pl.id}
                  style={s.nestedPlaylistItem}
                  onPress={() => { if (!inPl) addTrackToPlaylist(pl.id, track.id); }}
                  disabled={inPl}
                >
                  <Ionicons name={inPl ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={inPl ? C.sage : C.textMuted} />
                  <Text style={[s.nestedPlaylistName, inPl && { color: C.sage }]}>{pl.name}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );

  const renderMusic = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: bottomInset + (currentTrack ? 130 : 20), gap: 8 }} showsVerticalScrollIndicator={false}>
      {filteredTracks.map(track => {
        const active = currentTrack?.id === track.id;
        const fav = isFavourite(track.id);
        return (
          <View key={track.id}>
            <Pressable
              style={[s.trackCard, active && { borderColor: track.color + '80', backgroundColor: track.color + '10' }]}
              onPress={() => playTrack(track)}
            >
              <View style={[s.trackIcon, { backgroundColor: track.color + '20' }]}>
                <Ionicons name={track.icon as keyof typeof Ionicons.glyphMap} size={20} color={track.color} />
              </View>
              <View style={s.trackInfo}>
                <Text style={s.trackTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={s.trackMood}>{track.mood}</Text>
                <Text style={s.trackGenre}>{track.genre}</Text>
              </View>
              {fav && <Ionicons name="heart" size={16} color={C.error} />}
              <Pressable hitSlop={8} onPress={() => { setOpenMenuId(openMenuId === track.id ? null : track.id); setMenuPlaylistExpanded(false); }}>
                <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
              </Pressable>
            </Pressable>
            {openMenuId === track.id && renderTrackMenu(track)}
          </View>
        );
      })}
      {filteredTracks.length === 0 && (
        <View style={s.emptySmall}><Text style={s.emptyText}>No tracks found</Text></View>
      )}
    </ScrollView>
  );

  const renderPlaylists = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + (currentTrack ? 130 : 20), gap: 12 }} showsVerticalScrollIndicator={false}>
      <View style={s.plHeader}>
        <Text style={s.plTitle}>My Playlists</Text>
        <View style={s.plActions}>
          <Pressable style={s.plIconBtn} onPress={createPlaylist} hitSlop={6}>
            <Ionicons name="add" size={20} color={C.text} />
          </Pressable>
          <Pressable style={s.plIconBtn} onPress={() => setShowSortModal(true)} hitSlop={6}>
            <Ionicons name="swap-vertical" size={18} color={C.text} />
          </Pressable>
          <Pressable style={s.plIconBtn} onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')} hitSlop={6}>
            <Ionicons name={viewMode === 'list' ? 'grid' : 'list'} size={18} color={C.text} />
          </Pressable>
        </View>
      </View>
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search playlists..."
          placeholderTextColor={C.textMuted}
          value={playlistSearch}
          onChangeText={setPlaylistSearch}
          selectionColor={C.lavender}
        />
      </View>

      {sortedPlaylists.length === 0 && (
        <View style={s.emptySmall}><Text style={s.emptyText}>No playlists yet. Tap + to create one.</Text></View>
      )}

      {viewMode === 'list' ? (
        sortedPlaylists.map(pl => {
          const expanded = expandedPlaylistId === pl.id;
          return (
            <View key={pl.id} style={s.plCard}>
              <Pressable
                style={s.plCardRow}
                onPress={() => setExpandedPlaylistId(expanded ? null : pl.id)}
              >
                <View style={[s.plCardIcon, { backgroundColor: C.lavender + '20' }]}>
                  <Ionicons name="musical-notes" size={20} color={C.lavender} />
                </View>
                <View style={{ flex: 1 }}>
                  {renamingPlaylistId === pl.id ? (
                    <TextInput
                      style={s.renameInput}
                      value={renameText}
                      onChangeText={setRenameText}
                      onSubmitEditing={() => renamePlaylist(pl.id, renameText)}
                      autoFocus
                      selectionColor={C.lavender}
                    />
                  ) : (
                    <>
                      <Text style={s.plCardName}>{pl.name}</Text>
                      <Text style={s.plCardCount}>{pl.trackIds.length} tracks</Text>
                    </>
                  )}
                </View>
                <Pressable hitSlop={8} onPress={() => setPlaylistMenuId(playlistMenuId === pl.id ? null : pl.id)}>
                  <Ionicons name="ellipsis-vertical" size={18} color={C.textMuted} />
                </Pressable>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
              </Pressable>
              {playlistMenuId === pl.id && (
                <View style={s.inlineMenu}>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); setRenamingPlaylistId(pl.id); setRenameText(pl.name); }}>
                    <Ionicons name="pencil" size={16} color={C.text} />
                    <Text style={s.menuText}>Rename</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); shufflePlaylist(pl); }}>
                    <Ionicons name="shuffle" size={16} color={C.text} />
                    <Text style={s.menuText}>Shuffle Play</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); setAddingSongsPlaylistId(pl.id); }}>
                    <Ionicons name="add" size={16} color={C.text} />
                    <Text style={s.menuText}>Add Songs</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); deletePlaylist(pl.id); }}>
                    <Ionicons name="trash" size={16} color={C.error} />
                    <Text style={[s.menuText, { color: C.error }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
              {expanded && (
                <View style={s.plExpandedTracks}>
                  {pl.trackIds.length === 0 && <Text style={s.emptyText}>No tracks added</Text>}
                  {pl.trackIds.map(tid => {
                    const track = trackIndex.get(tid);
                    if (!track) return null;
                    return (
                      <View key={tid} style={s.plTrackRow}>
                        <Pressable onPress={() => removeTrackFromPlaylist(pl.id, tid)} hitSlop={6}>
                          <Ionicons name="remove-circle" size={18} color={C.error} />
                        </Pressable>
                        <Text style={s.plTrackTitle} numberOfLines={1}>{track.title}</Text>
                        <Pressable onPress={() => playTrack(track)} hitSlop={6}>
                          <Ionicons name="play" size={18} color={C.lavender} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <View style={s.plGrid}>
          {sortedPlaylists.map(pl => (
            <View key={pl.id} style={s.plGridCard}>
              <Pressable
                onPress={() => { shufflePlaylist(pl); }}
                style={{ flex: 1 }}
              >
                <LinearGradient colors={[C.lavender + '60', '#1A1035']} style={s.plGridIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name="musical-notes" size={52} color={C.lavender} />
                </LinearGradient>
                <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 2 }}>
                  <Text style={s.plGridName} numberOfLines={1}>{pl.name}</Text>
                  <Text style={s.plGridCount}>{pl.trackIds.length} tracks</Text>
                </View>
              </Pressable>
              <Pressable
                style={s.plGridDotBtn}
                hitSlop={6}
                onPress={() => setPlaylistMenuId(playlistMenuId === pl.id ? null : pl.id)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={C.textMuted} />
              </Pressable>
              {playlistMenuId === pl.id && (
                <View style={[s.inlineMenu, { margin: 8, marginTop: 0 }]}>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); setRenamingPlaylistId(pl.id); setRenameText(pl.name); }}>
                    <Ionicons name="pencil" size={16} color={C.text} />
                    <Text style={s.menuText}>Rename</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); shufflePlaylist(pl); }}>
                    <Ionicons name="shuffle" size={16} color={C.text} />
                    <Text style={s.menuText}>Shuffle Play</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); setAddingSongsPlaylistId(pl.id); }}>
                    <Ionicons name="add" size={16} color={C.text} />
                    <Text style={s.menuText}>Add Songs</Text>
                  </Pressable>
                  <Pressable style={s.menuItem} onPress={() => { setPlaylistMenuId(null); deletePlaylist(pl.id); }}>
                    <Ionicons name="trash" size={16} color={C.error} />
                    <Text style={[s.menuText, { color: C.error }]}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderFavorites = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: bottomInset + (currentTrack ? 130 : 20), gap: 8 }} showsVerticalScrollIndicator={false}>
      {favTracks.length === 0 ? (
        <View style={s.emptyLarge}>
          <Ionicons name="heart-outline" size={48} color={C.textMuted} />
          <Text style={s.emptyTitle}>No favorites yet</Text>
          <Text style={s.emptyText}>Tap the heart icon on any track to add it here</Text>
        </View>
      ) : (
        favTracks.map(track => {
          const active = currentTrack?.id === track.id;
          return (
            <TrackCard
              key={track.id}
              track={track}
              isActive={active}
              onPlay={() => playTrack(track)}
              rightContent={
                <Pressable hitSlop={8} onPress={() => toggleTrackFav(track)}>
                  <Ionicons name="heart" size={20} color={C.error} />
                </Pressable>
              }
            />
          );
        })
      )}
    </ScrollView>
  );

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'discover', label: 'Discover' },
    { key: 'music', label: 'Music' },
    { key: 'playlists', label: 'Playlists' },
    { key: 'favorites', label: 'Favorites' },
  ];

  return (
    <View style={[s.container, { paddingTop: topInset }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => { stopAll(); router.back(); }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>Music</Text>
        {activeTab === 'music' ? (
          <Pressable
            hitSlop={8}
            style={[s.backBtn, genreFilter && { backgroundColor: C.lavender + '30' }]}
            onPress={() => setShowGenreModal(true)}
          >
            <Ionicons name="options-outline" size={20} color={genreFilter ? C.lavender : C.text} />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <View style={s.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => { setActiveTab(tab.key); setOpenMenuId(null); }}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'discover' && renderDiscover()}
      {activeTab === 'music' && renderMusic()}
      {activeTab === 'playlists' && renderPlaylists()}
      {activeTab === 'favorites' && renderFavorites()}

      {currentTrack && !showNowPlaying && (
        <View style={[s.miniPlayer, { bottom: bottomInset + 8 }]}>
          <LinearGradient colors={[C.card, C.bg2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNowPlaying(true)} />
          <View style={s.mpTop} pointerEvents="box-none">
            <Pressable style={s.mpLeft} onPress={() => setShowNowPlaying(true)}>
              <Text style={s.mpTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={s.mpMood}>{currentTrack.mood}</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation(); setShowSleepModal(true); }} hitSlop={8} style={s.mpTimerBtn}>
              <Ionicons name="timer-outline" size={20} color={sleepTimerEnd ? C.gold : C.textSub} />
            </Pressable>
            <View style={s.mpControls}>
              <Pressable onPress={prevTrack} hitSlop={8}><Ionicons name="play-skip-back" size={18} color={C.text} /></Pressable>
              <Pressable onPress={isPlaying ? pauseTrack : resumeTrack} style={[s.mpPlayBtn, { backgroundColor: currentTrack.color }]}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={C.bg} />
              </Pressable>
              <Pressable onPress={nextTrack} hitSlop={8}><Ionicons name="play-skip-forward" size={18} color={C.text} /></Pressable>
            </View>
          </View>
          <View style={s.mpProgressTrack} pointerEvents="none">
            <View style={[s.mpProgressFill, { width: `${progress * 100}%`, backgroundColor: currentTrack.color }]} />
          </View>
          <View style={s.mpTimeRow} pointerEvents="none">
            <Text style={s.mpTimeText}>{formatTime(progress * durationToMs(currentTrack.duration))}</Text>
            <Text style={s.mpTimeText}>-{formatTime((1 - progress) * durationToMs(currentTrack.duration))}</Text>
          </View>
          {sleepTimerEnd !== null && sleepRemaining > 0 && (
            <View style={s.mpSleepRow}>
              <Ionicons name="timer-outline" size={12} color={C.gold} />
              <Text style={s.mpSleepText}>Sleep in {formatTime(sleepRemaining)}</Text>
              <Pressable onPress={clearSleepTimer}><Text style={s.mpSleepCancel}>Cancel</Text></Pressable>
            </View>
          )}
        </View>
      )}

      <Modal visible={showSleepModal} transparent animationType="fade" onRequestClose={() => setShowSleepModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowSleepModal(false)}>
          <Pressable style={s.modalContent} onPress={() => {}}>
            <Text style={s.modalTitle}>Sleep Timer</Text>
            <View style={s.timerGrid}>
              {[5, 10, 15, 30, 60].map(m => (
                <Pressable
                  key={m}
                  style={[s.timerBtn, sleepMinutes === m && { backgroundColor: C.lavender + '25', borderColor: C.lavender }]}
                  onPress={() => setSleepMinutes(m)}
                >
                  <Text style={[s.timerBtnText, sleepMinutes === m && { color: C.lavender }]}>{m} min</Text>
                </Pressable>
              ))}
            </View>
            <View style={s.customTimerRow}>
              <TextInput
                style={s.customTimerInput}
                placeholder="Custom (min)"
                placeholderTextColor={C.textMuted}
                value={customSleepInput}
                onChangeText={t => { setCustomSleepInput(t); const n = parseInt(t); if (!isNaN(n)) setSleepMinutes(n); }}
                keyboardType="number-pad"
                selectionColor={C.lavender}
              />
            </View>
            <View style={s.modalBtnRow}>
              <Pressable style={s.modalBtnSecondary} onPress={() => { clearSleepTimer(); setShowSleepModal(false); }}>
                <Text style={s.modalBtnSecText}>Clear</Text>
              </Pressable>
              <Pressable style={[s.modalBtnPrimary, { backgroundColor: C.lavender }]} onPress={() => startSleepTimer(sleepMinutes)}>
                <Text style={s.modalBtnPriText}>Start</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showGenreModal} transparent animationType="fade" onRequestClose={() => setShowGenreModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowGenreModal(false)}>
          <Pressable style={s.modalContent} onPress={() => {}}>
            <Text style={s.modalTitle}>Filter by Genre</Text>
            <Pressable style={[s.genreItem, !genreFilter && { backgroundColor: C.lavender + '20' }]} onPress={() => { setGenreFilter(null); setShowGenreModal(false); }}>
              <Text style={[s.genreItemText, !genreFilter && { color: C.lavender }]}>All Genres</Text>
              <Text style={s.genreCount}>{ALL_TRACKS.length}</Text>
            </Pressable>
            {GENRES.map(g => {
              const count = ALL_TRACKS.filter(t => t.genre === g.name).length;
              const active = genreFilter === g.name;
              return (
                <Pressable key={g.name} style={[s.genreItem, active && { backgroundColor: g.color + '20' }]} onPress={() => { setGenreFilter(g.name); setShowGenreModal(false); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={g.icon as keyof typeof Ionicons.glyphMap} size={18} color={active ? g.color : C.textSub} />
                    <Text style={[s.genreItemText, active && { color: g.color }]}>{g.name}</Text>
                  </View>
                  <Text style={s.genreCount}>{count}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={s.modalContent} onPress={() => {}}>
            <Text style={s.modalTitle}>Sort Playlists</Text>
            {([['title', 'Title'], ['date', 'Date Added'], ['lastPlayed', 'Last Played']] as [SortMode, string][]).map(([key, label]) => (
              <Pressable key={key} style={[s.genreItem, sortMode === key && { backgroundColor: C.lavender + '20' }]} onPress={() => { setSortMode(key); setShowSortModal(false); }}>
                <Text style={[s.genreItemText, sortMode === key && { color: C.lavender }]}>{label}</Text>
                {sortMode === key && <Ionicons name="checkmark" size={18} color={C.lavender} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {downloadToast && (
        <View style={s.toast}>
          <Ionicons name="checkmark-circle" size={16} color={C.sage} />
          <Text style={s.toastText}>{downloadToast} saved for offline</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.lavender },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textMuted },
  tabTextActive: { color: C.text },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  clearBtn: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.lavender },

  hCard: { width: 120, backgroundColor: C.card, borderRadius: 14, padding: 12, gap: 6, borderWidth: 1, borderColor: C.border },
  hCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hCardTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.text },
  hCardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub },

  recBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  recBannerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recBannerTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  recBannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },

  mixGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mixCard: { width: (SCREEN_W - 52) / 2, borderRadius: 16, padding: 16, gap: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  mixIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mixName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  mixSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },

  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, position: 'relative' as const },
  trendBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  trendNum: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.textSub },
  trendIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border },
  trackIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trackInfo: { flex: 1, gap: 2 },
  trackTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
  trackMood: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  trackGenre: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },

  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, height: 44 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, position: 'relative' as const },
  filterDot: { position: 'absolute' as const, top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: C.lavender },

  genreBreadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  genreBreadText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.lavender },

  inlineMenu: { backgroundColor: C.cardAlt, borderRadius: 12, padding: 6, marginTop: 6, borderWidth: 1, borderColor: C.border },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  menuText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.text },
  nestedPlaylistList: { paddingLeft: 16, paddingBottom: 4, gap: 2 },
  nestedPlaylistItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  nestedPlaylistName: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.text },
  nestedEmptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, paddingVertical: 8, paddingHorizontal: 12 },
  toast: { position: 'absolute' as const, top: 80, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: C.cardAlt, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  toastText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.text },

  plHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  plActions: { flexDirection: 'row', gap: 8 },
  plIconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  plCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  plCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  plCardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  plCardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
  plCardCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  renameInput: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text, borderBottomWidth: 1, borderBottomColor: C.lavender, paddingVertical: 2 },

  plExpandedTracks: { paddingHorizontal: 12, paddingBottom: 8, gap: 6, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  plTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  plTrackTitle: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: C.text },

  plGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plGridCard: { width: (SCREEN_W - 52) / 2, backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  plGridIcon: { width: (SCREEN_W - 52) / 2, height: (SCREEN_W - 52) / 2, alignItems: 'center', justifyContent: 'center' },
  plGridName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.text, textAlign: 'center' as const },
  plGridCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },

  genreChipScroll: { height: 48 },
  genreChipContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' as const, alignItems: 'center' as const },
  genreChip: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 24, backgroundColor: C.card },
  genreChipActive: { backgroundColor: C.gold },
  genreChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textSub },
  genreChipTextActive: { color: C.bg, fontFamily: 'Inter_600SemiBold' },

  mixDetailBackBtn: { position: 'absolute' as const, top: 0, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(13,15,20,0.7)', alignItems: 'center', justifyContent: 'center' },
  mixDetailArtWrap: { alignItems: 'center', paddingTop: 16, paddingBottom: 0 },
  mixDetailArt: { borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mixDetailInfo: { alignItems: 'center', gap: 4, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 6 },
  mixDetailBigTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text },
  mixDetailBigSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub },
  mixDetailActions: { flexDirection: 'row' as const, gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  mixDetailPlayBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14 },
  mixDetailPlayBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.bg },
  mixDetailSaveBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.lavender, backgroundColor: C.lavender + '10' },
  mixDetailSaveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.lavender },
  mixTrackCount: { marginTop: 4 },
  mixTrackCountText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },

  plGridDotBtn: { position: 'absolute' as const, bottom: 36, right: 10, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(13,15,20,0.6)', alignItems: 'center', justifyContent: 'center' },

  emptySmall: { paddingVertical: 24, alignItems: 'center' },
  emptyLarge: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' as const },

  miniPlayer: { position: 'absolute' as const, left: 12, right: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, padding: 12, gap: 6 },
  mpTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mpLeft: { flex: 1, gap: 2 },
  mpTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
  mpMood: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub },
  mpTimerBtn: { padding: 4 },
  mpControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  mpPlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  mpProgressTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  mpProgressFill: { height: 3, borderRadius: 2 },
  mpTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mpTimeText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted },
  mpSleepRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  mpSleepText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.gold, flex: 1 },
  mpSleepCancel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: C.lavender },

  npHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  npTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.text },
  npBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 40 },
  npArt: { width: 200, height: 200, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  npTrackName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' as const },
  npTrackMood: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub },
  npTrackGenre: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  npProgressWrap: { width: '100%', gap: 6 },
  npProgressTrack: { height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  npProgressFill: { height: 4, borderRadius: 2 },
  npTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  npTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  npControls: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  npPlayBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360, gap: 16 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' as const },
  timerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  timerBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.cardAlt },
  timerBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  customTimerRow: { flexDirection: 'row', gap: 10 },
  customTimerInput: { flex: 1, height: 44, borderRadius: 12, backgroundColor: C.cardAlt, paddingHorizontal: 14, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, borderWidth: 1, borderColor: C.border },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  modalBtnSecText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  modalBtnPrimary: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnPriText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.bg },

  genreItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 },
  genreItemText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text },
  genreCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
});
