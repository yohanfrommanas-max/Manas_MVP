import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio, Video } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { LayoutAnimation, Platform, UIManager } from "react-native";


function formatTime(ms = 0) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SoundLibraryScreen({ goBack }) {
  const soundRef = useRef(null);
  const progressBarWidthRef = useRef(1);
  const sleepTimerRef = useRef(null);

// Screen state
  const [screen, setScreen] = useState("discover"); // "tracks" | "playlists" | "favorites" | "discover" | "visuals"
  const [showGenreFilter, setShowGenreFilter] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // For viewing playlist details
  const [selectedGenre, setSelectedGenre] = useState(null); // null shows all genres, otherwise shows specific genre tracks
  const [searchQuery, setSearchQuery] = useState("");

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(1);

  // Queue
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const currentTrack = queueIndex >= 0 ? queue[queueIndex] : null;

  // Mini player expansion
  const [miniPlayerExpanded, setMiniPlayerExpanded] = useState(false);

  // Sleep timer modal
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState("15");
  const [sleepTimerEndsAt, setSleepTimerEndsAt] = useState(null);

  // Downloads & recent (mock data for now)
  const [downloads, setDownloads] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

// User playlists and favorites
  const [userPlaylists, setUserPlaylists] = useState([
    { 
      id: "playlist_1", 
      name: "Meditate", 
      tracks: [],
    },
    { 
      id: "playlist_2", 
      name: "Sleep", 
      tracks: [],
    },
    { 
      id: "playlist_3", 
      name: "Walk", 
      tracks: [],
    },
  ]);
  const [favorites, setFavorites] = useState([]);
  const [trackMenuOpen, setTrackMenuOpen] = useState(null); // track ID for which menu is open
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");
  const [addingTracksToPlaylist, setAddingTracksToPlaylist] = useState(null); // playlist ID or track ID for adding
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(null); // track ID for which to show playlist selector
  const [suggestedTracks, setSuggestedTracks] = useState([]);

const [playlistSortBy, setPlaylistSortBy] = useState("title"); // "title" | "dateAdded" | "lastPlayed"
const [playlistViewMode, setPlaylistViewMode] = useState("list"); // "list" | "grid"
const [showPlaylistSortModal, setShowPlaylistSortModal] = useState(false);
const [showPlaylistViewModal, setShowPlaylistViewModal] = useState(false);
const [expandedPlaylists, setExpandedPlaylists] = useState({});


  // TEMP VIDEO
  const visualsVideo = useMemo(
    () => require("../assets/Video/SoundLibraryVideo1.mp4"),
    []
  );

// ---- UPDATED DATA: Organized by genre
  const genres = useMemo(
    () => [
      {
        id: "focus",
        title: "Focus",
        tracks: [
          {
            id: "lofi1",
            title: "Late Night Notes",
            mood: "Chill · Study",
            genre: "Focus",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "lofi2",
            title: "Study Beats",
            mood: "Focus · Flow",
            genre: "Focus",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "alpha1",
            title: "Alpha Drift",
            mood: "Focus · Clarity",
            genre: "Focus",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "sleep",
        title: "Sleep",
        tracks: [
          {
            id: "theta1",
            title: "Theta Downshift",
            mood: "Sleep · Deep",
            genre: "Sleep",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "theta2",
            title: "Deep Sleep Tone",
            mood: "Sleep · Recovery",
            genre: "Sleep",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "nature1",
            title: "Gentle Rain",
            mood: "Relax · Sleep",
            genre: "Sleep",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "work",
        title: "Work",
        tracks: [
          {
            id: "work1",
            title: "Productivity Flow",
            mood: "Motivated · Focused",
            genre: "Work",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "work2",
            title: "Deep Work",
            mood: "Concentration · Drive",
            genre: "Work",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "study",
        title: "Study",
        tracks: [
          {
            id: "study1",
            title: "Study Session",
            mood: "Learning · Focus",
            genre: "Study",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "study2",
            title: "Memory Boost",
            mood: "Retention · Clarity",
            genre: "Study",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "binaural",
        title: "Binaural Beats",
        tracks: [
          {
            id: "binaural1",
            title: "Deep Focus 40Hz",
            mood: "Concentration · Gamma",
            genre: "Binaural Beats",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "binaural2",
            title: "Relaxation 10Hz",
            mood: "Calm · Alpha",
            genre: "Binaural Beats",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "whitenoise",
        title: "White Noise",
        tracks: [
          {
            id: "white1",
            title: "Pure White Noise",
            mood: "Focus · Block",
            genre: "White Noise",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "white2",
            title: "Brown Noise",
            mood: "Deep · Grounding",
            genre: "White Noise",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "run",
        title: "Run",
        tracks: [
          {
            id: "run1",
            title: "Running Rhythm",
            mood: "Energy · Pace",
            genre: "Run",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "run2",
            title: "Cardio Beat",
            mood: "Motivation · Speed",
            genre: "Run",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
      {
        id: "classical",
        title: "Classical",
        tracks: [
          {
            id: "classical1",
            title: "Soft Piano",
            mood: "Calm · Focus",
            genre: "Classical",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
          {
            id: "classical2",
            title: "Morning Strings",
            mood: "Peaceful · Elegant",
            genre: "Classical",
            source: require("../assets/Audio/Gentle_rain_audio.mp3"),
          },
        ],
      },
    ],
    []
  );

// Flatten all tracks
  const allTracks = useMemo(() => {
    const tracks = [];
    genres.forEach((genre) => {
      genre.tracks.forEach((t) => {
        tracks.push({
          ...t,
          genreIcon: genre.icon,
        });
      });
    });
    return tracks;
  }, [genres]);

// Curated playlists 
  const curatedPlaylists = useMemo(() => [
    {
      id: "focus",
      name: "Focus",
      description: "Deep concentration music",
      tracks: allTracks.filter(t => t.genre === "Focus").slice(0, 5),
    },
    {
      id: "work",
      name: "Work",
      description: "Productivity and motivation",
      tracks: allTracks.filter(t => t.genre === "Work").slice(0, 5),
    },
    {
      id: "study",
      name: "Study",
      description: "Enhance your learning",
      tracks: allTracks.filter(t => t.genre === "Study" || t.genre === "Classical").slice(0, 5),
    },
    {
      id: "run",
      name: "Run",
      description: "Energizing beats",
      tracks: allTracks.filter(t => t.genre === "Run").slice(0, 5),
    },
    {
      id: "sleep",
      name: "Sleep",
      description: "Drift into deep rest",
      tracks: allTracks.filter(t => t.genre === "Sleep").slice(0, 5),
    },
    {
      id: "binaural_beats",
      name: "Binaural Beats",
      description: "Brainwave entrainment",
      tracks: allTracks.filter(t => t.genre === "Binaural Beats").slice(0, 5),
    },
    {
      id: "white_noise",
      name: "White Noise",
      description: "Block distractions",
      tracks: allTracks.filter(t => t.genre === "White Noise").slice(0, 5),
    },
  ], [allTracks]);

  // Filter tracks based on search and selected genre
  const filteredTracks = useMemo(() => {
    let tracks = allTracks;
    
    if (selectedGenre) {
      tracks = tracks.filter(t => t.genre === selectedGenre);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      tracks = tracks.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.mood.toLowerCase().includes(query) ||
        t.genre.toLowerCase().includes(query)
      );
    }
    
    return tracks;
  }, [allTracks, selectedGenre, searchQuery]);

  // ---------- Audio lifecycle ----------
const clearSleepTimer = () => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerEndsAt(null);
  };

  const unloadCurrent = async () => {
    try {
      clearSleepTimer();
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } catch (e) {
      console.log("Unload error:", e);
    } finally {
      setIsPlaying(false);
      setPositionMs(0);
      setDurationMs(1);
    }
  };

  useEffect(() => {
    return () => {
      unloadCurrent();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToRecentlyPlayed = (track) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  const playTrackAtIndex = async (index) => {
    if (!queue.length || index < 0 || index >= queue.length) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const track = queue[index];

      const { sound } = await Audio.Sound.createAsync(track.source, {
        shouldPlay: true,
        positionMillis: 0,
      });

      soundRef.current = sound;
      setQueueIndex(index);
      setIsPlaying(true);
      addToRecentlyPlayed(track);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        if (typeof status.positionMillis === "number")
          setPositionMs(status.positionMillis);
        if (typeof status.durationMillis === "number")
          setDurationMs(status.durationMillis || 1);

        if (status.didJustFinish) {
          if (index + 1 < queue.length) {
            playTrackAtIndex(index + 1);
          } else {
            setIsPlaying(false);
          }
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.log("Audio error:", e);
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const playPrev = async () => {
    if (!queue.length) return;
    await playTrackAtIndex(Math.max(queueIndex - 1, 0));
  };

  const playNext = async () => {
    if (!queue.length) return;
    await playTrackAtIndex(Math.min(queueIndex + 1, queue.length - 1));
  };

  const setPlaylistQueue = async (playlist, autoPlayIndex = 0) => {
    await unloadCurrent();
    setQueue(playlist.tracks);
    setQueueIndex(-1);

    setTimeout(() => {
      playTrackAtIndex(autoPlayIndex);
    }, 0);
  };

  // ---------- Seek ----------
  const seekToFraction = async (fraction) => {
    if (!soundRef.current) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    const target = Math.floor(clamped * (durationMs || 1));
    try {
      await soundRef.current.setPositionAsync(target);
    } catch (e) {
      console.log("Seek error:", e);
    }
  };

  const onProgressBarPress = async (evt) => {
    const x = evt.nativeEvent.locationX;
    const width = progressBarWidthRef.current || 1;
    await seekToFraction(x / width);
  };

  // ---------- Sleep timer ----------
  const startSleepTimer = async (minutesRaw) => {
    clearSleepTimer();

    const mins = Number(minutesRaw);
    if (!Number.isFinite(mins) || mins <= 0) return;

    const ms = Math.floor(mins * 60 * 1000);
    const endsAt = Date.now() + ms;
    setSleepTimerEndsAt(endsAt);

    sleepTimerRef.current = setTimeout(async () => {
      try {
        if (soundRef.current) await soundRef.current.pauseAsync().catch(() => {});
      } finally {
        setIsPlaying(false);
        clearSleepTimer();
      }
    }, ms);
  };

  const progress = durationMs ? positionMs / durationMs : 0;
  const remainingMs = Math.max(0, (durationMs || 1) - (positionMs || 0));

  // ---------- Track selection: play + DON'T auto-navigate to visuals ----------
  const onSelectTrack = async ({ playlist, trackIndex }) => {
    if (queue !== playlist.tracks) {
      await setPlaylistQueue(playlist, trackIndex);
    } else {
      await playTrackAtIndex(trackIndex);
    }
    // Don't auto-navigate - user can expand mini player instead
  };

  const onSelectSingleTrack = async (track) => {
    // When selecting from "All Tracks", create a single-track queue
    await unloadCurrent();
    setQueue([track]);
    setQueueIndex(-1);
    setTimeout(() => {
      playTrackAtIndex(0);
    }, 0);
  };

  // Mock download toggle
  const toggleDownload = (track) => {
    setDownloads((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const isDownloaded = (trackId) => downloads.some((t) => t.id === trackId);

const toggleFavorite = (track) => {
    setFavorites((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      if (exists) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
    setTrackMenuOpen(null);
  };

  const isFavorite = (trackId) => favorites.some((t) => t.id === trackId);

  const addToPlaylist = (playlistId, track) => {
  setUserPlaylists((prev) =>
    prev.map((pl) => {
      if (pl.id === playlistId) {
        const exists = pl.tracks.find((t) => t.id === track.id);
        if (!exists) {
          return { ...pl, tracks: [...pl.tracks, track] };
        }
      }
      return pl;
    })
  );
  setTrackMenuOpen(null);
  setAddingTracksToPlaylist(null);
};


  const removeFromPlaylist = (playlistId, trackId) => {
    setUserPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
        }
        return pl;
      })
    );
  };

const createNewPlaylist = () => {
    const name = `Playlist ${userPlaylists.length + 1}`;
    const newPlaylist = {
      id: `playlist_${Date.now()}`,
      name,
      tracks: [],
    };
    setUserPlaylists((prev) => [...prev, newPlaylist]);
  };

  const deletePlaylist = (playlistId) => {
    setUserPlaylists((prev) => prev.filter((pl) => pl.id !== playlistId));
  };

  const renamePlaylist = (playlistId, newName) => {
    setUserPlaylists((prev) =>
      prev.map((pl) => (pl.id === playlistId ? { ...pl, name: newName } : pl))
    );
    setEditingPlaylistId(null);
    setEditingPlaylistName("");
  };

  const startEditingPlaylist = (playlist) => {
    setEditingPlaylistId(playlist.id);
    setEditingPlaylistName(playlist.name);
  };

  const cancelEditingPlaylist = () => {
    setEditingPlaylistId(null);
    setEditingPlaylistName("");
  };

// ---------- UI SCREENS ----------

// 1. TRACKS SCREEN (Genre-based with search)

// Playlist selector submenu
const renderPlaylistSelector = (trackId) => {
  if (showPlaylistSelector !== trackId) return null;
  
  return (
    <View style={styles.playlistSelector}>
      <Text style={styles.playlistSelectorTitle}>Select Playlist</Text>
      {userPlaylists.map((pl) => {
        const track = allTracks.find(t => t.id === trackId);
        const isInPlaylist = pl.tracks.some(t => t.id === trackId);
        
        return (
          <TouchableOpacity
            key={pl.id}
            style={[styles.playlistSelectorItem, isInPlaylist && styles.playlistSelectorItemDisabled]}
            onPress={() => {
              if (!isInPlaylist) {
                addToPlaylist(pl.id, track);
                setShowPlaylistSelector(null);
              }
            }}
            disabled={isInPlaylist}
          >
            <Text style={styles.playlistSelectorIcon}>
              {isInPlaylist ? "✓" : "♫"}
            </Text>
            <Text style={styles.playlistSelectorText}>{pl.name}</Text>
            {isInPlaylist && (
              <Text style={styles.playlistSelectorBadge}>Added</Text>
            )}
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={styles.playlistSelectorCancel}
        onPress={() => setShowPlaylistSelector(null)}
      >
        <Text style={styles.playlistSelectorCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

  const renderTracks = () => (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, screen === "discover" && styles.tabActive]}
          onPress={() => {
            setScreen("discover");
            setSelectedGenre(null);
          }}
        >
          <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "tracks" && styles.tabActive]}
          onPress={() => setScreen("tracks")}
        >
          <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>
            Music
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "playlists" && styles.tabActive]}
          onPress={() => setScreen("playlists")}
        >
          <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>
            Playlists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "favorites" && styles.tabActive]}
          onPress={() => setScreen("favorites")}
        >
          <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainerFlex}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search tracks..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowGenreFilter(true)}
          >
            <Text style={styles.filterButtonIcon}>⚏</Text>
            {selectedGenre && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>

        {/* Genre Filter Modal */}
        <Modal transparent visible={showGenreFilter} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowGenreFilter(false)}>
            <Pressable style={styles.genreFilterModal} onPress={() => {}}>
              <Text style={styles.genreFilterTitle}>Filter by Genre</Text>
              
              <TouchableOpacity
                style={[styles.genreFilterOption, !selectedGenre && styles.genreFilterOptionActive]}
                onPress={() => {
                  setSelectedGenre(null);
                  setShowGenreFilter(false);
                }}
              >
                <Text style={styles.genreFilterOptionText}>All Genres</Text>
                {!selectedGenre && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>

              <ScrollView style={styles.genreFilterScroll}>
                {genres.map((genre) => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[styles.genreFilterOption, selectedGenre === genre.title && styles.genreFilterOptionActive]}
                    onPress={() => {
                      setSelectedGenre(genre.title);
                      setShowGenreFilter(false);
                    }}
                  >
                    <Text style={styles.genreFilterOptionText}>{genre.title}</Text>
                    <Text style={styles.genreFilterCount}>{genre.tracks.length} tracks</Text>
                    {selectedGenre === genre.title && <Text style={styles.genreFilterCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Back button when genre selected */}
        {selectedGenre && (
          <TouchableOpacity
            style={styles.backToGenres}
            onPress={() => setSelectedGenre(null)}
          >
            <Text style={styles.backToGenresText}>← Back to music</Text>
            <Text style={styles.selectedGenreTitle}>{selectedGenre}</Text>
          </TouchableOpacity>
        )}

        {/* Tracks List */}
        <View style={styles.tracksSection}>
          {filteredTracks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tracks found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            </View>
          ) : (
            filteredTracks.map((track) => {
              const isCurrent = currentTrack && currentTrack.id === track.id;

              return (
                <View key={track.id}>
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.premiumTrackRow, isCurrent && styles.trackRowActive]}
                    onPress={() => onSelectSingleTrack(track)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.trackIconCircle}>
                      <Text style={styles.trackIconText}>♫</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      <Text style={styles.trackMood}>{track.mood}</Text>
                      <Text style={styles.trackGenre}>{track.genre}</Text>
                    </View>

                    {/* Show heart if favorited */}
                    {isFavorite(track.id) && (
                      <Text style={styles.favoritedHeartIndicator}>♥</Text>
                    )}

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setTrackMenuOpen(trackMenuOpen === track.id ? null : track.id);
                      }}
                      style={styles.moreBtn}
                    >
                      <Text style={styles.moreBtnText}>⋮</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Track Menu */}
                  {trackMenuOpen === track.id && (
                    <View style={styles.trackMenu}>
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => toggleFavorite(track)}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isFavorite(track.id) ? "♥" : "♡"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isFavorite(track.id) ? "Remove from Favorites" : "Add to Favorites"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleDownload(track);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isDownloaded(track.id) ? "✓" : "↓"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isDownloaded(track.id) ? "Downloaded" : "Download"}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.trackMenuDivider} />
                      
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => {
                          setShowPlaylistSelector(track.id);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>+</Text>
                        <Text style={styles.trackMenuText}>Add to Playlist</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Playlist Selector */}
                  {renderPlaylistSelector(track.id)}
                </View>
              );
            })
          )}
      </View>
)}
    </ScrollView>
  </View>
);

// 2. PLAYLISTS SCREEN
  const renderPlaylists = () => {
    // If adding tracks to a playlist, show track selection screen
    if (addingTracksToPlaylist) {
      const playlist = userPlaylists.find((pl) => pl.id === addingTracksToPlaylist);
      
      return (
        <View style={{ flex: 1 }}>
          <View style={styles.addTracksHeader}>
            <TouchableOpacity onPress={() => setAddingTracksToPlaylist(null)}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
            <Text style={styles.addTracksTitle}>Add to "{playlist?.name}"</Text>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Select Tracks</Text>

            {allTracks.map((track) => {
              const isInPlaylist = playlist?.tracks.some((t) => t.id === track.id);

              return (
                <TouchableOpacity
                  key={track.id}
                  style={[
                    styles.premiumTrackRow,
                    isInPlaylist && styles.trackInPlaylist,
                  ]}
                  onPress={() => {
                    if (!isInPlaylist) {
                      addToPlaylist(addingTracksToPlaylist, track);
                    }
                  }}
                  activeOpacity={0.85}
                  disabled={isInPlaylist}
                >
                  <View style={styles.trackIconCircle}>
                    <Text style={styles.trackIconText}>♫</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle}>{track.title}</Text>
                    <Text style={styles.trackMood}>{track.mood}</Text>
                    <Text style={styles.trackGenre}>{track.genre}</Text>
                  </View>

                  {isInPlaylist ? (
                    <Text style={styles.alreadyAddedText}>✓ Added</Text>
                  ) : (
                    <Text style={styles.addTrackIcon}>+</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    // Normal playlists view
    return (
      <View style={{ flex: 1 }}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, screen === "discover" && styles.tabActive]}
            onPress={() => setScreen("discover")}
          >
            <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, screen === "tracks" && styles.tabActive]}
            onPress={() => setScreen("tracks")}
          >
            <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>
              Music
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, screen === "playlists" && styles.tabActive]}
            onPress={() => setScreen("playlists")}
          >
            <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>
              Playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, screen === "favorites" && styles.tabActive]}
            onPress={() => setScreen("favorites")}
          >
            <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>
              Favorites
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort Modal */}
        <Modal transparent visible={showPlaylistSortModal} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPlaylistSortModal(false)}>
            <Pressable style={styles.playlistModal} onPress={() => {}}>
              <Text style={styles.playlistModalTitle}>Sort Playlists</Text>
              
              <TouchableOpacity
                style={[styles.playlistModalOption, playlistSortBy === "title" && styles.playlistModalOptionActive]}
                onPress={() => {
                  setPlaylistSortBy("title");
                  setShowPlaylistSortModal(false);
                }}
              >
                <Text style={styles.playlistModalOptionText}>Title</Text>
                {playlistSortBy === "title" && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playlistModalOption, playlistSortBy === "dateAdded" && styles.playlistModalOptionActive]}
                onPress={() => {
                  setPlaylistSortBy("dateAdded");
                  setShowPlaylistSortModal(false);
                }}
              >
                <Text style={styles.playlistModalOptionText}>Date Added</Text>
                {playlistSortBy === "dateAdded" && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playlistModalOption, playlistSortBy === "lastPlayed" && styles.playlistModalOptionActive]}
                onPress={() => {
                  setPlaylistSortBy("lastPlayed");
                  setShowPlaylistSortModal(false);
                }}
              >
                <Text style={styles.playlistModalOptionText}>Last Played</Text>
                {playlistSortBy === "lastPlayed" && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* View Mode Modal */}
        <Modal transparent visible={showPlaylistViewModal} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowPlaylistViewModal(false)}>
            <Pressable style={styles.playlistModal} onPress={() => {}}>
              <Text style={styles.playlistModalTitle}>View Mode</Text>
              
              <TouchableOpacity
                style={[styles.playlistModalOption, playlistViewMode === "list" && styles.playlistModalOptionActive]}
                onPress={() => {
                  setPlaylistViewMode("list");
                  setShowPlaylistViewModal(false);
                }}
              >
                <Text style={styles.playlistModalOptionText}>List View</Text>
                {playlistViewMode === "list" && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playlistModalOption, playlistViewMode === "grid" && styles.playlistModalOptionActive]}
                onPress={() => {
                  setPlaylistViewMode("grid");
                  setShowPlaylistViewModal(false);
                }}
              >
                <Text style={styles.playlistModalOptionText}>Grid View</Text>
                {playlistViewMode === "grid" && <Text style={styles.genreFilterCheck}>✓</Text>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <ScrollView
          contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40, paddingHorizontal: 16, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header row: title + toolbar buttons inline */}
          <View style={styles.playlistHeaderRow}>
            <Text style={styles.sectionTitle}>My Playlists</Text>
            <View style={styles.playlistToolbarInline}>
              <TouchableOpacity
                style={styles.playlistToolbarBtn}
                onPress={createNewPlaylist}
              >
                <Text style={styles.playlistToolbarIcon}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playlistToolbarBtn}
                onPress={() => setShowPlaylistSortModal(true)}
              >
                <Text style={styles.playlistToolbarIcon}>⚏</Text>
                {playlistSortBy !== "title" && <View style={styles.filterBadge} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playlistToolbarBtn}
                onPress={() => setShowPlaylistViewModal(true)}
              >
                <Text style={styles.playlistToolbarIcon}>
                  {playlistViewMode === "list" ? "☰" : "⊞"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search playlists..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Playlists - Grid or List View */}
          {playlistViewMode === "grid" ? (
            <View style={styles.playlistGrid}>
              {userPlaylists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistGridCard}
                  onPress={() => {
                    // Open playlist for viewing/editing
                  }}
                  onLongPress={() => {
                    setTrackMenuOpen(trackMenuOpen === `playlist_${playlist.id}` ? null : `playlist_${playlist.id}`);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.playlistGridImage}>
                    <Text style={styles.playlistGridImageIcon}>♫</Text>
                  </View>
                  <Text style={styles.playlistGridName} numberOfLines={2}>{playlist.name}</Text>
                  <Text style={styles.playlistGridCount}>
                    {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
                  </Text>

                  {/* Playlist Menu for Grid */}
                  {/* Playlist Menu for Grid */}
{trackMenuOpen === `playlist_${playlist.id}` && (
  <View style={styles.trackMenu}>

    {/* Rename */}
    <TouchableOpacity
      style={styles.trackMenuItem}
      onPress={() => {
        startEditingPlaylist(playlist);
        setTrackMenuOpen(null);
      }}
    >
      <Text style={styles.trackMenuIcon}>✏</Text>
      <Text style={styles.trackMenuText}>Rename</Text>
    </TouchableOpacity>

    {/* Shuffle Play */}
    <TouchableOpacity
      style={styles.trackMenuItem}
      onPress={() => {
        if (playlist.tracks && playlist.tracks.length > 0) {
          const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);

          setQueue(shuffled);
          setQueueIndex(-1);

          setTimeout(() => {
            playTrackAtIndex(0);
          }, 0);
        }
        setTrackMenuOpen(null);
      }}
    >
      <Text style={styles.trackMenuIcon}>🔀</Text>
      <Text style={styles.trackMenuText}>Shuffle Play</Text>
    </TouchableOpacity>

    {/* Add Songs */}
    <TouchableOpacity
      style={styles.trackMenuItem}
      onPress={() => {
        setAddingTracksToPlaylist(playlist.id);
        setTrackMenuOpen(null);
      }}
    >
      <Text style={styles.trackMenuIcon}>➕</Text>
      <Text style={styles.trackMenuText}>Add Songs</Text>
    </TouchableOpacity>

    <View style={styles.trackMenuDivider} />

    {/* Delete */}
    <TouchableOpacity
      style={styles.trackMenuItem}
      onPress={() => {
        deletePlaylist(playlist.id);
        setTrackMenuOpen(null);
      }}
    >
      <Text style={[styles.trackMenuIcon, { color: '#FF6B6B' }]}>🗑</Text>
      <Text style={[styles.trackMenuText, { color: '#FF6B6B' }]}>
        Delete
      </Text>
    </TouchableOpacity>

  </View>
)}

                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // List View (existing code)
            <>
  {userPlaylists.map((playlist) => (
    <View key={playlist.id} style={styles.playlistCard}>
      
      {/* Playlist Header (Clickable for dropdown) */}
      <TouchableOpacity
        style={styles.playlistHeaderWithImage}
        onPress={() => {
  LayoutAnimation.easeInEaseOut(); // 🔥 animation
  setExpandedPlaylists((prev) => ({
    ...prev,
    [playlist.id]: !prev[playlist.id],
  }));
}}

        activeOpacity={0.85}
      >
        <View style={styles.playlistImagePlaceholder}>
          <Text style={styles.playlistImageIcon}>♫</Text>
        </View>

        <View style={{ flex: 1 }}>
          {editingPlaylistId === playlist.id ? (
            <View style={styles.editingRow}>
              <TextInput
                value={editingPlaylistName}
                onChangeText={setEditingPlaylistName}
                style={styles.editInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => renamePlaylist(playlist.id, editingPlaylistName)}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelEditingPlaylist}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistTrackCount}>
                {playlist.tracks.length} track
                {playlist.tracks.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Menu button */}
        {editingPlaylistId !== playlist.id && (
          <TouchableOpacity
  onPress={(e) => {
    e.stopPropagation(); // 🔥 ADD THIS LINE

    setTrackMenuOpen(
      trackMenuOpen === `playlist_${playlist.id}`
        ? null
        : `playlist_${playlist.id}`
    );
  }}
  style={styles.moreBtn}
>
  <Text style={styles.moreBtnText}>⋮</Text>
</TouchableOpacity>

        )}

        {/* Dropdown Arrow */}
        <Text style={styles.dropdownIcon}>
          {expandedPlaylists[playlist.id] ? "⌃" : "⌄"}
        </Text>
      </TouchableOpacity>


                  {expandedPlaylists[playlist.id] && (
  playlist.tracks.length === 0 ? (
    <Text style={styles.emptyPlaylistCompact}>No tracks</Text>
  ) : (
    playlist.tracks.map((track, idx) => {
      const isCurrent = currentTrack && currentTrack.id === track.id;

      return (
        <TouchableOpacity
          key={track.id}
          style={[styles.playlistTrackRow, isCurrent && styles.trackRowActive]}
          onPress={() => {
            setQueue(playlist.tracks);
            setQueueIndex(-1);
            setTimeout(() => playTrackAtIndex(idx), 0);
          }}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.trackTitle}>{track.title}</Text>
            <Text style={styles.trackMood}>{track.mood}</Text>
          </View>

          {/* Premium Remove Button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              removeFromPlaylist(playlist.id, track.id);
            }}
            style={styles.removeBtnMinimal}
          >
            <Text style={styles.removeIcon}>−</Text>
          </TouchableOpacity>

          <Text style={styles.playIcon}>▶</Text>
        </TouchableOpacity>
      );
    })
  )
)}

                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  };

// 3. FAVORITES SCREEN
  const renderFavorites = () => (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, screen === "discover" && styles.tabActive]}
          onPress={() => {
            setScreen("discover");
            setSelectedGenre(null);
          }}
        >
          <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "tracks" && styles.tabActive]}
          onPress={() => setScreen("tracks")}
        >
          <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>
            Music
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "playlists" && styles.tabActive]}
          onPress={() => setScreen("playlists")}
        >
          <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>
            Playlists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, screen === "favorites" && styles.tabActive]}
          onPress={() => setScreen("favorites")}
        >
          <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40, paddingHorizontal: 16, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Favorite Tracks</Text>

        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the ⋮ menu on any track and add it to favorites
            </Text>
          </View>
        ) : (
          favorites.map((track) => {
            const isCurrent = currentTrack && currentTrack.id === track.id;

            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.premiumTrackRow, isCurrent && styles.trackRowActive]}
                onPress={() => onSelectSingleTrack(track)}
                activeOpacity={0.85}
              >
                <View style={styles.trackIconCircle}>
                  <Text style={styles.trackIconText}>♫</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackMood}>{track.mood}</Text>
                  <Text style={styles.trackGenre}>{track.genre}</Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(track);
                  }}
                  style={styles.favoriteBtn}
                >
                  <Text style={[styles.favoriteBtnText, { color: "#FF6B6B" }]}>♥</Text>
                </TouchableOpacity>

                <Text style={styles.playIcon}>▶</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

// 4. DISCOVER TAB 
const renderRecent = () => {
  // Show the browse list of all recommended playlists
  if (selectedPlaylist === "browse") {
    return (
      <View style={{ flex: 1 }}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, screen === "discover" && styles.tabActive]}
            onPress={() => { setScreen("discover"); setSelectedGenre(null); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "tracks" && styles.tabActive]}
            onPress={() => { setScreen("tracks"); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>Music</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "playlists" && styles.tabActive]}
            onPress={() => { setScreen("playlists"); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "favorites" && styles.tabActive]}
            onPress={() => setScreen("favorites")}
          >
            <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>Favorites</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistDetailSimpleHeader}>
          <TouchableOpacity onPress={() => setSelectedPlaylist(null)}>
            <Text style={styles.playlistDetailBackBtn}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.browsePlaylistsHeading}>Recommended Playlists</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {curatedPlaylists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={styles.playlistListCard}
              onPress={() => setSelectedPlaylist(playlist)}
              activeOpacity={0.85}
            >
              <View style={styles.playlistListIcon}>
                <Text style={styles.playlistListIconText}>♫</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playlistListName}>{playlist.name}</Text>
                <Text style={styles.playlistListDescription}>{playlist.description}</Text>
                <Text style={styles.playlistListCount}>{playlist.tracks.length} tracks</Text>
              </View>
              <Text style={styles.playlistListChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // If a specific playlist is selected, show its detail view
  if (selectedPlaylist && selectedPlaylist !== "browse") {
    return (
      <View style={{ flex: 1 }}>
        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, screen === "discover" && styles.tabActive]}
            onPress={() => { setScreen("discover"); setSelectedGenre(null); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "tracks" && styles.tabActive]}
            onPress={() => { setScreen("tracks"); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>Music</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "playlists" && styles.tabActive]}
            onPress={() => { setScreen("playlists"); setSelectedPlaylist(null); }}
          >
            <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>Playlists</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, screen === "favorites" && styles.tabActive]}
            onPress={() => setScreen("favorites")}
          >
            <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>Favorites</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playlistDetailSimpleHeader}>
          <TouchableOpacity onPress={() => setSelectedPlaylist("browse")}>
            <Text style={styles.playlistDetailBackBtn}>‹</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.playlistCoverSection}>
            <View style={styles.playlistCoverImage}>
              <Text style={styles.playlistCoverIcon}>♫</Text>
            </View>
            <Text style={styles.playlistCoverTitle}>
  {selectedPlaylist.name}
</Text>

<Text style={styles.playlistCoverCount}>
  {selectedPlaylist.tracks.length} songs
</Text>
            <Text style={styles.playlistCoverDescription}>{selectedPlaylist.description}</Text>
            <Text style={styles.playlistCoverCount}>{selectedPlaylist.tracks.length} tracks</Text>
          </View>

          <View style={styles.playlistTracksContainer}>
            {selectedPlaylist.tracks.map((track, idx) => {
              const isCurrent = currentTrack && currentTrack.id === track.id;
              return (
                <View key={track.id}>
                  <TouchableOpacity
                    style={[styles.premiumTrackRow, isCurrent && styles.trackRowActive]}
                    onPress={() => {
                      setQueue(selectedPlaylist.tracks);
                      setQueueIndex(-1);
                      setTimeout(() => playTrackAtIndex(idx), 0);
                    }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.trackIconCircle}>
                      <Text style={styles.trackIconText}>♫</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      <Text style={styles.trackMood}>{track.mood}</Text>
                      <Text style={styles.trackGenre}>{track.genre}</Text>
                    </View>
                    {isFavorite(track.id) && (
                      <Text style={styles.favoritedHeartIndicator}>♥</Text>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setTrackMenuOpen(trackMenuOpen === track.id ? null : track.id);
                      }}
                      style={styles.moreBtn}
                    >
                      <Text style={styles.moreBtnText}>⋮</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {trackMenuOpen === track.id && (
                    <View style={styles.trackMenu}>
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => toggleFavorite(track)}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isFavorite(track.id) ? "♥" : "♡"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isFavorite(track.id) ? "Remove from Favorites" : "Add to Favorites"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleDownload(track);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isDownloaded(track.id) ? "✓" : "↓"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isDownloaded(track.id) ? "Downloaded" : "Download"}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.trackMenuDivider} />
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => {
                          setShowPlaylistSelector(track.id);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>+</Text>
                        <Text style={styles.trackMenuText}>Add to Playlist</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {renderPlaylistSelector(track.id)}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Default Discover view
  return (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, screen === "discover" && styles.tabActive]}
          onPress={() => { setScreen("discover"); setSelectedGenre(null); setSelectedPlaylist(null); }}
        >
          <Text style={[styles.tabText, screen === "discover" && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, screen === "tracks" && styles.tabActive]}
          onPress={() => { setScreen("tracks"); setSelectedPlaylist(null); }}
        >
          <Text style={[styles.tabText, screen === "tracks" && styles.tabTextActive]}>Music</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, screen === "playlists" && styles.tabActive]}
          onPress={() => { setScreen("playlists"); setSelectedPlaylist(null); }}
        >
          <Text style={[styles.tabText, screen === "playlists" && styles.tabTextActive]}>Playlists</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, screen === "favorites" && styles.tabActive]}
          onPress={() => setScreen("favorites")}
        >
          <Text style={[styles.tabText, screen === "favorites" && styles.tabTextActive]}>Favorites</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: currentTrack ? 200 : 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* RECENTLY PLAYED SECTION */}
        <View style={styles.discoverSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>

          {recentlyPlayed.length === 0 ? (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyTextSmall}>No recently played tracks yet</Text>
              <Text style={styles.emptySubtextSmall}>Start playing to see your history</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recentlyPlayed.slice(0, 10).map((track) => {
                const isCurrent = currentTrack && currentTrack.id === track.id;
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.discoverCard, isCurrent && styles.discoverCardActive]}
                    onPress={() => onSelectSingleTrack(track)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.discoverCardIcon}>
                      <Text style={styles.discoverCardIconText}>♫</Text>
                    </View>
                    <Text style={styles.discoverCardTitle} numberOfLines={2}>{track.title}</Text>
                    <Text style={styles.discoverCardMood} numberOfLines={1}>{track.mood}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* FOR YOU SECTION */}
        {suggestedTracks.length > 0 && (
          <View style={styles.discoverSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>For You</Text>
              <TouchableOpacity onPress={() => setSuggestedTracks([])}>
                <Text style={styles.clearSuggestions}>Clear</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>Based on your listening</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {suggestedTracks.map((track) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.discoverCard}
                  onPress={() => onSelectSingleTrack(track)}
                  activeOpacity={0.85}
                >
                  <View style={styles.discoverCardIcon}>
                    <Text style={styles.discoverCardIconText}>♫</Text>
                  </View>
                  <Text style={styles.discoverCardTitle} numberOfLines={2}>{track.title}</Text>
                  <Text style={styles.discoverCardMood} numberOfLines={1}>{track.mood}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* RECOMMENDED PLAYLISTS SECTION */}
        <View style={styles.discoverSection}>
          <TouchableOpacity
            style={styles.recommendedPlaylistsRow}
            onPress={() => setSelectedPlaylist("browse")}
            activeOpacity={0.85}
          >
            <View style={styles.recommendedPlaylistsIcon}>
              <Text style={styles.recommendedPlaylistsIconText}>♫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.recommendedPlaylistsTitle}>Recommended Playlists</Text>
              <Text style={styles.recommendedPlaylistsSubtitle}>Curated for your goals</Text>
            </View>
            <Text style={styles.recommendedPlaylistsChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* DAILY MIXES SECTION */}
        <View style={styles.discoverSection}>
          <Text style={styles.sectionTitle}>Daily Mixes</Text>
          <View style={styles.dailyMixesGrid}>
            <TouchableOpacity
              style={styles.dailyMixCard}
              onPress={() => {
                const morningTracks = allTracks.filter(t =>
                  t.genre === "Focus" || t.genre === "Classical"
                ).slice(0, 8);
                setQueue(morningTracks);
                setQueueIndex(-1);
                setTimeout(() => playTrackAtIndex(0), 0);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyMixGradient, { backgroundColor: '#FF6B9D' }]}>
                <Text style={styles.dailyMixEmoji}>☀️</Text>
              </View>
              <Text style={styles.dailyMixTitle}>Morning</Text>
              <Text style={styles.dailyMixSubtitle}>Start your day right</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dailyMixCard}
              onPress={() => {
                const focusTracks = allTracks.filter(t =>
                  t.genre === "Focus" || t.genre === "Work" || t.genre === "Study"
                ).slice(0, 8);
                setQueue(focusTracks);
                setQueueIndex(-1);
                setTimeout(() => playTrackAtIndex(0), 0);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyMixGradient, { backgroundColor: '#6B8CFF' }]}>
                <Text style={styles.dailyMixEmoji}>🎯</Text>
              </View>
              <Text style={styles.dailyMixTitle}>Focus</Text>
              <Text style={styles.dailyMixSubtitle}>Deep work mode</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dailyMixCard}
              onPress={() => {
                const eveningTracks = allTracks.filter(t =>
                  t.genre === "Sleep" || t.mood.includes("Calm")
                ).slice(0, 8);
                setQueue(eveningTracks);
                setQueueIndex(-1);
                setTimeout(() => playTrackAtIndex(0), 0);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyMixGradient, { backgroundColor: '#9D6BFF' }]}>
                <Text style={styles.dailyMixEmoji}>🌙</Text>
              </View>
              <Text style={styles.dailyMixTitle}>Evening</Text>
              <Text style={styles.dailyMixSubtitle}>Wind down</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dailyMixCard}
              onPress={() => {
                const energyTracks = allTracks.filter(t =>
                  t.genre === "Run" || t.mood.includes("Energy")
                ).slice(0, 8);
                setQueue(energyTracks);
                setQueueIndex(-1);
                setTimeout(() => playTrackAtIndex(0), 0);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.dailyMixGradient, { backgroundColor: '#FF9D6B' }]}>
                <Text style={styles.dailyMixEmoji}>⚡</Text>
              </View>
              <Text style={styles.dailyMixTitle}>Energy</Text>
              <Text style={styles.dailyMixSubtitle}>Get moving</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TRENDING SECTION */}
        <View style={styles.discoverSection}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <Text style={styles.sectionSubtitle}>Popular tracks right now</Text>
          <View style={styles.trendingList}>
            {allTracks.slice(0, 5).map((track, index) => {
              const isCurrent = currentTrack && currentTrack.id === track.id;
              return (
                <View key={track.id}>
                  <TouchableOpacity
                    style={[styles.trendingRow, isCurrent && styles.trackRowActive]}
                    onPress={() => onSelectSingleTrack(track)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.trendingRank}>
                      <Text style={styles.trendingRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.trackIconCircle}>
                      <Text style={styles.trackIconText}>♫</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      <Text style={styles.trackMood}>{track.mood}</Text>
                      <Text style={styles.trackGenre}>{track.genre}</Text>
                    </View>
                    {isFavorite(track.id) && (
                      <Text style={styles.favoritedHeartIndicator}>♥</Text>
                    )}
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setTrackMenuOpen(trackMenuOpen === track.id ? null : track.id);
                      }}
                      style={styles.moreBtn}
                    >
                      <Text style={styles.moreBtnText}>⋮</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {trackMenuOpen === track.id && (
                    <View style={styles.trackMenu}>
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => toggleFavorite(track)}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isFavorite(track.id) ? "♥" : "♡"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isFavorite(track.id) ? "Remove from Favorites" : "Add to Favorites"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleDownload(track);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>
                          {isDownloaded(track.id) ? "✓" : "↓"}
                        </Text>
                        <Text style={styles.trackMenuText}>
                          {isDownloaded(track.id) ? "Downloaded" : "Download"}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.trackMenuDivider} />
                      <TouchableOpacity
                        style={styles.trackMenuItem}
                        onPress={() => {
                          setShowPlaylistSelector(track.id);
                          setTrackMenuOpen(null);
                        }}
                      >
                        <Text style={styles.trackMenuIcon}>+</Text>
                        <Text style={styles.trackMenuText}>Add to Playlist</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {renderPlaylistSelector(track.id)}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

  // 5. VISUALS SCREEN (Expanded mini player)
  const renderVisuals = () => (
    <View style={{ flex: 1 }}>
      {/* Fullscreen video */}
      <Video
        source={visualsVideo}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        shouldPlay
        isLooping
        isMuted
      />

      <View style={styles.fullscreenOverlay} />

      {/* Header */}
      <View style={styles.visualHeader}>
        <TouchableOpacity onPress={() => setMiniPlayerExpanded(false)}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.visualTitle}>Now Playing</Text>
      </View>

      {/* Track info overlay */}
      {currentTrack && (
        <View style={styles.fullscreenTrackOverlay}>
          <Text style={styles.visualTrack}>{currentTrack.title}</Text>
          <Text style={styles.visualMood}>{currentTrack.mood}</Text>
          {currentTrack.genre && (
            <Text style={styles.visualHint}>{currentTrack.genre}</Text>
          )}
        </View>
      )}
    </View>
  );

  // ---------- MAIN RENDER ----------
  return (
    <LinearGradient colors={["#070B16", "#0B1C3D", "#070B16"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Top header (only show when NOT in visuals/expanded mode) */}
        {!miniPlayerExpanded && (
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Sound Library</Text>
          </View>
        )}

{/* Content based on current screen */}
        {miniPlayerExpanded
          ? renderVisuals()
          : screen === "tracks"
          ? renderTracks()
          : screen === "playlists"
          ? renderPlaylists()
          : screen === "favorites"
          ? renderFavorites()
          : renderRecent()}

        {/* MINI PLAYER (only shows when track is playing) */}
{currentTrack && !miniPlayerExpanded && (
  <View style={styles.miniPlayerWrap} pointerEvents="box-none">

    {/* 🔥 MAIN PLAYER */}
    <View style={styles.miniPlayer}>
      
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMiniPlayerExpanded(true)}
        style={styles.miniTopRow}
      >
        {/* Track Info */}
        <View style={{ flex: 1 }}>
          <Text style={styles.nowPlaying} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.subPlaying} numberOfLines={1}>
            {currentTrack.mood}
          </Text>
        </View>

        {/* Timer */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            setTimerModalOpen(true);
          }}
          style={styles.timerBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.timerBtnText}>⏱</Text>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.miniControls}>
          <TouchableOpacity onPress={playPrev}>
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlay}
            style={styles.playMiniBtn}
            disabled={!currentTrack}
          >
            <Text style={styles.playMini}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext}>
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* 🔥 TIME ROW (SMALL + CLEAN) */}
      <View style={styles.progressSection}>

  {/* Left Time */}
  <Text style={styles.timeTextMini}>
    {formatTime(positionMs)}
  </Text>

  {/* 🔥 Progress Bar */}
  <Pressable
    style={styles.progressBarMini}
    onPress={onProgressBarPress}
    onLayout={(e) => {
      progressBarWidthRef.current = e.nativeEvent.layout.width || 1;
    }}
  >
    <View style={styles.progressTrackMini}>
      <View
        style={[
          styles.progressFillMini,
          { width: `${Math.min(100, progress * 100)}%` },
        ]}
      />
    </View>
  </Pressable>

  {/* Right Time */}
  <Text style={styles.timeTextMini}>
    -{formatTime(remainingMs)}
  </Text>

</View>


      {/* Sleep Timer */}
      {sleepTimerEndsAt && (
        <View style={styles.sleepRowMini}>
          <Text style={styles.sleepText}>
            Ends in {formatTime(Math.max(0, sleepTimerEndsAt - Date.now()))}
          </Text>
          <TouchableOpacity onPress={clearSleepTimer}>
            <Text style={styles.sleepCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
)}


        {/* TIMER MODAL */}
        <Modal transparent visible={timerModalOpen} animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setTimerModalOpen(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>Set Sleep Timer</Text>

              <View style={styles.quickRow}>
                {[5, 10, 15, 30, 60].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.quickBtn}
                    onPress={async () => {
                      setTimerMinutes(String(m));
                      await startSleepTimer(String(m));
                      setTimerModalOpen(false);
                    }}
                  >
                    <Text style={styles.quickBtnText}>{m}m</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Custom (minutes)</Text>
              <TextInput
                value={timerMinutes}
                onChangeText={setTimerMinutes}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.modalInput}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSecondary]}
                  onPress={() => {
                    clearSleepTimer();
                    setTimerModalOpen(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalPrimary]}
                  onPress={async () => {
                    await startSleepTimer(timerMinutes);
                    setTimerModalOpen(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Start</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  back: { color: "#fff", fontSize: 22, marginRight: 12 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#6B8CFF",
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },

  // Track styles (shared)
  trackRowActive: {
    backgroundColor: "rgba(107,140,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.30)",
  },
  trackTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  trackMood: {
    color: "#9AAEFF",
    marginTop: 2,
    fontSize: 12,
  },
  playIcon: {
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
    fontSize: 12,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyStateSmall: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyTextSmall: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtextSmall: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
  },

  // Empty playlist compact (replaces the tall empty state in list view)
  emptyPlaylistCompact: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontStyle: "italic",
  },

  // Visuals (fullscreen)
  visualHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  visualTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  fullscreenTrackOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 200,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  visualTrack: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  visualMood: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 13,
  },
  visualHint: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 6,
    fontSize: 12,
  },

  // Mini player
miniPlayerWrap: {
  position: "absolute",
  left: 16,
  right: 16,
  bottom: 14,
},

/* ❌ REMOVE miniProgressBar, miniProgressTrack, miniProgressFill (no longer needed) */

/* 🔥 MAIN PLAYER */
miniPlayer: {
  backgroundColor: "rgba(15,25,50,0.92)",
  borderRadius: 18,
  paddingVertical: 10,
  paddingHorizontal: 14,

  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.06)",
},

miniTopRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

/* 🔥 TEXT */
nowPlaying: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 14,
},

subPlaying: {
  color: "rgba(255,255,255,0.6)",
  fontSize: 11,
  marginTop: 2,
},

/* 🔥 TIMER BUTTON */
timerBtn: {
  width: 34,
  height: 34,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.08)",
},

timerBtnText: {
  color: "#fff",
  fontSize: 14,
},

/* 🔥 CONTROLS */
miniControls: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

controlIcon: {
  color: "rgba(255,255,255,0.85)",
  fontSize: 14,
},

playMiniBtn: {
  width: 34,
  height: 34,
  borderRadius: 17,
  backgroundColor: "#4F46E5",
  alignItems: "center",
  justifyContent: "center",
},

playMini: {
  color: "#fff",
  fontSize: 14,
  fontWeight: "700",
},

/* 🔥 PROGRESS SECTION (INSIDE PLAYER) */
progressSection: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 8,
},

progressBarMini: {
  flex: 1,
  marginHorizontal: 8,
},

progressTrackMini: {
  height: 3,
  borderRadius: 2,
  backgroundColor: "rgba(255,255,255,0.15)",
  overflow: "hidden",
},

progressFillMini: {
  height: "100%",
  backgroundColor: "#7FE7F2",
},

/* 🔥 TIME TEXT */
timeTextMini: {
  color: "rgba(255,255,255,0.5)",
  fontSize: 10,
},

/* 🔥 Sleep row */
sleepRowMini: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
},

sleepText: {
  color: "rgba(255,255,255,0.65)",
  fontSize: 10,
},

sleepCancel: {
  color: "#7FE7F2",
  fontSize: 10,
  fontWeight: "700",
},


  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: "rgba(15,25,50,0.98)",
    padding: 18,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
  },
  modalLabel: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 16,
    fontSize: 12,
  },
  modalInput: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "700",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  quickBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  quickBtnText: {
    color: "#fff",
    fontWeight: "900",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
  },
  modalPrimary: {
    backgroundColor: "rgba(107,140,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.35)",
  },
  modalSecondary: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalActionText: {
    color: "#fff",
    fontWeight: "900",
  },

  // Search Row with Filter Button
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "rgba(255,255,255,0.6)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  searchClear: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 18,
    paddingLeft: 8,
  },

  // Filter Button
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(107,140,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonIcon: {
    fontSize: 20,
    color: "#6B8CFF",
    fontWeight: "700",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B9D",
  },

  // Genre Filter Modal
  genreFilterModal: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 20,
    backgroundColor: "rgba(15,25,50,0.98)",
    padding: 20,
  },
  genreFilterTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },
  genreFilterScroll: {
    maxHeight: 400,
  },
  genreFilterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  genreFilterOptionActive: {
    backgroundColor: "rgba(107,140,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.25)",
  },
  genreFilterOptionText: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  genreFilterCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
  },
  genreFilterCheck: {
    color: "#6B8CFF",
    fontSize: 18,
    fontWeight: "900",
  },

  // Section Title
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },

  // Back to genres
  backToGenres: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  backToGenresText: {
    color: "#6B8CFF",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  selectedGenreTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  // Tracks Section
  tracksSection: {
    paddingHorizontal: 16,
  },

  // Premium Track Row
  premiumTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 10,
  },
  trackIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trackIconText: {
    fontSize: 24,
    color: "#6B8CFF",
  },
  trackGenre: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },

  // More button
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  moreBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  // Track Menu
  trackMenu: {
    marginTop: -6,
    marginBottom: 10,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(15,25,50,0.98)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.2)",
  },
  trackMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  trackMenuIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    color: "#fff",
  },
  trackMenuText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  trackMenuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
  },

  // Playlist Header Row (title + inline buttons)
  playlistHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  playlistToolbarInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Playlist Toolbar (kept for any other usages)

  playlistToolbarBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(107,140,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  playlistToolbarIcon: {
    fontSize: 20,
    color: "#6B8CFF",
    fontWeight: "700",
  },

  // Playlist Modal
  playlistModal: {
    width: "85%",
    maxWidth: 350,
    borderRadius: 20,
    backgroundColor: "rgba(15,25,50,0.98)",
    padding: 20,
  },
  playlistModalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 16,
  },
  playlistModalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  playlistModalOptionActive: {
    backgroundColor: "rgba(107,140,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.25)",
  },
  playlistModalOptionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  // Playlist Grid
  playlistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  playlistGridCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.15)",
  },
  playlistGridImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  playlistGridImageIcon: {
    fontSize: 40,
    color: "#6B8CFF",
  },
  playlistGridName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
    minHeight: 36,
  },
  playlistGridCount: {
    color: "#9AAEFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Playlist Card
  playlistCard: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    marginBottom: 12,
  },
  playlistHeaderWithImage: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  playlistImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  playlistImageIcon: {
    fontSize: 28,
    color: "#6B8CFF",
  },
  playlistName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  playlistTrackCount: {
    color: "#9AAEFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Empty Playlist (removed tall version, replaced with compact)

  // Playlist Track Row
  playlistTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginTop: 8,
  },

  // Remove button
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,80,80,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeBtnText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "900",
  },

  // Favorite button
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  favoriteBtnText: {
    fontSize: 18,
    color: "#FF6B6B",
  },

  // Editing playlist
  editingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(107,140,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#6B8CFF",
    fontSize: 16,
    fontWeight: "900",
  },
  cancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,80,80,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "900",
  },

  // Add tracks screen
  addTracksHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  addTracksTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  trackInPlaylist: {
    opacity: 0.5,
  },
  alreadyAddedText: {
    color: "#6B8CFF",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
  },
  addTrackIcon: {
    color: "#6B8CFF",
    fontSize: 24,
    fontWeight: "700",
    marginRight: 8,
  },

  // Playlist selector
  playlistSelector: {
    marginTop: 8,
    marginBottom: 10,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(15,25,50,0.98)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.2)",
  },
  playlistSelectorTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  playlistSelectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  playlistSelectorItemDisabled: {
    opacity: 0.5,
  },
  playlistSelectorIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    color: "#6B8CFF",
  },
  playlistSelectorText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  playlistSelectorBadge: {
    color: "#6B8CFF",
    fontSize: 12,
    fontWeight: "700",
  },
  playlistSelectorCancel: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  playlistSelectorCancelText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  clearSuggestions: {
    color: "#6B8CFF",
    fontSize: 13,
    fontWeight: "700",
  },
  playlistMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Favorited heart indicator in Browse
  favoritedHeartIndicator: {
    fontSize: 16,
    color: "#FF6B6B",
    marginRight: 8,
  },

  // Playlist List View (for Recommended Playlists)
  playlistListCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.15)",
  },
  playlistListIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  playlistListIconText: {
    fontSize: 26,
    color: "#6B8CFF",
  },
  playlistListName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  playlistListDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  playlistListCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  playlistListChevron: {
    color: "#6B8CFF",
    fontSize: 24,
    fontWeight: "400",
    marginLeft: 8,
  },

  // Playlist Detail View - Simple Header
  playlistDetailSimpleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  playlistDetailBackBtn: {
    color: "#6B8CFF",
    fontSize: 36,
    fontWeight: "300",
  },

  // Playlist Cover Section
  playlistCoverSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  playlistCoverImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  playlistCoverIcon: {
    fontSize: 60,
    color: "rgba(255,255,255,0.3)",
  },
  playlistCoverTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  playlistCoverDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  playlistCoverCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Playlist Tracks Container
  playlistTracksContainer: {
    paddingHorizontal: 16,
  },

  // DISCOVER TAB STYLES
  discoverSection: {
  marginBottom: 24,
  paddingHorizontal: 16, // 👈 ensure alignment
},
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  discoverCard: {
    width: 140,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.15)",
  },
  discoverCardActive: {
    backgroundColor: "rgba(107,140,255,0.18)",
    borderColor: "rgba(107,140,255,0.30)",
  },
  discoverCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  discoverCardIconText: {
    fontSize: 24,
    color: "#6B8CFF",
  },
  discoverCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    height: 36,
  },
  discoverCardMood: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },

  // Daily Mixes
  dailyMixesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  dailyMixCard: {
    width: "48%",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.15)",
  },
  dailyMixGradient: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  dailyMixEmoji: {
    fontSize: 40,
  },
  dailyMixTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dailyMixSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  // Trending
  trendingList: {
    paddingHorizontal: 16,
  },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 10,
  },
  trendingRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(107,140,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trendingRankText: {
    color: "#6B8CFF",
    fontSize: 14,
    fontWeight: "900",
  },

  // Search container with flex (for use inside searchRow alongside filter button)
  searchContainerFlex: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // Recommended playlists collapsed row in Discover
  recommendedPlaylistsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(107,140,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(107,140,255,0.22)",
  },
  recommendedPlaylistsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  recommendedPlaylistsIconText: {
    fontSize: 22,
    color: "#6B8CFF",
  },
  recommendedPlaylistsTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  recommendedPlaylistsSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
  },
  recommendedPlaylistsChevron: {
    color: "#6B8CFF",
    fontSize: 28,
    fontWeight: "300",
    marginLeft: 8,
  },

  // Browse playlists heading (in the list screen header)
  browsePlaylistsHeading: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 8,
  },
  
  playlistCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  playlistHeaderWithImage: {
    flexDirection: "row",
    alignItems: "center",
  },

  playlistImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(107,140,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  playlistImageIcon: {
    color: "#6B8CFF",
    fontSize: 20,
  },

  playlistName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  playlistTrackCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },

  dropdownIcon: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginLeft: 6,
  },

  playlistTrackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  removeBtnMinimal: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  removeIcon: {
    color: "#bbb",
    fontSize: 14,
    fontWeight: "600",
  },

});