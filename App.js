import { Audio } from "expo-av";
import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Animated,
  TextInput,
  Platform,
  FlatList,
  Modal,
  useWindowDimensions,
  PanResponder,

} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Video } from "expo-av";

import SoundLibraryScreen from "./Screens/SoundLibraryScreen";
import OnboardingScreen from "./Screens/OnboardingScreen";
import BreathingScreen from './Screens/BreathingLibraryScreen';


const RELAX_VIDEO = require("./assets/Video/SoundLibraryVideo1.mp4");
const GENTLE_RAIN = require("./assets/Audio/Gentle_rain_audio.mp3");

const SOUND_CATEGORIES = [
  {
    id: "nature",
    title: "Nature",
    subtitle: "Rain • Forest • Ocean",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    accent: "rgba(79,70,229,0.85)",
    tracks: [
      {
        id: "nature-gentle-rain",
        title: "Gentle Rain",
        mood: "Relax • Sleep",
        image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
        audio: GENTLE_RAIN, // ✅ your local file
        colors: ["#6EA8FF", "#3C6FD8"],
      },
      {
        id: "nature-ocean-waves",
        title: "Ocean Waves",
        mood: "Calm • Grounding",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        colors: ["#5DD6C1", "#2BAAA3"],
      },
      {
        id: "nature-forest",
        title: "Forest Ambience",
        mood: "Focus • Peace",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        colors: ["#7CCF82", "#3F9F5C"],
      },
    ],
  },

  {
    id: "frequencies",
    title: "Relaxing Frequencies",
    subtitle: "Alpha • Theta • Sleep",
    image: "https://images.unsplash.com/photo-1520694478161-2c3f7a0d820b",
    accent: "rgba(34,197,94,0.85)",
    tracks: [
      {
        id: "freq-alpha",
        title: "Alpha Flow",
        mood: "Focus • Clarity",
        image: "https://images.unsplash.com/photo-1520694478161-2c3f7a0d820b",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        colors: ["#A7F3D0", "#34D399"],
      },
      {
        id: "freq-theta",
        title: "Theta Drift",
        mood: "Relax • Unwind",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
        colors: ["#C4B5FD", "#7C3AED"],
      },
      {
        id: "freq-sleep",
        title: "Deep Sleep Tone",
        mood: "Sleep • Recovery",
        image: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
        colors: ["#93C5FD", "#2563EB"],
      },
    ],
  },
  {
  id: "lofi",
  title: "Lo-fi",
  subtitle: "Chill • Focus • Beats",
  image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
  tracks: [
    { id: "lofi-1", title: "Late Night Lo-fi", mood: "Chill", audio: null },
    { id: "lofi-2", title: "Study Beats", mood: "Focus", audio: null },
  ],
},
{
  id: "classical",
  title: "Classical",
  subtitle: "Calm • Piano • Strings",
  image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
  tracks: [
    { id: "classical-1", title: "Soft Piano", mood: "Relax", audio: null },
    { id: "classical-2", title: "String Quartet", mood: "Focus", audio: null },
  ],
},

  {
    id: "ambient",
    title: "Ambient Focus",
    subtitle: "Lo-fi • Soft pads • Work",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
    accent: "rgba(244,63,94,0.80)",
    tracks: [
      {
        id: "amb-soft-pads",
        title: "Soft Pads",
        mood: "Calm • Study",
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
        colors: ["#FBCFE8", "#FB7185"],
      },
      {
        id: "amb-night-ride",
        title: "Night Ride",
        mood: "Focus • Flow",
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
        colors: ["#A5B4FC", "#6366F1"],
      },
      {
        id: "amb-breathe",
        title: "Breathe (Ambient)",
        mood: "Relax • Reset",
        image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
        colors: ["#99F6E4", "#14B8A6"],
      },
    ],
  },
];

// ✅ Flatten helper (player queue uses a simple list)
const ALL_TRACKS = SOUND_CATEGORIES.flatMap((c) => c.tracks);

// ✅ Handles both local require(...) and remote URL strings
const audioSource = (a) => (typeof a === "number" ? a : { uri: a });


// Reusable mini music player component
function MiniMusicPlayer({ currentTrack, isPlaying, onPlayPause, onNext, onPrev }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.45)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
      }}
    >
      {/* Album art */}
      <Image
        source={{ uri: currentTrack.image }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          marginRight: 12,
        }}
      />

      {/* Track info */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0B1220" }}>
          {currentTrack.title}
        </Text>
        <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
          {currentTrack.mood}
        </Text>
      </View>

      {/* Controls */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={onPrev}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.55)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 14 }}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPlayPause}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "#4F46E5",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 14, color: "#fff" }}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14 }}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("onboarding"); // "onboarding" | "home" | ...
  const [savedFavorites, setSavedFavorites] = useState([]); // Store favorites

  // Screens where bottom nav should be hidden (during activities)
  const hideNavScreens = [
    'breathing', 'soundLibrary', 'visualizations',
    'memory', 'focus', 'mindSwitch', 'reaction',
    'onboarding'
  ];

  const shouldShowBottomNav = !hideNavScreens.includes(screen);

  const handleRemoveFavorite = (index) => {
    setSavedFavorites(prev => prev.filter((_, i) => i !== index));
  };

  const renderScreen = () => {
    if (screen === "onboarding") {
      return <OnboardingScreen onFinish={() => setScreen("home")} />;
    }

    if (screen === "home") {
      return (
        <HomeScreen
          goToCalmSelect={() => setScreen("calmSelect")}
          goToWorkout={() => setScreen("workout")}
          goToJournal={() => setScreen("journal")}
        />
      );
    }

    if (screen === "favorites") {
      return (
        <FavoritesScreen
          goHome={() => setScreen("home")}
          savedFavorites={savedFavorites}
          onRemoveFavorite={handleRemoveFavorite}
        />
      );
    }

    if (screen === "profile") {
      return (
        <ProfileScreen
          goHome={() => setScreen("home")}
        />
      );
    }

    if (screen === "calmSelect") {
      return (
        <CalmSelectScreen
          goHome={() => setScreen("home")}
          goToSleepLibrary={() => setScreen("sleepLibrary")}
          goToBreathing={() => setScreen("breathing")}
          goToSoundLibrary={() => setScreen("soundLibrary")}
        />
      );
    }

    if (screen === "sleepLibrary") {
      return (
        <SleepLibraryScreen
          goHome={() => setScreen("home")}
          goBack={() => setScreen("calmSelect")}
          goToVisualizations={() => setScreen("visualizations")}
        />
      );
    }

    if (screen === "visualizations") {
      return (
        <VisualizationsScreen
          goHome={() => setScreen("home")}
          goBack={() => setScreen("sleepLibrary")}
        />
      );
    }

    if (screen === "breathing") {
      return (
        <BreathingScreen
          goHome={() => setScreen("home")}
          goToCalmSelect={() => setScreen("calmSelect")}
        />
      );
    }

    if (screen === "soundLibrary") {
  return (
    <SoundLibraryScreen
      goBack={() => setScreen("calmSelect")}
    />
  );
}


    if (screen === "workout") {
      return (
        <WorkoutMenuScreen
          goHome={() => setScreen("home")}
          goToMemory={() => setScreen("memory")}
          goToFocus={() => setScreen("focus")}
          goToMindSwitch={() => setScreen("mindSwitch")}
          goToReaction={() => setScreen("reaction")}
        />
      );
    }

    if (screen === "memory") {
      return (
        <MemoryExerciseScreen
          goHome={() => setScreen("home")}
          goToCalmSelect={() => setScreen("calmSelect")}
        />
      );
    }

    if (screen === "focus") {
      return (
        <FocusGameScreen
          goHome={() => setScreen("home")}
          goToCalmSelect={() => setScreen("calmSelect")}
        />
      );
    }

    if (screen === "mindSwitch") {
      return (
        <MindSwitchGameScreen
          goHome={() => setScreen("home")}
          goToCalmSelect={() => setScreen("calmSelect")}
        />
      );
    }

    if (screen === "reaction") {
      return (
        <ReactionJourneyGameScreen
          goHome={() => setScreen("home")}
          goToCalmSelect={() => setScreen("calmSelect")}
        />
      );
    }

    if (screen === "journal") {
      return (
        <JournalScreen
          goHome={() => setScreen("home")}
          goToBreathing={() => setScreen("breathing")}
          goToCalmSelect={() => setScreen("calmSelect")}
          goToSoundLibrary={() => setScreen("soundLibrary")}
          goToSleepLibrary={() => setScreen("sleepLibrary")}
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {renderScreen()}
        {shouldShowBottomNav && (
          <BottomNavBar
            currentScreen={screen}
            onNavigate={(newScreen) => setScreen(newScreen)}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

// --- Home Screen ---
function HomeScreen({ goToCalmSelect, goToWorkout, goToJournal }) {
  // Entrance animations (staggered)
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(14)).current;

  const card1Fade = useRef(new Animated.Value(0)).current;
  const card1Y = useRef(new Animated.Value(18)).current;

  const card2Fade = useRef(new Animated.Value(0)).current;
  const card2Y = useRef(new Animated.Value(18)).current;

  const card3Fade = useRef(new Animated.Value(0)).current;
  const card3Y = useRef(new Animated.Value(18)).current;

  const footerFade = useRef(new Animated.Value(0)).current;
  const footerY = useRef(new Animated.Value(10)).current;

  // Floating background aura
  const aura1 = useRef(new Animated.Value(0)).current;
  const aura2 = useRef(new Animated.Value(0)).current;

  // Button press feedback
  const workoutScale = useRef(new Animated.Value(1)).current;
  const calmScale = useRef(new Animated.Value(1)).current;
  const journalScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(headerY, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card1Fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(card1Y, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card2Fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(card2Y, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(card3Fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(card3Y, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(footerFade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(footerY, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
    ]).start();

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(aura1, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(aura1, { toValue: 0, duration: 4200, useNativeDriver: true }),
      ])
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(aura2, { toValue: 1, duration: 5200, useNativeDriver: true }),
        Animated.timing(aura2, { toValue: 0, duration: 5200, useNativeDriver: true }),
      ])
    );

    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [
    headerFade, headerY,
    card1Fade, card1Y,
    card2Fade, card2Y,
    card3Fade, card3Y,
    footerFade, footerY,
    aura1, aura2,
  ]);

  const pressIn = (scaleRef) => {
    Animated.spring(scaleRef, {
      toValue: 0.98,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = (scaleRef) => {
    Animated.spring(scaleRef, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const GRADIENT = ["#7FE7F2", "#A5B4FC", "#C084FC"];

  const aura1Translate = aura1.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const aura2Translate = aura2.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });

  return (
    <LinearGradient
      colors={GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Background layer (MUST NOT block taps) */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* moving aura blobs */}
          <Animated.View
            style={{
              position: "absolute",
              top: 80,
              left: -60,
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "rgba(255,255,255,0.22)",
              transform: [{ translateY: aura1Translate }],
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              bottom: 120,
              right: -80,
              width: 260,
              height: 260,
              borderRadius: 130,
              backgroundColor: "rgba(255,255,255,0.16)",
              transform: [{ translateY: aura2Translate }],
            }}
          />

          {/* subtle “logo in background” */}
          <Image
            source={require("./assets/manas-logo-premium.png")}
            resizeMode="contain"
            style={{
              position: "absolute",
              top: 110,
              alignSelf: "center",
              width: 520,
              height: 520,
              opacity: 0.09,
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 46,
          }}
        >
          {/* Header */}
          <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerY }] }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 32, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Manas
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)", lineHeight: 18 }}>
                  The Journey Within
                </Text>
              </View>

              {/* small logo instead of brain emoji */}
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "rgba(255,255,255,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={require("./assets/manas-logo-premium.png")}
                  resizeMode="contain"
                  style={{ width: 34, height: 34, opacity: 0.95 }}
                />
              </View>
            </View>

            {/* Today pill */}
            <View
              style={{
                marginTop: 16,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.55)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.32)",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.70)" }}>
                Today’s Plan
              </Text>

              <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(11,18,32,0.08)" }}>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#0B1220" }}>
                  5–10 min
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Card 1 */}
          <Animated.View style={{ marginTop: 16, opacity: card1Fade, transform: [{ translateY: card1Y }] }}>
            <View style={{ borderRadius: 24, padding: 16, backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.70)" }}>
                Mental Workout
              </Text>
              </View>

              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "900", color: "#0B1220" }}>
                Train Focus & Memory
              </Text>

              <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: "rgba(11,18,32,0.68)" }}>
                Quick games designed to sharpen attention, reaction, and cognitive flexibility.
              </Text>

              <Animated.View style={{ transform: [{ scale: workoutScale }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={goToWorkout}
                  onPressIn={() => pressIn(workoutScale)}
                  onPressOut={() => pressOut(workoutScale)}
                  style={{ marginTop: 14, paddingVertical: 13, borderRadius: 999, alignItems: "center", backgroundColor: "#4F46E5" }}
                >
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                    Open Workout
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Card 2 */}
          <Animated.View style={{ marginTop: 14, opacity: card2Fade, transform: [{ translateY: card2Y }] }}>
            <View style={{ borderRadius: 24, padding: 16, backgroundColor: "rgba(255,255,255,0.60)", borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.70)" }}>
                Reset & Recharge
              </Text>
              </View>

              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "900", color: "#0B1220" }}>
                Calm Mode
              </Text>

              <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: "rgba(11,18,32,0.68)" }}>
                Breathing, sleep journeys, or soundscapes — choose what your mind needs.
              </Text>

              <Animated.View style={{ transform: [{ scale: calmScale }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={goToCalmSelect}
                  onPressIn={() => pressIn(calmScale)}
                  onPressOut={() => pressOut(calmScale)}
                  style={{
                    marginTop: 14,
                    paddingVertical: 13,
                    borderRadius: 999,
                    alignItems: "center",
                    backgroundColor: "rgba(11,18,32,0.10)",
                    borderWidth: 1,
                    borderColor: "rgba(11,18,32,0.10)",
                  }}
                >
                  <Text style={{ color: "#0B1220", fontSize: 15, fontWeight: "900" }}>
                    Open Calm Mode
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* ✅ Card 3 (NEW) */}
          <Animated.View style={{ marginTop: 14, opacity: card3Fade, transform: [{ translateY: card3Y }] }}>
            <View style={{ borderRadius: 24, padding: 16, backgroundColor: "rgba(255,255,255,0.66)", borderWidth: 1, borderColor: "rgba(255,255,255,0.32)" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.70)" }}>
                Reflect & Track
              </Text>
              </View>

              <Text style={{ marginTop: 8, fontSize: 20, fontWeight: "900", color: "#0B1220" }}>
                Daily Reflection
              </Text>

              <Text style={{ marginTop: 6, fontSize: 14, lineHeight: 20, color: "rgba(11,18,32,0.68)" }}>
                A 60-second check-in to capture how you feel — and what you want tomorrow to look like.
              </Text>

              <Animated.View style={{ transform: [{ scale: journalScale }] }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={goToJournal}
                  onPressIn={() => pressIn(journalScale)}
                  onPressOut={() => pressOut(journalScale)}
                  style={{
                    marginTop: 14,
                    paddingVertical: 13,
                    borderRadius: 999,
                    alignItems: "center",
                    backgroundColor: "rgba(79,70,229,0.14)",
                    borderWidth: 1,
                    borderColor: "rgba(79,70,229,0.22)",
                  }}
                >
                  <Text style={{ color: "#4F46E5", fontSize: 15, fontWeight: "900" }}>
                    Open Reflection
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={{ marginTop: 18, opacity: footerFade, transform: [{ translateY: footerY }] }}>
            <View style={{ padding: 14, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" }}>
              <Text style={{ textAlign: "center", fontSize: 13, lineHeight: 18, color: "rgba(11,18,32,0.70)", fontWeight: "700" }}>
                One focused rep. One calm breath. One honest reflection.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function JournalScreen({ goHome, goToBreathing, goToCalmSelect, goToSoundLibrary, goToSleepLibrary }) {
 
  const [screen, setScreen] = useState("moodCheckIn"); // "moodCheckIn" | "moodResponse" | "journal"
  const [mood, setMood] = useState(null); // "great" | "good" | "okay" | "low" | "stressed"
  const [moodNote, setMoodNote] = useState("");
  const [reflection, setReflection] = useState("");
 
  // Prompt library and tags
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTags, setShowTags] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

 // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState(new Date());

  //Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [filterMood, setFilterMood] = useState(null);
 
  // Journal view states
  const [journalView, setJournalView] = useState("write"); // "write" | "entries" | "calendar" | "insights"
 
  const [selectedInsight, setSelectedInsight] = useState(null);
  
  // NEW: Entry detail view
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Mood-specific prompts for better personalization
  const getMoodPrompts = (currentMood) => {
    const moodPrompts = {
      great: [
        "What made today exceptional?",
        "What strength did you tap into today?",
        "How can you recreate this feeling tomorrow?",
        "What are you most proud of right now?",
      ],
      good: [
        "What went well today?",
        "What small win can you celebrate?",
        "What made you smile today?",
        "What progress did you make?",
      ],
      okay: [
        "What's one thing you're grateful for today?",
        "What would make tomorrow better?",
        "What do you need right now?",
        "What's one small step you can take?",
      ],
      low: [
        "What's weighing on you right now?",
        "What would help lighten this feeling?",
        "Who or what brings you comfort?",
        "What's one kind thing you can do for yourself?",
      ],
      stressed: [
        "What's the main source of stress right now?",
        "What's within your control?",
        "What can you let go of today?",
        "How can you be gentler with yourself?",
      ],
    };
    
    return moodPrompts[currentMood] || moodPrompts.okay;
  };

  const reflectionPrompts = mood ? getMoodPrompts(mood) : [];
 
  // Available tags
  const availableTags = [
    { id: "gratitude", label: "Gratitude", emoji: "🙏" },
    { id: "goals", label: "Goals", emoji: "🎯" },
    { id: "challenges", label: "Challenges", emoji: "💪" },
    { id: "wins", label: "Wins", emoji: "🏆" },
    { id: "relationships", label: "Relationships", emoji: "💬" },
    { id: "health", label: "Health", emoji: "🌱" },
    { id: "work", label: "Work", emoji: "💼" },
    { id: "creative", label: "Creative", emoji: "🎨" },
    { id: "mindfulness", label: "Mindfulness", emoji: "🧘" },
    { id: "learning", label: "Learning", emoji: "📚" },
    { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
    { id: "adventure", label: "Adventure", emoji: "🌍" },
    { id: "finance", label: "Finance", emoji: "💰" },
    { id: "spiritual", label: "Spiritual", emoji: "✨" },
  ];

  const [savedEntries, setSavedEntries] = useState([
    { id: 1, date: "2026-01-28", mood: "good", preview: "Had a productive day at work...", content: "Had a productive day at work. Finished the project ahead of schedule and got positive feedback from the team. Feeling accomplished and ready for tomorrow's challenges.", tags: ["work", "wins"] },
    { id: 2, date: "2026-01-27", mood: "stressed", preview: "Feeling overwhelmed with deadlines...", content: "Feeling overwhelmed with deadlines but trying to take it one step at a time. Need to remember to breathe and not put too much pressure on myself. Tomorrow I'll prioritize better.", tags: ["challenges", "work"] },
    { id: 3, date: "2026-01-26", mood: "great", preview: "Amazing day! Spent time with family...", content: "Amazing day! Spent time with family and felt really connected. These moments remind me what truly matters. Grateful for the people in my life who support me unconditionally.", tags: ["gratitude", "relationships", "family"] },
    { id: 4, date: "2026-01-25", mood: "okay", preview: "Regular day, nothing special...", content: "Regular day, nothing special but also nothing bad. Sometimes these neutral days are exactly what we need. Just being present and accepting where I am right now.", tags: ["mindfulness"] },
    { id: 5, date: "2026-01-24", mood: "good", preview: "Morning meditation was peaceful...", content: "Morning meditation was peaceful today. Starting the day with intention really sets a positive tone. I want to make this a consistent habit moving forward.", tags: ["mindfulness", "health", "goals"] },
  ]);

  // Mood prompt configurations
  const getMoodPrompt = () => {
    switch (mood) {
      case "great":
        return {
          affirmation: "Hold on to this feeling.",
          optional: "Want to capture what made today good?",
          showActivity: false,
          activities: [],
        };
      case "good":
        return {
          affirmation: "Moments like this matter.",
          optional: "A short reflection could help you remember this later.",
          showActivity: false,
          activities: [],
        };
      case "okay":
        return {
          affirmation: "You showed up today, that's what matters.",
          optional: "If you want, a short pause might help.",
          showActivity: true,
          activities: [
            { label: "2–3 min breathing", action: "breathing" },
            { label: "Short calm sound", action: "sounds" },
          ],
        };
      case "low":
        return {
          affirmation: "Something calming might help right now.",
          optional: null,
          showActivity: true,
          activities: [
            { label: "Calm Mode", action: "calmSelect" },
            { label: "Gentle breathing", action: "breathing" },
          ],
        };
      case "stressed":
        return {
          affirmation: "Let's slow things down a bit.",
          optional: "A short breathing session could help settle things.",
          showActivity: true,
          activities: [
            { label: "Breathing (1–3 min)", action: "breathing" },
            { label: "Sound Library", action: "sounds" },
            { label: "Calm Mode", action: "calmSelect" },
          ],
        };
      default:
        return null;
    }
  };

  const handleActivitySelection = (action) => {
    switch (action) {
      case "breathing":
        goToBreathing();
        break;
      case "sounds":
        goToSoundLibrary();
        break;
      case "calmSelect":
        goToCalmSelect();
        break;
      case "sleepLibrary":
        goToSleepLibrary();
        break;
      default:
        console.log("Unknown activity:", action);
    }
  };

  const handleMoodSelection = (selectedMood) => {
    setMood(selectedMood);
    setScreen("moodResponse");
  };

  // Mood Check-In Screen (Page 1)
  if (screen === "moodCheckIn") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Daily Reflection
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  How are you feeling right now?
                </Text>
              </View>
            </View>

            {/* Mood Selection Card */}
            <View
              style={{
                marginTop: 60,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 24,
                }}
              >
                Mood Check-In
              </Text>

              <View style={{ width: "100%" }}>
                {[
                  { id: "great", label: "Great", emoji: "🌟" },
                  { id: "good", label: "Good", emoji: "🙂" },
                  { id: "okay", label: "Okay", emoji: "😐" },
                  { id: "low", label: "Low", emoji: "😕" },
                  { id: "stressed", label: "Stressed", emoji: "😣" },
                ].map((opt, idx) => (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleMoodSelection(opt.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      paddingHorizontal: 18,
                      borderRadius: 16,
                      marginBottom: idx < 4 ? 12 : 0,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.45)",
                      backgroundColor: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <Text style={{ marginRight: 12, fontSize: 24 }}>{opt.emoji}</Text>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#0B1220" }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Back to Home */}
            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Mood Response Screen (Page 2)
  if (screen === "moodResponse") {
    const prompt = getMoodPrompt();

    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Daily Reflection
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  You're feeling {mood}
                </Text>
              </View>
            </View>

            {/* Response Card */}
            <View
              style={{
                marginTop: 60,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                minHeight: 200,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#0B1220",
                  lineHeight: 34,
                  textAlign: "center",
                }}
              >
                {prompt.affirmation}
              </Text>

              {prompt.optional && (
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 15,
                    color: "rgba(11,18,32,0.70)",
                    lineHeight: 22,
                    textAlign: "center",
                  }}
                >
                  {prompt.optional}
                </Text>
              )}
            </View>

            {/* Optional Note */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.55)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <TextInput
                value={moodNote}
                onChangeText={setMoodNote}
                placeholder="Optional: what's behind this mood?"
                placeholderTextColor="rgba(11,18,32,0.40)"
                multiline
                style={{
                  fontSize: 14,
                  color: "#0B1220",
                  fontWeight: "600",
                  minHeight: 60,
                }}
              />
            </View>

            {/* Activity Suggestions */}
            {prompt.showActivity && prompt.activities.length > 0 && (
              <View
                style={{
                  marginTop: 20,
                  backgroundColor: "rgba(255,255,255,0.55)",
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(11,18,32,0.70)",
                    marginBottom: 14,
                    textAlign: "center",
                  }}
                >
                  Suggested Activity
                </Text>

                {prompt.activities.map((activity, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleActivitySelection(activity.action)}
                    activeOpacity={0.9}
                    style={{
                      marginTop: idx > 0 ? 10 : 0,
                      paddingVertical: 14,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: "rgba(79,70,229,0.12)",
                      borderWidth: 1,
                      borderColor: "rgba(79,70,229,0.22)",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "900", color: "#4F46E5" }}>
                      {activity.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Continue to Journal Button */}
            <TouchableOpacity
              onPress={() => setScreen("journal")}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 13,
                borderRadius: 999,
                backgroundColor: "#4F46E5",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                Continue to Journal
              </Text>
            </TouchableOpacity>

            {/* Back to Home */}
            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

// Tab Navigation Component
  const JournalTabs = () => (
    <View style={{ flexDirection: "row", marginTop: 20, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" }}>
      {[
        { id: "write", label: "Write", emoji: "✍️" },
        { id: "entries", label: "Entries", emoji: "📚" },
        { id: "calendar", label: "Calendar", emoji: "📅" },
        { id: "insights", label: "Insights", emoji: "📊" },
      ].map((tab) => {
        const isActive = journalView === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setJournalView(tab.id)}
            activeOpacity={0.9}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: isActive ? "rgba(79,70,229,0.12)" : "transparent",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, marginBottom: 4 }}>{tab.emoji}</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: isActive ? "900" : "700",
                color: isActive ? "#4F46E5" : "rgba(11,18,32,0.65)",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Journal Screen (Page 3 - Notes App Style)

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getMoodEmoji = (moodId) => {
    const moods = {
      great: "🌟",
      good: "🙂",
      okay: "😐",
      low: "😕",
      stressed: "😣"
    };
    return moods[moodId] || "📝";
  };

  const saveEntry = () => {
    if (!reflection.trim()) {
      return;
    }

    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      mood: mood || "okay",
      preview: reflection.substring(0, 50) + (reflection.length > 50 ? "..." : ""),
      content: reflection,
      tags: selectedTags,
    };

    setSavedEntries([newEntry, ...savedEntries]);
   
    // Clear form
    setReflection("");
    setMood(null);
    setMoodNote("");
    setSelectedTags([]);
   
    // Show confirmation with better feedback
    setJournalView("entries");
  };

  // ============================================
  // WRITE TAB - Today's Entry (PREMIUM VERSION)
  // ============================================
  if (journalView === "write") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header with Navigation */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Journal
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <JournalTabs />

           {/* Writing Inspiration Quote */}
           <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,255,255,0.55)",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text style={{ fontSize: 15, fontStyle: "italic", color: "#0B1220", lineHeight: 22, textAlign: "center" }}>
                "The act of writing is the act of discovering what you believe."
              </Text>
              <Text style={{ marginTop: 8, fontSize: 12, fontWeight: "700", color: "rgba(11,18,32,0.60)", textAlign: "center" }}>
                — David Hare
              </Text>
            </View>

           {/* Prompts & Tags */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              {/* Prompts Toggle */}
              <TouchableOpacity
                onPress={() => setShowPrompts(!showPrompts)}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderRadius: 18,
                  backgroundColor: showPrompts ? "rgba(79,70,229,0.10)" : "rgba(255,255,255,0.65)",
                  borderWidth: 1,
                  borderColor: showPrompts ? "rgba(79,70,229,0.25)" : "rgba(255,255,255,0.35)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>💡</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#0B1220" }}>
                    Prompts
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "rgba(11,18,32,0.70)" }}>
                  {showPrompts ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {/* Tags Toggle */}
              <TouchableOpacity
                onPress={() => setShowTags(!showTags)}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderRadius: 18,
                  backgroundColor: showTags ? "rgba(79,70,229,0.10)" : "rgba(255,255,255,0.65)",
                  borderWidth: 1,
                  borderColor: showTags ? "rgba(79,70,229,0.25)" : "rgba(255,255,255,0.35)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 16, marginRight: 8 }}>🏷️</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#0B1220" }}>
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: "900", color: "rgba(11,18,32,0.70)" }}>
                  {showTags ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prompts Dropdown */}
            {showPrompts && (
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: "rgba(255,255,255,0.75)",
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.45)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(11,18,32,0.70)",
                    marginBottom: 12,
                  }}
                >
                  Writing Prompts
                </Text>

                <View style={{ gap: 8 }}>
                  {reflectionPrompts.map((prompt, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setReflection(reflection ? reflection + "\n\n" + prompt : prompt);
                        setShowPrompts(false);
                      }}
                      activeOpacity={0.9}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.85)",
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.55)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: "#0B1220",
                          fontWeight: "600",
                        }}
                      >
                        {prompt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Tags Grid */}
            {showTags && (
              <View
                style={{
                  marginTop: 4,
                  backgroundColor: "rgba(255,255,255,0.75)",
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.45)",
                }}
              >
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag.id));
                          } else {
                            setSelectedTags([...selectedTags, tag.id]);
                          }
                        }}
                        activeOpacity={0.9}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 999,
                          backgroundColor: isSelected ? "rgba(79,70,229,0.16)" : "rgba(255,255,255,0.85)",
                          borderWidth: 1,
                          borderColor: isSelected ? "rgba(79,70,229,0.35)" : "rgba(255,255,255,0.55)",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 13, marginRight: 5 }}>{tag.emoji}</Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "800",
                            color: isSelected ? "#4F46E5" : "rgba(11,18,32,0.70)",
                          }}
                        >
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Current Mood Badge (if selected) */}
            {mood && (
              <View
                style={{
                  marginTop: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: "rgba(79,70,229,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(79,70,229,0.22)",
                  flexDirection: "row",
                  alignItems: "center",
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>{getMoodEmoji(mood)}</Text>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#4F46E5" }}>
                  Feeling {mood} today
                </Text>
              </View>
            )}

            {/* NEW: Selected Tags Display */}
            {selectedTags.length > 0 && (
              <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {selectedTags.map((tagId) => {
                  const tag = availableTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <View
                      key={tagId}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "rgba(79,70,229,0.12)",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 12, marginRight: 4 }}>{tag.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#4F46E5" }}>
                        {tag.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Writing Area */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.75)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                minHeight: 400,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 14,
                }}
              >
                Today's Reflection
              </Text>

              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder="What's on your mind today? Write freely..."
                placeholderTextColor="rgba(11,18,32,0.35)"
                multiline
                textAlignVertical="top"
                style={{
                  minHeight: 300,
                  fontSize: 16,
                  color: "#0B1220",
                  lineHeight: 26,
                  fontWeight: "500",
                }}
              />

            {/* Enhanced Writing Stats with Visual Progress */}
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(11,18,32,0.08)" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.55)", fontWeight: "700" }}>
                  {reflection.length} characters • {reflection.trim().split(/\s+/).filter(w => w.length > 0).length} words
                </Text>
                
                {(() => {
                  const wordCount = reflection.trim().split(/\s+/).filter(w => w.length > 0).length;
                  const goalWords = 50;
                  const progress = Math.min(wordCount / goalWords, 1);
                  
                  return progress >= 1 ? (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 16, marginRight: 4 }}>✓</Text>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#10B981" }}>
                        Goal reached
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "rgba(11,18,32,0.60)" }}>
                      {Math.round(progress * 100)}% to goal
                    </Text>
                  );
                })()}
              </View>

              {/* NEW: Visual Progress Bar */}
              {(() => {
                const wordCount = reflection.trim().split(/\s+/).filter(w => w.length > 0).length;
                const goalWords = 50;
                const progress = Math.min(wordCount / goalWords, 1);
                
                return (
                  <View
                    style={{
                      width: "100%",
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(11,18,32,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${progress * 100}%`,
                        backgroundColor: progress >= 1 ? "#10B981" : "#4F46E5",
                        borderRadius: 999,
                      }}
                    />
                  </View>
                );
              })()}
            </View>
            </View>

            {/* Save Button with Better Feedback */}
            <TouchableOpacity
              onPress={saveEntry}
              activeOpacity={0.9}
              disabled={!reflection.trim()}
              style={{
                marginTop: 20,
                paddingVertical: 14,
                borderRadius: 999,
                backgroundColor: reflection.trim() ? "#4F46E5" : "rgba(11,18,32,0.15)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: reflection.trim() ? "#fff" : "rgba(11,18,32,0.40)", fontSize: 15, fontWeight: "900" }}>
                {reflection.trim() ? "💾 Save Entry" : "Write something to save"}
              </Text>
            </TouchableOpacity>

            {/* Back to Home */}
            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================
  // ENTRIES TAB - All Saved Entries 
  // ============================================
  if (journalView === "entries") {
    // If viewing a specific entry
    if (selectedEntry) {
      return (
        <LinearGradient
          colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 18,
                paddingBottom: 46,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setSelectedEntry(null)}
                  activeOpacity={0.9}
                  style={{
                    paddingVertical: 8,
                    paddingRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 28, color: "#4F46E5" }}>←</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={{ fontSize: 24, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                    {formatDate(selectedEntry.date)}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <Text style={{ fontSize: 20, marginRight: 8 }}>{getMoodEmoji(selectedEntry.mood)}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(11,18,32,0.70)", textTransform: "capitalize" }}>
                      {selectedEntry.mood}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Entry Content */}
              <View
                style={{
                  marginTop: 24,
                  backgroundColor: "rgba(255,255,255,0.75)",
                  borderRadius: 24,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.45)",
                }}
              >
                <Text style={{ fontSize: 16, color: "#0B1220", lineHeight: 28 }}>
                  {selectedEntry.content}
                </Text>
              </View>

              {/* Tags */}
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: "rgba(255,255,255,0.65)",
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.35)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: "rgba(11,18,32,0.70)",
                      marginBottom: 12,
                    }}
                  >
                    Tags
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {selectedEntry.tags.map((tagId) => {
                      const tag = availableTags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <View
                          key={tagId}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 999,
                            backgroundColor: "rgba(79,70,229,0.12)",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 14, marginRight: 6 }}>{tag.emoji}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "800", color: "#4F46E5" }}>
                            {tag.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Entry Stats */}
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      {selectedEntry.content.length}
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      Characters
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      {selectedEntry.content.trim().split(/\s+/).filter(w => w.length > 0).length}
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      Words
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      {selectedEntry.tags?.length || 0}
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      Tags
                    </Text>
                  </View>
                </View>
              </View>

              {/* Back Button */}
              <TouchableOpacity
                onPress={() => setSelectedEntry(null)}
                activeOpacity={0.9}
                style={{
                  marginTop: 24,
                  paddingVertical: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.45)",
                  backgroundColor: "rgba(255,255,255,0.28)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                  Back to Entries
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      );
    }

    // Filter entries based on search and filters
    const filteredEntries = savedEntries.filter(entry => {
      const matchesSearch = !searchQuery ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.preview.toLowerCase().includes(searchQuery.toLowerCase());
     
      const matchesTag = !filterTag || (entry.tags && entry.tags.includes(filterTag));
      const matchesMood = !filterMood || entry.mood === filterMood;
     
      return matchesSearch && matchesTag && matchesMood;
    });

    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Journal
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <JournalTabs />

            {/* Search Bar */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search entries..."
                placeholderTextColor="rgba(11,18,32,0.40)"
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#0B1220",
                  fontWeight: "600",
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={{ fontSize: 14, color: "rgba(11,18,32,0.60)" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filters */}
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 10,
                }}
              >
                Filters
              </Text>
             
              {/* Mood Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setFilterMood(null)}
                  activeOpacity={0.9}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: !filterMood ? "rgba(79,70,229,0.16)" : "rgba(255,255,255,0.55)",
                    borderWidth: 1,
                    borderColor: !filterMood ? "rgba(79,70,229,0.35)" : "rgba(255,255,255,0.35)",
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: !filterMood ? "#4F46E5" : "rgba(11,18,32,0.70)" }}>
                    All Moods
                  </Text>
                </TouchableOpacity>
               
                {["great", "good", "okay", "low", "stressed"].map((moodId) => (
                  <TouchableOpacity
                    key={moodId}
                    onPress={() => setFilterMood(moodId)}
                    activeOpacity={0.9}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: filterMood === moodId ? "rgba(79,70,229,0.16)" : "rgba(255,255,255,0.55)",
                      borderWidth: 1,
                      borderColor: filterMood === moodId ? "rgba(79,70,229,0.35)" : "rgba(255,255,255,0.35)",
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 14, marginRight: 4 }}>{getMoodEmoji(moodId)}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: filterMood === moodId ? "#4F46E5" : "rgba(11,18,32,0.70)",
                        textTransform: "capitalize",
                      }}
                    >
                      {moodId}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Tag Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setFilterTag(null)}
                  activeOpacity={0.9}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: !filterTag ? "rgba(79,70,229,0.16)" : "rgba(255,255,255,0.55)",
                    borderWidth: 1,
                    borderColor: !filterTag ? "rgba(79,70,229,0.35)" : "rgba(255,255,255,0.35)",
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: !filterTag ? "#4F46E5" : "rgba(11,18,32,0.70)" }}>
                    All Tags
                  </Text>
                </TouchableOpacity>
               
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => setFilterTag(tag.id)}
                    activeOpacity={0.9}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: filterTag === tag.id ? "rgba(79,70,229,0.16)" : "rgba(255,255,255,0.55)",
                      borderWidth: 1,
                      borderColor: filterTag === tag.id ? "rgba(79,70,229,0.35)" : "rgba(255,255,255,0.35)",
                      marginRight: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 12, marginRight: 4 }}>{tag.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: filterTag === tag.id ? "#4F46E5" : "rgba(11,18,32,0.70)",
                      }}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Entries List */}
            {filteredEntries.length === 0 ? (
              <View
                style={{
                  marginTop: 60,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 24,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📝</Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#0B1220", marginBottom: 8 }}>
                  {searchQuery || filterTag || filterMood ? "No entries found" : "No entries yet"}
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(11,18,32,0.65)", textAlign: "center" }}>
                  {searchQuery || filterTag || filterMood
                    ? "Try adjusting your filters"
                    : "Start writing to see your entries here"}
                </Text>
              </View>
            ) : (
              filteredEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedEntry(entry)}
                  style={{
                    marginTop: 16,
                    backgroundColor: "rgba(255,255,255,0.65)",
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.35)",
                    overflow: "hidden",
                  }}
                >
                  {/* Entry Header */}
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontSize: 20, marginRight: 10 }}>{getMoodEmoji(entry.mood)}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: "rgba(11,18,32,0.70)" }}>
                          {formatDate(entry.date)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20, color: "rgba(11,18,32,0.30)" }}>›</Text>
                    </View>
                    
                    {/* Entry Preview with better typography */}
                    <Text style={{ fontSize: 15, color: "#0B1220", lineHeight: 22, fontWeight: "600" }} numberOfLines={2}>
                      {entry.preview}
                    </Text>
                   
                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                        {entry.tags.slice(0, 3).map((tagId) => {
                          const tag = availableTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <View
                              key={tagId}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: "rgba(79,70,229,0.12)",
                                marginRight: 6,
                                marginBottom: 6,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 10, marginRight: 4 }}>{tag.emoji}</Text>
                              <Text style={{ fontSize: 10, fontWeight: "800", color: "#4F46E5" }}>
                                {tag.label}
                              </Text>
                            </View>
                          );
                        })}
                        {entry.tags.length > 3 && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: "rgba(11,18,32,0.08)",
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "800", color: "rgba(11,18,32,0.60)" }}>
                              +{entry.tags.length - 3}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Word count preview */}
                    <Text style={{ marginTop: 10, fontSize: 11, fontWeight: "700", color: "rgba(11,18,32,0.55)" }}>
                      {entry.content.trim().split(/\s+/).filter(w => w.length > 0).length} words
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Back to Home */}
            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================
  // CALENDAR TAB 
  // ============================================
  if (journalView === "calendar") {
    const monthYear = calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Filter entries for current viewing month
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    const monthEntries = savedEntries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });
    const daysWithEntries = monthEntries.map(e => new Date(e.date).getDate());

    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Journal
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  {monthYear}
                </Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <JournalTabs />

            {/* Calendar Grid Preview */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <TouchableOpacity
                 onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                  activeOpacity={0.7}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(79,70,229,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#4F46E5" }}>‹</Text>
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "900",
                    letterSpacing: 0.4,
                    color: "#0B1220",
                  }}
                >
                  {monthYear}
                </Text>

                <TouchableOpacity
                 onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                  activeOpacity={0.7}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(79,70,229,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: "#4F46E5" }}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "rgba(79,70,229,0.12)",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: "#4F46E5" }}>
                    {daysWithEntries.length} active days
                  </Text>
                </View>
              </View>

              {/* Real Monthly Calendar */}
              <View style={{ marginTop: 12 }}>
                {/* Days of Week Header */}
                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <View key={idx} style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "rgba(11,18,32,0.60)" }}>
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {(() => {
                  const year = calendarDate.getFullYear();
                    const month = calendarDate.getMonth();
                    const today = new Date();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    
                    const calendarDays = [];
                    
                    // Add empty cells for days before month starts
                    for (let i = 0; i < firstDay; i++) {
                      calendarDays.push(
                        <View key={`empty-${i}`} style={{ width: "14.28%", aspectRatio: 1, padding: 2 }} />
                      );
                    }
                    
                    // Add actual days
                    for (let day = 1; day <= daysInMonth; day++) {
                      const hasEntry = daysWithEntries.includes(day);
                      const isToday = day === today.getDate() && 
                              month === today.getMonth() && 
                              year === today.getFullYear();
                      
                      calendarDays.push(
                        <View
                          key={day}
                          style={{
                            width: "14.28%",
                            aspectRatio: 1,
                            padding: 2,
                          }}
                        >
                          <View
                            style={{
                              flex: 1,
                              borderRadius: 10,
                              backgroundColor: hasEntry
                                ? "rgba(79,70,229,0.12)"
                                : isToday
                                ? "rgba(11,18,32,0.05)"
                                : "transparent",
                              borderWidth: hasEntry ? 2 : isToday ? 1 : 0,
                              borderColor: hasEntry ? "#4F46E5" : "rgba(11,18,32,0.15)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: hasEntry ? "900" : isToday ? "700" : "600",
                                color: hasEntry ? "#4F46E5" : "#0B1220",
                              }}
                            >
                              {day}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    
                    return calendarDays;
                  })()}
                </View>

                {/* Legend */}
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(11,18,32,0.08)" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#4F46E5", marginRight: 6 }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(11,18,32,0.65)" }}>
                      Entry
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: "rgba(11,18,32,0.15)", marginRight: 6 }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(11,18,32,0.65)" }}>
                      Today
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Streak Info */}
            <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🔥</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "rgba(11,18,32,0.70)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Current Streak
                </Text>
                <Text style={{ fontSize: 40, fontWeight: "900", color: "#4F46E5", marginTop: 8 }}>
                  {savedEntries.length > 0 ? "3" : "0"}
                </Text>
                <Text style={{ fontSize: 13, color: "rgba(11,18,32,0.65)", marginTop: 4 }}>
                  {savedEntries.length > 0 ? "days in a row" : "Start your streak today!"}
                </Text>
              </View>

              <View
                style={{
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(11,18,32,0.08)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      7
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      Longest
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      {savedEntries.length}
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      Total Days
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5" }}>
                      {Math.round((savedEntries.length / 30) * 100)}%
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                      This Month
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Back to Home */}
            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

// ============================================
// INSIGHTS TAB 
// ============================================
if (journalView === "insights") {
  // If an insight is selected, show detail view
  if (selectedInsight) {
    const renderInsightDetail = () => {
      switch (selectedInsight) {
        case "total": {
          return (
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "rgba(11,18,32,0.70)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                Total Entries
              </Text>
              <Text style={{ fontSize: 56, fontWeight: "900", color: "#4F46E5", marginTop: 12 }}>
                {savedEntries.length}
              </Text>
              <Text style={{ fontSize: 13, color: "rgba(11,18,32,0.65)", marginTop: 8 }}>
                Keep up the great work!
              </Text>
            </View>
          );
        }

        case "mood": {
          const moodCount = savedEntries.reduce((acc, entry) => {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
            return acc;
          }, {});
          const mostCommonMood = Object.keys(moodCount).length > 0
            ? Object.keys(moodCount).reduce((a, b) => moodCount[a] > moodCount[b] ? a : b)
            : null;

          return (
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 14,
                }}
              >
                Mood Breakdown
              </Text>

              {Object.entries(moodCount).map(([moodId, count]) => (
                <View key={moodId} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, marginRight: 10 }}>{getMoodEmoji(moodId)}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0B1220", textTransform: "capitalize" }}>
                        {moodId}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(11,18,32,0.65)" }}>
                        {count} {count === 1 ? 'entry' : 'entries'}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "rgba(11,18,32,0.10)",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${(count / savedEntries.length) * 100}%`,
                          backgroundColor: "#4F46E5",
                          borderRadius: 999,
                        }}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {mostCommonMood && (
                <View
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(11,18,32,0.10)",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#0B1220", textAlign: "center" }}>
                    Most common: {getMoodEmoji(mostCommonMood)} {mostCommonMood}
                  </Text>
                </View>
              )}
            </View>
          );
        }

        case "tags": {
          const tagCounts = {};
          savedEntries.forEach(entry => {
            if (entry.tags) {
              entry.tags.forEach(tagId => {
                tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
              });
            }
          });

          const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          return (
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 14,
                }}
              >
                Most Used Tags
              </Text>

              {sortedTags.length === 0 ? (
                <Text style={{ fontSize: 14, color: "rgba(11,18,32,0.65)", textAlign: "center" }}>
                  No tags used yet
                </Text>
              ) : (
                sortedTags.map(([tagId, count]) => {
                  const tag = availableTags.find(t => t.id === tagId);
                  if (!tag) return null;

                  return (
                    <View key={tagId} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, marginRight: 10 }}>{tag.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: "800", color: "#0B1220" }}>
                            {tag.label}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(11,18,32,0.65)" }}>
                            {count} {count === 1 ? 'time' : 'times'}
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: "rgba(11,18,32,0.10)",
                            overflow: "hidden",
                          }}
                        >
                          <View
                            style={{
                              height: "100%",
                              width: `${(count / savedEntries.length) * 100}%`,
                              backgroundColor: "#4F46E5",
                              borderRadius: 999,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          );
        }

        case "writing": {
          return (
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                Your Writing Stats
              </Text>

              <View style={{ gap: 12 }}>
                {[
                  { emoji: "📝", label: "Total Entries", value: savedEntries.length, unit: "entries" },
                  { emoji: "📖", label: "Words Written", value: "~2.3k", unit: "words" },
                  { emoji: "⏱️", label: "Avg. Time", value: "7", unit: "min/entry" },
                  { emoji: "🎯", label: "Completion", value: "92", unit: "%" },
                ].map((stat, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: "rgba(79,70,229,0.05)",
                    }}
                  >
                    <Text style={{ fontSize: 28, marginRight: 12 }}>{stat.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: "#0B1220" }}>
                        {stat.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
                        Tracking your progress
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 22, fontWeight: "900", color: "#4F46E5" }}>
                        {stat.value}
                      </Text>
                      <Text style={{ fontSize: 10, color: "rgba(11,18,32,0.60)", fontWeight: "700", marginTop: 2 }}>
                        {stat.unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        }

        case "milestones": {
          return (
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 14,
                }}
              >
                Milestones Unlocked
              </Text>

              <View style={{ gap: 12 }}>
                {[
                  { emoji: "✨", title: "First Entry", desc: "Started your journey", unlocked: savedEntries.length >= 1 },
                  { emoji: "🔥", title: "3-Day Streak", desc: "Building consistency", unlocked: savedEntries.length >= 3 },
                  { emoji: "📚", title: "10 Entries", desc: "Reflection habit forming", unlocked: savedEntries.length >= 10 },
                  { emoji: "💎", title: "30-Day Streak", desc: "Committed writer", unlocked: false },
                ].map((milestone, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: milestone.unlocked ? "rgba(79,70,229,0.08)" : "rgba(11,18,32,0.04)",
                      borderWidth: 1,
                      borderColor: milestone.unlocked ? "rgba(79,70,229,0.18)" : "rgba(11,18,32,0.08)",
                      opacity: milestone.unlocked ? 1 : 0.5,
                    }}
                  >
                    <Text style={{ fontSize: 28, marginRight: 12 }}>{milestone.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0B1220" }}>
                        {milestone.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
                        {milestone.desc}
                      </Text>
                    </View>
                    {milestone.unlocked && (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: "rgba(79,70,229,0.14)",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "900", color: "#4F46E5" }}>
                          ✓ Done
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        }

        default:
          return null;
      }
    };

    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 46,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Journal
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  Your journaling insights
                </Text>
              </View>
            </View>

            {/* Tab Navigation */}
            <JournalTabs />

            {/* Insight Detail */}
            {renderInsightDetail()}

            {/* Back to Insights Button */}
            <TouchableOpacity
              onPress={() => setSelectedInsight(null)}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: "#4F46E5",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                ← Back to Insights
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goHome}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Main Insights Selection Page
  const insightOptions = [
    { id: "total", emoji: "📊", title: "Total Entries", desc: "Your journaling count" },
    { id: "mood", emoji: "😊", title: "Mood Analysis", desc: "Emotional patterns" },
    { id: "tags", emoji: "🏷️", title: "Popular Tags", desc: "Most used categories" },
    { id: "writing", emoji: "✍️", title: "Writing Stats", desc: "Words & time tracking" },
    { id: "milestones", emoji: "🏆", title: "Milestones", desc: "Achievements unlocked" },
  ];

  return (
    <LinearGradient
      colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 46,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                Journal
              </Text>
              <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                Select an insight to explore
              </Text>
            </View>
          </View>

          {/* Tab Navigation */}
          <JournalTabs />

          {/* Insight Options Grid */}
          <View style={{ marginTop: 32 }}>
            {insightOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                onPress={() => setSelectedInsight(option.id)}
                activeOpacity={0.9}
                style={{
                  marginTop: index === 0 ? 0 : 14,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 24,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(79,70,229,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{option.emoji}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "900", color: "#0B1220" }}>
                    {option.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: "rgba(11,18,32,0.65)", marginTop: 3 }}>
                    {option.desc}
                  </Text>
                </View>

                <Text style={{ fontSize: 20, color: "rgba(11,18,32,0.40)" }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Navigation Buttons */}
          <TouchableOpacity
            onPress={() => setJournalView("write")}
            activeOpacity={0.9}
            style={{
              marginTop: 24,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: "#4F46E5",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
              Back to Write
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goHome}
            activeOpacity={0.9}
            style={{
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.45)",
              backgroundColor: "rgba(255,255,255,0.28)",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

  return null;
}

// --- Bottom Navigation Bar Component ---
function BottomNavBar({ currentScreen, onNavigate }) {
  // Determine if current screen uses gradient or white background
  const gradientScreens = [
    'home', 'favorites', 'profile', 'calmSelect',
    'sleepLibrary', 'journal'
  ];
 
  const isGradientScreen = gradientScreens.includes(currentScreen);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 72,
        backgroundColor: isGradientScreen
          ? 'rgba(255, 255, 255, 0.35)' // Translucent for gradient screens
          : 'rgba(255, 255, 255, 0.98)', // Solid white for white screens
        borderTopWidth: 1,
        borderTopColor: isGradientScreen
          ? 'rgba(255, 255, 255, 0.45)' // Lighter border for gradient
          : 'rgba(79, 70, 229, 0.15)', // Subtle purple for white
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isGradientScreen ? 0.15 : 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {/* Subtle gradient overlay for gradient screens */}
      {isGradientScreen && (
        <LinearGradient
          colors={['rgba(127, 231, 242, 0.25)', 'rgba(165, 180, 252, 0.25)', 'rgba(192, 132, 252, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      )}

      {/* Favorites */}
      <TouchableOpacity
        onPress={() => onNavigate('favorites')}
        activeOpacity={0.7}
        style={{
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
          zIndex: 1,
        }}
      >
        <Text style={{ fontSize: 26, marginBottom: 4 }}>
          {currentScreen === 'favorites' ? '🩵' : '🩵'}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: currentScreen === 'favorites' ? '800' : '600',
            color: currentScreen === 'favorites'
              ? '#4F46E5'
              : isGradientScreen
                ? 'rgba(11, 18, 32, 0.80)'
                : 'rgba(11, 18, 32, 0.65)',
          }}
        >
          Favorites
        </Text>
      </TouchableOpacity>

      {/* Home */}
      <TouchableOpacity
        onPress={() => onNavigate('home')}
        activeOpacity={0.7}
        style={{
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
          zIndex: 1,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: currentScreen === 'home'
              ? '#4F46E5'
              : isGradientScreen
                ? 'rgba(255, 255, 255, 0.45)'
                : 'rgba(79, 70, 229, 0.12)',
            borderWidth: isGradientScreen ? 1 : 0,
            borderColor: isGradientScreen ? 'rgba(255, 255, 255, 0.55)' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
          }}
        >
          <Text style={{ fontSize: 22 }}>
            {currentScreen === 'home' ? '🏠' : '🏠'}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            fontWeight: currentScreen === 'home' ? '800' : '600',
            color: currentScreen === 'home'
              ? '#4F46E5'
              : isGradientScreen
                ? 'rgba(11, 18, 32, 0.80)'
                : 'rgba(11, 18, 32, 0.65)',
          }}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        onPress={() => onNavigate('profile')}
        activeOpacity={0.7}
        style={{
          flex: 1,
          alignItems: 'center',
          paddingVertical: 8,
          zIndex: 1,
        }}
      >
        <Text style={{ fontSize: 26, marginBottom: 4 }}>
          {currentScreen === 'profile' ? '👤' : '👤'}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: currentScreen === 'profile' ? '800' : '600',
            color: currentScreen === 'profile'
              ? '#4F46E5'
              : isGradientScreen
                ? 'rgba(11, 18, 32, 0.80)'
                : 'rgba(11, 18, 32, 0.65)',
          }}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Favorites Screen ---
function FavoritesScreen({ goHome, savedFavorites, onRemoveFavorite }) {
  return (
    <LinearGradient
      colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 100, // Extra space for bottom nav
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                Favorites
              </Text>
              <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                Your saved activities
              </Text>
            </View>
          </View>

          {/* Favorites List */}
          {savedFavorites.length === 0 ? (
            <View
              style={{
                marginTop: 60,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 32,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 16 }}>♡</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0B1220", marginBottom: 8 }}>
                No favorites yet
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(11,18,32,0.65)", textAlign: "center" }}>
                Add activities from Home to quick-access them here
              </Text>
            </View>
          ) : (
            savedFavorites.map((fav, index) => (
              <View
                key={index}
                style={{
                  marginTop: 16,
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 20,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#0B1220" }}>
                      {fav.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(11,18,32,0.65)", marginTop: 4 }}>
                      {fav.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveFavorite(index)}
                    activeOpacity={0.7}
                    style={{
                      marginLeft: 12,
                      padding: 8,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Profile Screen ---
function ProfileScreen({ goHome }) {
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("user@example.com");
  const [view, setView] = useState("main"); // "main" | "editProfile" | "stats" | "settings"

  // Mock achievements data
  const achievements = [
    { id: 1, emoji: "✨", title: "First Entry", unlocked: true, desc: "Started your journey" },
    { id: 2, emoji: "🔥", title: "3-Day Streak", unlocked: true, desc: "Building consistency" },
    { id: 3, emoji: "📚", title: "10 Entries", unlocked: false, desc: "Reflection habit forming" },
    { id: 4, emoji: "🧘", title: "Calm Master", unlocked: true, desc: "10 breathing sessions" },
    { id: 5, emoji: "🎯", title: "Focus Pro", unlocked: false, desc: "Perfect focus game score" },
    { id: 6, emoji: "💎", title: "30-Day Streak", unlocked: false, desc: "Committed writer" },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // ============================================
  // MAIN PROFILE VIEW
  // ============================================
  if (view === "main") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 100,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Profile
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  Your journey at a glance
                </Text>
              </View>
            </View>

            {/* Profile Card with Avatar */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 28,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
              }}
            >
              {/* Avatar with gradient ring */}
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  padding: 4,
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                }}
              >
                <View
                  style={{
                    width: 102,
                    height: 102,
                    borderRadius: 51,
                    backgroundColor: "rgba(79,70,229,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 52 }}>👤</Text>
                </View>
              </View>

              <Text style={{ marginTop: 16, fontSize: 24, fontWeight: "900", color: "#0B1220" }}>
                {username}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 14, color: "rgba(11,18,32,0.65)" }}>
                {email}
              </Text>

              {/* Quick stats pills */}
              <View style={{ flexDirection: "row", marginTop: 18, gap: 10 }}>
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: "rgba(79,70,229,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(79,70,229,0.22)",
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5", textAlign: "center" }}>
                    12
                  </Text>
                  <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.70)", marginTop: 2, fontWeight: "700" }}>
                    Days Active
                  </Text>
                </View>

                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: "rgba(79,70,229,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(79,70,229,0.22)",
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "900", color: "#4F46E5", textAlign: "center" }}>
                    8
                  </Text>
                  <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.70)", marginTop: 2, fontWeight: "700" }}>
                    Day Streak
                  </Text>
                </View>
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                onPress={() => setView("editProfile")}
                activeOpacity={0.9}
                style={{
                  marginTop: 18,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.55)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#0B1220" }}>
                  ✏️ Edit Profile
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <View style={{ marginTop: 20, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setView("stats")}
                activeOpacity={0.9}
                style={{
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(79,70,229,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>📊</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#0B1220" }}>
                      View Full Stats
                    </Text>
                    <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
                      Detailed progress & insights
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 20, color: "rgba(11,18,32,0.40)" }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setView("settings")}
                activeOpacity={0.9}
                style={{
                  backgroundColor: "rgba(255,255,255,0.65)",
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.35)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "rgba(79,70,229,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>⚙️</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#0B1220" }}>
                      Settings & Preferences
                    </Text>
                    <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
                      Customize your experience
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 20, color: "rgba(11,18,32,0.40)" }}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Achievements Preview */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(11,18,32,0.70)",
                  }}
                >
                  Achievements
                </Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: "rgba(79,70,229,0.12)",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900", color: "#4F46E5" }}>
                    {unlockedCount}/{achievements.length}
                  </Text>
                </View>
              </View>

              {/* Achievement Grid - first 4 */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {achievements.slice(0, 4).map((achievement) => (
                  <View
                    key={achievement.id}
                    style={{
                      width: "48%",
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: achievement.unlocked ? "rgba(79,70,229,0.08)" : "rgba(11,18,32,0.04)",
                      borderWidth: 1,
                      borderColor: achievement.unlocked ? "rgba(79,70,229,0.18)" : "rgba(11,18,32,0.08)",
                      opacity: achievement.unlocked ? 1 : 0.5,
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>{achievement.emoji}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "900", color: "#0B1220" }}>
                      {achievement.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: "rgba(11,18,32,0.65)", marginTop: 4 }}>
                      {achievement.desc}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={{ marginTop: 14, fontSize: 12, fontWeight: "800", color: "rgba(11,18,32,0.60)", textAlign: "center" }}>
                +{achievements.length - 4} more achievements to unlock
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================
  // EDIT PROFILE VIEW
  // ============================================
  if (view === "editProfile") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 100,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Edit Profile
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  Update your information
                </Text>
              </View>
            </View>

            {/* Profile Picture Section */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: "rgba(79,70,229,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 48 }}>👤</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 999,
                  backgroundColor: "rgba(79,70,229,0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(79,70,229,0.22)",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#4F46E5" }}>
                  📷 Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Account Details */}
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 16,
                }}
              >
                Account Details
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(11,18,32,0.70)", marginBottom: 8 }}>
                  Username
                </Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.75)",
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 15,
                    color: "#0B1220",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.45)",
                    fontWeight: "600",
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(11,18,32,0.70)", marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.75)",
                    borderRadius: 14,
                    padding: 14,
                    fontSize: 15,
                    color: "#0B1220",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.45)",
                    fontWeight: "600",
                  }}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={() => setView("main")}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 14,
                borderRadius: 999,
                backgroundColor: "#4F46E5",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                Save Changes
              </Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setView("main")}
              activeOpacity={0.9}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================
  // DETAILED STATS VIEW
  // ============================================
  if (view === "stats") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 100,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Your Stats
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  Detailed progress tracking
                </Text>
              </View>
            </View>

            {/* Overall Progress */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 18,
                  textAlign: "center",
                }}
              >
                Overall Progress
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 32, fontWeight: "900", color: "#4F46E5" }}>12</Text>
                  <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                    Days Active
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 32, fontWeight: "900", color: "#4F46E5" }}>47</Text>
                  <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                    Sessions
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 32, fontWeight: "900", color: "#4F46E5" }}>8</Text>
                  <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 4, fontWeight: "700" }}>
                    Day Streak
                  </Text>
                </View>
              </View>
            </View>

            {/* Activity Breakdown */}
            <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 16,
                }}
              >
                Activity Breakdown
              </Text>

              {[
                { emoji: "🧠", label: "Mental Workouts", count: 23, color: "#4F46E5" },
                { emoji: "🌬️", label: "Breathing Sessions", count: 15, color: "#10B981" },
                { emoji: "📝", label: "Journal Entries", count: 9, color: "#F59E0B" },
              ].map((item, idx) => (
                <View key={idx} style={{ marginBottom: idx < 2 ? 14 : 0 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ fontSize: 20, marginRight: 10 }}>{item.emoji}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0B1220" }}>
                        {item.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "900", color: item.color }}>
                      {item.count}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: "rgba(11,18,32,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${(item.count / 50) * 100}%`,
                        backgroundColor: item.color,
                        borderRadius: 999,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* This Week */}
            <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 16,
                }}
              >
                This Week
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                  const active = idx < 5; // Mock: 5 days active this week
                  return (
                    <View key={idx} style={{ alignItems: "center" }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: active ? "rgba(79,70,229,0.18)" : "rgba(11,18,32,0.06)",
                          borderWidth: 2,
                          borderColor: active ? "#4F46E5" : "rgba(11,18,32,0.10)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{active ? "✓" : ""}</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(11,18,32,0.65)" }}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <Text style={{ marginTop: 10, fontSize: 13, fontWeight: "800", color: "rgba(11,18,32,0.70)", textAlign: "center" }}>
                5 of 7 days completed this week 🎉
              </Text>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setView("main")}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Profile
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================
  // SETTINGS VIEW
  // ============================================
  if (view === "settings") {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 100,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 30, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.2 }}>
                  Settings
                </Text>
                <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                  Customize your experience
                </Text>
              </View>
            </View>

            {/* Preferences */}
            <View
              style={{
                marginTop: 32,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 16,
                }}
              >
                Preferences
              </Text>

              {[
                { emoji: "🔔", label: "Daily Reminders", desc: "Get notified to practice" },
                { emoji: "🌙", label: "Dark Mode", desc: "Coming soon" },
                { emoji: "🎵", label: "Sound Effects", desc: "Play sounds in app" },
                { emoji: "📊", label: "Analytics", desc: "Track detailed metrics" },
              ].map((setting, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    borderBottomWidth: idx < 3 ? 1 : 0,
                    borderBottomColor: "rgba(11,18,32,0.08)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Text style={{ fontSize: 24, marginRight: 14 }}>{setting.emoji}</Text>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: "#0B1220" }}>
                        {setting.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: "rgba(11,18,32,0.65)", marginTop: 2 }}>
                        {setting.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: idx === 0 || idx === 2 ? "#4F46E5" : "rgba(11,18,32,0.15)",
                      padding: 2,
                      justifyContent: "center",
                      alignItems: idx === 0 || idx === 2 ? "flex-end" : "flex-start",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#fff",
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Account Actions */}
            <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,255,255,0.65)",
                borderRadius: 24,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 16,
                }}
              >
                Account
              </Text>

              {[
                { emoji: "💬", label: "Support & Feedback", color: "#4F46E5" },
                { emoji: "📄", label: "Privacy Policy", color: "#4F46E5" },
                { emoji: "🚪", label: "Log Out", color: "#EF4444" },
              ].map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                    borderBottomWidth: idx < 2 ? 1 : 0,
                    borderBottomColor: "rgba(11,18,32,0.08)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, marginRight: 14 }}>{action.emoji}</Text>
                    <Text style={{ fontSize: 15, fontWeight: "900", color: action.color }}>
                      {action.label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, color: "rgba(11,18,32,0.40)" }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* App Version */}
            <Text style={{ marginTop: 20, fontSize: 12, color: "rgba(11,18,32,0.55)", textAlign: "center", fontWeight: "700" }}>
              Manas v1.0.0
            </Text>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setView("main")}
              activeOpacity={0.9}
              style={{
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(255,255,255,0.28)",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "rgba(11,18,32,0.80)", fontWeight: "900" }}>
                Back to Profile
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return null;
}



// --- Calm Select Screen (3 options) ---

function CalmSelectScreen({ goHome, goToBreathing, goToSleepLibrary, goToSoundLibrary }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text style={styles.appTitle}>Select Your Preferred Activity</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to unwind and recharge.
        </Text>

        {/* Breathing Card */}
        <View style={[styles.card, { marginTop: 32 }]}>
          <Text style={styles.sectionLabel}>Option 1</Text>
          <Text style={styles.cardTitle}>🌬️ Breathing</Text>
          <Text style={styles.cardText}>
            Guided breathing exercises to calm your mind and regulate your nervous system.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToBreathing}
          >
            <Text style={styles.primaryButtonText}>Start Breathing</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Library Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>Option 2</Text>
          <Text style={styles.cardTitle}>😴 Sleep Library</Text>
          <Text style={styles.cardText}>
            Explore calming content designed to help you drift into restful sleep.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToSleepLibrary}
          >
            <Text style={styles.primaryButtonText}>Explore Sleep Library</Text>
          </TouchableOpacity>
        </View>

        {/* Sound Library Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>Option 3</Text>
          <Text style={styles.cardTitle}>🎵 Sound Library</Text>
          <Text style={styles.cardText}>
            Ambient sounds and calming music to create a peaceful atmosphere.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToSoundLibrary}
          >
            <Text style={styles.primaryButtonText}>Explore Sounds</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


// --- Sleep Library Screen ---
function SleepLibraryScreen({ goHome, goBack, goToVisualizations }) {
  const [expandedId, setExpandedId] = useState(null);

  const sleepCategories = [
    {
      id: "visualizations",
      title: "Visualizations",
      emoji: "💭",
      description: "Mental imagery exercises",
      expandedDescription: "Guided reflections to process your day and quiet racing thoughts.",
      onStart: goToVisualizations,
    },
    {
      id: "landscapes",
      title: "Landscapes",
      emoji: "🌌",
      description: "Calming visual journeys",
      expandedDescription: "Immersive 3D environments and calming visual journeys to help you unwind.",
    },
    {
      id: "stretches",
      title: "Stretches",
      emoji: "🧘",
      description: "Gentle bedtime stretches",
      expandedDescription: "Gentle bedtime stretches to release tension and prepare your body for sleep.",
    },
    {
      id: "mythology",
      title: "Mythology",
      emoji: "📖",
      description: "Ancient stories for sleep",
      expandedDescription: "Soothing stories from ancient myths.",
    },
    {
      id: "sleepcasts",
      title: "Sleepcasts",
      emoji: "🎙️",
      description: "Quiet radio-style conversations",
      expandedDescription: "A quiet radio-style conversation to listen to as you drift off.",
    },
  ];
   

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <LinearGradient
      colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 46,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: "#4F46E5" }}>
                Sleep Library
              </Text>
              <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.72)" }}>
                Pick a way to unwind
              </Text>
            </View>
          </View>

          {/* Categories */}
          {sleepCategories.map((category, index) => {
            const isExpanded = expandedId === category.id;
           
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.9}
                onPress={() => toggleExpand(category.id)}
                style={{
                  marginTop: index === 0 ? 24 : 16,
                  backgroundColor: isExpanded
                    ? "rgba(255,255,255,0.75)"
                    : "rgba(255,255,255,0.65)",
                  borderRadius: 24,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isExpanded
                    ? "rgba(79,70,229,0.35)"
                    : "rgba(255,255,255,0.35)",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "900",
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "rgba(11,18,32,0.70)",
                  }}
                >
                  Category {index + 1}
                </Text>

                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 20,
                    fontWeight: "900",
                    color: "#0B1220",
                  }}
                >
                  {category.emoji} {category.title}
                </Text>

                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 14,
                    lineHeight: 20,
                    color: "rgba(11,18,32,0.68)",
                  }}
                >
                  {category.description}
                </Text>

                {/* Expanded content */}
                {isExpanded && (
                  <>
                    <View
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: "rgba(79,70,229,0.15)",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: "rgba(11,18,32,0.75)",
                          fontStyle: "italic",
                        }}
                      >
                        {category.expandedDescription}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        if (category.onStart) {
                          category.onStart();
                        } else {
                          console.log(`Starting: ${category.title}`);
                        }
                      }}
                      style={{
                        marginTop: 14,
                        paddingVertical: 13,
                        borderRadius: 999,
                        alignItems: "center",
                        backgroundColor: "#4F46E5",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                        Start
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Tap indicator */}
                <Text
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    fontWeight: "800",
                    color: isExpanded ? "#4F46E5" : "rgba(11,18,32,0.50)",
                    textAlign: "center",
                  }}
                >
                  {isExpanded ? "Tap again to close" : "Tap to learn more"}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Navigation buttons */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
              backgroundColor: "rgba(255,255,255,0.45)",
              alignItems: "center",
            }}
            onPress={goBack}
          >
            <Text style={{ fontWeight: "900", color: "rgba(11,18,32,0.80)" }}>
              Back to Activities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: 12,
              paddingVertical: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
              backgroundColor: "rgba(255,255,255,0.45)",
              alignItems: "center",
            }}
            onPress={goHome}
          >
            <Text style={{ fontWeight: "900", color: "rgba(11,18,32,0.80)" }}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Visualizations Screen ---
function VisualizationsScreen({ goHome, goBack }) {
  const [selected, setSelected] = useState(null);
 
  // Full Sound Library player state (same as SoundLibraryScreen)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const currentTrack = ALL_TRACKS[currentIndex];
  const [musicExpanded, setMusicExpanded] = useState(false);
 
  // tap-to-seek refs
  const progressWidthRef = useRef(1);
  const volumeWidthRef = useRef(1);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 1);
    setIsPlaying(status.isPlaying || false);
  };

  const loadAndPlay = async (track) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource(track.audio),
        { shouldPlay: true, volume, isLooping },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (e) {
      console.log("Error loading sound", e);
    }
  };

  const togglePlay = async () => {
    try {
      if (!sound) {
        await loadAndPlay(currentTrack);
        return;
      }
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (e) {
      console.log("togglePlay error", e);
    }
  };

  const nextTrack = async () => {
    const next = (currentIndex + 1) % SOUND_LIBRARY.length;
    setCurrentIndex(next);
    setSound(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(1);
    await loadAndPlay(SOUND_LIBRARY[next]);
  };

  const prevTrack = async () => {
    const prev = currentIndex === 0 ? SOUND_LIBRARY.length - 1 : currentIndex - 1;
    setCurrentIndex(prev);
    setSound(null);
    setIsPlaying(false);
    setPosition(0);
    setDuration(1);
    await loadAndPlay(SOUND_LIBRARY[prev]);
  };

  const applyLooping = async (nextLooping) => {
    try {
      setIsLooping(nextLooping);
      if (sound) await sound.setIsLoopingAsync(nextLooping);
    } catch (e) {
      console.log("Looping error", e);
    }
  };

  const applyVolume = async (nextVol) => {
    try {
      const clamped = Math.max(0, Math.min(1, nextVol));
      setVolume(clamped);
      if (sound) await sound.setVolumeAsync(clamped);
    } catch (e) {
      console.log("Volume error", e);
    }
  };

  const progress = duration ? position / duration : 0;

  const formatTime = (ms) => {
    const totalSec = Math.floor((ms || 0) / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const seekTo = async (ratio) => {
    try {
      if (!sound) return;
      const clamped = Math.max(0, Math.min(1, ratio));
      const newPos = Math.floor(clamped * duration);
      await sound.setPositionAsync(newPos);
    } catch (e) {
      console.log("seek error", e);
    }
  };

  const visualisations = [
    {
      id: 1,
      title: "Hope and Resilience",
      theme: "Building strength through hardship",
      steps: [
        {
          heading: "Get Ready",
          text: "Find a comfortable place to sit with your back straight and eyes closed. Take 5 deep breaths and let it out. Let your body grow still and relax.",
        },
        {
          heading: "Situation",
          text: "Try to focus on the current challenge or issue in front of you. It could be unemployment, divorce, or just a bad day. Feel the emotions that come along with that.",
        },
        {
          heading: "Cultivate Hope",
          text: "Start by seeing yourself getting through it and on the other side of the hardship. What does it look like? What are you doing? Who else is there? Rehearse all the different ways you can come out strong on the other side of the hardship. Create hope in your vision.",
        },
        {
          heading: "Celebrate",
          text: "Take it even further and see yourself celebrating after. What would you do? Spend a few minutes here. Feel the relief and gratitude.",
        },
        {
          heading: "Close with Hope",
          text: "Take five more deep breaths, a moment of stillness and gently open your eyes.",
        },
      ],
    },
    {
      id: 2,
      title: "Releasing Anxiety",
      theme: "Let go of worry and tension",
      steps: [
        {
          heading: "Prepare",
          text: "Find a comfortable position and close your eyes. Move your body to release tension, take five deep breaths and a moment of stillness.",
        },
        {
          heading: "Locate the Anxiety in Your Body",
          text: "Take a moment to think about what is making you anxious. Bring it to the present. Notice where in your body you are feeling the anxiety. Is it in your head? Gut? Chest? What does it feel like? Is the sensation heavy? Tight?",
        },
        {
          heading: "Visualise the Anxiety",
          text: "Now visualise what this anxiety looks like in the body. Give it colour, a shape or even make it a character/animal. Is it hot? Is it cold? It could be a green goblin on your shoulder, an ice cube in your head or a fire in your belly — this is your imagination's way of processing the emotion. And now just sit with it. Don't try to run away or ignore it. Let the feeling do its thing.",
        },
        {
          heading: "Let It Get Bigger",
          text: "This might get a bit uncomfortable now, but stay with it. Allow the shape/character to get bigger and bigger. Feel it.",
        },
        {
          heading: "Shrink the Image",
          text: "And now, using your mind, let this image get smaller and smaller. You can be as creative as you like with how you want to make this happen. Do you pour water on it? Do you kill it? Do you just let it dissolve?",
        },
        {
          heading: "Repeat",
          text: "Keep repeating this until the image gets so small it's the size of a pea.",
        },
        {
          heading: "Release",
          text: "Take a deep breath and on the exhale, let the image dissolve and be released.",
        },
        {
          heading: "Locate Again",
          text: "Take your awareness back to the area in your body and notice the change you feel.",
        },
        {
          heading: "Continue",
          text: "Repeat this as many times as you need to until the intensity of the anxiety becomes less consuming and you feel relief.",
        },
        {
          heading: "Close with Lightness",
          text: "Take five more deep breaths, a moment of stillness and gently open your eyes.",
        },
      ],
    },
    {
      id: 3,
      title: "Deep Relaxation",
      theme: "Complete stillness and peace",
      steps: [
        {
          heading: "Prepare",
          text: "Find a comfortable position and close your eyes. Move your body to release tension, take five deep breaths and a moment of stillness. With every exhale, release any tension or tightness in your body. Unclench your jaw. Soften your eyes. Then take a moment of stillness.",
        },
        {
          heading: "Locate",
          text: "Imagine that you are sitting on a bench by a lake. Feel your feet on the ground. Feel the sun on your face. It's warm. Feel the gentle breeze on your body. Listen to the birds overhead.",
        },
        {
          heading: "Awareness",
          text: "Now, focus on the water in front of you. It's extremely blue and calm. You can hear the gentle flow of it. There is no one else around, there is nowhere else to be and nothing else to do. Just be.",
        },
        {
          heading: "Stillness",
          text: "Stay here for a few moments until you find complete stillness in the mind and relief in the body. If your mind starts to wander, bring it back to the lake and your feet on the ground.",
        },
        {
          heading: "Immerse in Water",
          text: "Now, imagine the water filling your whole body. Start from your head. It's cool and relaxing. It flows from your head, to your chest, your arms, your stomach, your legs, to your chest and your feet. The water relaxes your body.",
        },
        {
          heading: "Close with Calmness",
          text: "Stay here for as long as you like and when you are ready, take five more deep breaths, a moment of stillness and gently open your eyes.",
        },
      ],
    },
  ];

  if (selected) {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Background aura blobs */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 90,
                left: -70,
                width: 240,
                height: 240,
                borderRadius: 120,
                backgroundColor: "rgba(255,255,255,0.18)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: 110,
                right: -90,
                width: 280,
                height: 280,
                borderRadius: 140,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 46 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#0B1220" }}>{selected.title}</Text>
            <Text style={{ marginTop: 6, fontSize: 14, color: "rgba(11,18,32,0.70)" }}>{selected.theme}</Text>

            {/* Compact Music Player */}
<View style={{ marginTop: 24 }}>
  {/* Mini Player - Always Visible */}
  <View style={{ backgroundColor: "rgba(255,255,255,0.45)", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)" }}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* Album Art */}
      <Image
        source={{ uri: currentTrack.image }}
        style={{ width: 70, height: 70, borderRadius: 14, marginRight: 14 }}
      />

      {/* Track Info */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "900", color: "#0B1220" }}>
          {currentTrack.title}
        </Text>
        <Text style={{ marginTop: 3, fontSize: 12, color: "rgba(11,18,32,0.65)" }}>
          {currentTrack.mood}
        </Text>
        <Text style={{ marginTop: 4, fontSize: 11, fontWeight: "800", color: "rgba(11,18,32,0.55)" }}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>

      {/* Compact Controls */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity
          onPress={prevTrack}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.65)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 14 }}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlay}
          activeOpacity={0.7}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#4F46E5",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 15, color: "#fff" }}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={nextTrack}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.65)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14 }}>⏭</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* Progress Bar */}
    <View
      onLayout={(e) => (progressWidthRef.current = e.nativeEvent.layout.width || 1)}
      onStartShouldSetResponder={() => true}
      onResponderRelease={(e) => {
        const x = e.nativeEvent.locationX;
        seekTo(x / (progressWidthRef.current || 1));
      }}
      style={{
        marginTop: 14,
        width: "100%",
        height: 6,
        borderRadius: 999,
        backgroundColor: "rgba(11,18,32,0.12)",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${Math.min(1, progress) * 100}%`,
          backgroundColor: "rgba(79,70,229,0.85)",
        }}
      />
    </View>

    {/* Expand/Collapse Button */}
    <TouchableOpacity
      onPress={() => setMusicExpanded(!musicExpanded)}
      activeOpacity={0.9}
      style={{
        marginTop: 12,
        paddingVertical: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color: "rgba(11,18,32,0.70)" }}>
        {musicExpanded ? "▲" : "▼"}
      </Text>
    </TouchableOpacity>
  </View>

  {/* Full Player - Expandable */}
  {musicExpanded && (
    <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 26, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)" }}>
      <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.65)", marginBottom: 12 }}>
        Full Music Controls
      </Text>

      {/* Large Album Art */}
      <Image source={{ uri: currentTrack.image }} style={{ width: "100%", height: 190, borderRadius: 18 }} />

      {/* Loop + Volume Controls */}
      <View
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.22)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)",
        }}
      >
        {/* Loop */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "900", color: "rgba(11,18,32,0.75)" }}>
            Loop
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => applyLooping(!isLooping)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: isLooping ? "rgba(79,70,229,0.20)" : "rgba(11,18,32,0.10)",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "900", color: isLooping ? "#4F46E5" : "rgba(11,18,32,0.75)" }}>
              {isLooping ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Volume */}
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "900", color: "rgba(11,18,32,0.75)" }}>
              Volume
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "900", color: "rgba(11,18,32,0.60)" }}>
              {Math.round(volume * 100)}%
            </Text>
          </View>

          <View
            onLayout={(e) => (volumeWidthRef.current = e.nativeEvent.layout.width || 1)}
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => {
              const x = e.nativeEvent.locationX;
              applyVolume(x / (volumeWidthRef.current || 1));
            }}
            style={{
              marginTop: 8,
              height: 10,
              borderRadius: 999,
              backgroundColor: "rgba(11,18,32,0.12)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(1, volume)) * 100}%`,
                backgroundColor: "rgba(79,70,229,0.70)",
              }}
            />
          </View>

          <Text style={{ marginTop: 6, fontSize: 11, fontWeight: "800", color: "rgba(11,18,32,0.55)" }}>
            Tap the bar to change volume
          </Text>
        </View>
      </View>

      {/* Track Selection */}
      <View style={{ marginTop: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.65)", marginBottom: 10 }}>
          Select Track
        </Text>
        {SOUND_LIBRARY.map((track, index) => {
          const active = index === currentIndex;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.9}
              onPress={async () => {
                setCurrentIndex(index);
                setSound(null);
                setIsPlaying(false);
                setPosition(0);
                setDuration(1);
                await loadAndPlay(track);
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 18,
                marginBottom: 8,
                backgroundColor: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                borderWidth: 1,
                borderColor: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.32)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontWeight: "900", color: "#0B1220" }}>{track.title}</Text>
                  <Text style={{ fontSize: 12, marginTop: 2, color: "rgba(11,18,32,0.62)" }}>{track.mood}</Text>
                </View>

                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? "rgba(79,70,229,0.18)" : "rgba(11,18,32,0.10)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: active ? "#4F46E5" : "rgba(11,18,32,0.75)",
                    }}
                  >
                    {active ? (isPlaying ? "Playing" : "Paused") : "Select"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  )}
</View>

            {/* Visualization Steps */}
            <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 26, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)" }}>
              <Text style={{ fontSize: 12, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(11,18,32,0.65)" }}>Visualization Steps</Text>
              {selected.steps.map((step, idx) => (
                <View key={idx} style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0B1220", marginBottom: 6 }}>
                    {step.heading}
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(11,18,32,0.70)", lineHeight: 20 }}>{step.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.secondaryButtonOutline}
              onPress={() => {
                setSelected(null);
                if (sound) {
                  sound.unloadAsync();
                  setSound(null);
                  setIsPlaying(false);
                }
              }}
            >
              <Text style={styles.secondaryButtonOutlineText}>Back to Visualizations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={goHome}>
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.appTitle}>Visualizations</Text>
        <Text style={styles.subtitle}>
          Guided mental imagery exercises to transform emotions and find inner peace.
        </Text>

        {visualisations.map((vis) => (
          <View key={vis.id} style={[styles.card, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>Visualization {vis.id}</Text>
            <Text style={styles.cardTitle}>{vis.title}</Text>
            <Text style={[styles.cardText, { fontStyle: "italic" }]}>
              Theme: {vis.theme}
            </Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => setSelected(vis)}>
              <Text style={styles.primaryButtonText}>Open Visualization</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.secondaryButtonOutline} onPress={goBack}>
          <Text style={styles.secondaryButtonOutlineText}>Back to Sleep Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={goHome}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ⬇️ SoundLibraryScreen Code


// --- Workout Menu Screen (bank of game options) ---

function WorkoutMenuScreen({
  goHome,
  goToMemory,
  goToFocus,
  goToMindSwitch,
  goToReaction,
}) {

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text style={styles.appTitle}>Daily Workout</Text>
        <Text style={styles.subtitle}>
          Choose an exercise to train your mind today.
        </Text>

        {/* Memory Game */}
        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Game 1</Text>
          <Text style={styles.cardTitle}>Sequence Memory</Text>
          <Text style={styles.cardText}>
            Memorise a short sequence of numbers and tap them back in order.
            Trains short-term memory and concentration.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToMemory}
          >
            <Text style={styles.primaryButtonText}>Start Memory Game</Text>
          </TouchableOpacity>
        </View>

        {/* Focus / Stroop Game */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>Game 2</Text>
          <Text style={styles.cardTitle}>Colour Focus</Text>
          <Text style={styles.cardText}>
            A Stroop-style task: the word says one colour but is printed in
            another. Tap the ink colour, not the word. Trains focus and
            cognitive control.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={goToFocus}>
            <Text style={styles.primaryButtonText}>Start Focus Game</Text>
          </TouchableOpacity>
        </View>

        {/* Mind Switch / Rule Flip Game */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>Game 3</Text>
          <Text style={styles.cardTitle}>Rule Switch</Text>
          <Text style={styles.cardText}>
            Start with one rule (tap red circles) and then switch to a new rule
            (tap blue squares). Trains cognitive flexibility and adaptation.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToMindSwitch}
          >
            <Text style={styles.primaryButtonText}>Start Rule Switch</Text>
          </TouchableOpacity>
        </View>

        {/* Reaction Journey Game */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionLabel}>Game 4</Text>
          <Text style={styles.cardTitle}>Reaction Journey</Text>
          <Text style={styles.cardText}>
            Wait for the circle to turn green and tap as fast as you can.
            Trains reaction speed and impulse control.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToReaction}
          >
            <Text style={styles.primaryButtonText}>Start Reaction Journey</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Memory Exercise Screen (3 rounds + stats) ---

function MemoryExerciseScreen({ goHome, goToCalmSelect }) {
  const MAX_ROUNDS = 3;

  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [showSequence, setShowSequence] = useState(true);
  const [message, setMessage] = useState("Memorise the sequence");
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("playing"); // "playing" | "summary"

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const timeoutRef = useRef(null);
  const inputDisabled = showSequence || phase !== "playing";

  useEffect(() => {
    if (phase !== "playing" || round > MAX_ROUNDS) return;
    startNewRound();
  }, [round, phase]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startNewRound = () => {
    const length = 3;
    const newSeq = Array.from({ length }, () =>
      Math.floor(Math.random() * 4) + 1
    );

    setSequence(newSeq);
    setUserInput([]);
    setShowSequence(true);
    setMessage("Memorise the sequence");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShowSequence(false);
      setMessage("Tap the buttons in the same order");
    }, 2500);
  };

  const finishSequence = (wasCorrect) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (wasCorrect) {
      setCorrectCount((c) => c + 1);
      setCurrentStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setMessage("Great job! New sequence coming up…");
    } else {
      setWrongCount((w) => w + 1);
      setCurrentStreak(0);
      setMessage("Oops, not quite. New sequence coming up…");
    }

    if (round >= MAX_ROUNDS) {
      timeoutRef.current = setTimeout(() => {
        setPhase("summary");
        setMessage("Workout complete!");
      }, 800);
    } else {
      timeoutRef.current = setTimeout(() => {
        setRound((r) => r + 1);
      }, 800);
    }
  };

  const handlePress = (num) => {
    if (inputDisabled) return;

    const nextInput = [...userInput, num];
    setUserInput(nextInput);

    const index = nextInput.length - 1;

    if (sequence[index] !== num) {
      finishSequence(false);
      return;
    }

    if (nextInput.length === sequence.length) {
      finishSequence(true);
      return;
    }
  };

  const accuracy =
    correctCount + wrongCount === 0
      ? 0
      : Math.round((correctCount / (correctCount + wrongCount)) * 100);

  const sequenceText =
    sequence.length === 0 ? "…" : sequence.join("  •  ");

  if (phase === "summary") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text style={styles.appTitle}>Workout Summary</Text>
          <Text style={styles.subtitle}>
            You completed {MAX_ROUNDS} rounds of memory training.
          </Text>

          <View style={[styles.card, { marginTop: 32 }]}>
            <Text style={styles.sectionLabel}>Results</Text>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.cardText}>
                ✅ Correct sequences: {correctCount}
              </Text>
              <Text style={styles.cardText}>
                ❌ Incorrect sequences: {wrongCount}
              </Text>
              <Text style={styles.cardText}>🎯 Accuracy: {accuracy}%</Text>
              <Text style={styles.cardText}>
                🔁 Best correct streak: {bestStreak}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>What&apos;s next?</Text>
            <Text style={styles.cardText}>
              You can move into Calm Mode to slow down your breathing and let
              your mind settle, or go back home and try another game later.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={goToCalmSelect}
          >
            <Text style={styles.primaryButtonText}>Go to Calm Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonOutline}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Playing phase
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text style={styles.appTitle}>Memory Exercise</Text>
        <Text style={styles.subtitle}>
          Round {round} of {MAX_ROUNDS}. Train your short-term memory.
        </Text>

        <View style={[styles.card, { marginTop: 32 }]}>
          <Text style={styles.sectionLabel}>Sequence</Text>
          {showSequence ? (
            <Text style={[styles.quoteText, { textAlign: "center" }]}>
              {sequenceText}
            </Text>
          ) : (
            <Text
              style={[
                styles.cardText,
                { textAlign: "center", fontStyle: "italic" },
              ]}
            >
              Sequence hidden. Tap the buttons in the same order.
            </Text>
          )}
        </View>

        <View style={[styles.card, { marginTop: 24, alignItems: "center" }]}>
          <Text style={styles.sectionLabel}>Your input</Text>
          <Text style={[styles.cardText, { textAlign: "center" }]}>
            {userInput.length === 0
              ? "Waiting for your taps…"
              : userInput.join("  •  ")}
          </Text>

          <View style={styles.numberButtonRow}>
            {[1, 2, 3, 4].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.numberButton,
                  inputDisabled && { opacity: 0.4 },
                ]}
                onPress={() => handlePress(n)}
                disabled={inputDisabled}
              >
                <Text style={styles.numberButtonText}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.breathingHint, { marginTop: 16 }]}>
            {message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Focus / Stroop Game Screen ---

const COLOR_OPTIONS = [
  { id: "red", label: "RED", textColor: "#B91C1C", bgColor: "#FEE2E2" },
  { id: "blue", label: "BLUE", textColor: "#1D4ED8", bgColor: "#DBEAFE" },
  { id: "green", label: "GREEN", textColor: "#15803D", bgColor: "#DCFCE7" },
  { id: "yellow", label: "YELLOW", textColor: "#CA8A04", bgColor: "#FEF9C3" },
];

const TOTAL_TRIALS = 8;

function createStimulus() {
  const wordOption =
    COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
  let colorOption =
    COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];

  // 70% of the time, make word and color different (incongruent)
  if (Math.random() < 0.7) {
    while (colorOption.id === wordOption.id) {
      colorOption =
        COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
    }
  }

  return {
    wordLabel: wordOption.label,
    inkColorId: colorOption.id,
  };
}

function getColorById(id) {
  return COLOR_OPTIONS.find((c) => c.id === id) || COLOR_OPTIONS[0];
}

function FocusGameScreen({ goHome, goToCalmSelect }) {
  const [trial, setTrial] = useState(1);
  const [stimulus, setStimulus] = useState(createStimulus());
  const [phase, setPhase] = useState("playing"); // "playing" | "summary"
  const [message, setMessage] = useState(
    "Tap the COLOUR of the word, not the text."
  );

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);

  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (phase === "playing") {
      startTimeRef.current = Date.now();
    }
  }, [trial, phase]);

  const handleAnswer = (colorId) => {
    if (phase !== "playing") return;

    const now = Date.now();
    const rt = now - startTimeRef.current;
    setReactionTimes((prev) => [...prev, rt]);

    const isCorrect = colorId === stimulus.inkColorId;

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setMessage("Nice focus. Keep going.");
    } else {
      setWrongCount((w) => w + 1);
      setMessage("Tricky! Remember to choose the ink colour.");
    }

    if (trial >= TOTAL_TRIALS) {
      setPhase("summary");
    } else {
      setTrial((t) => t + 1);
      setStimulus(createStimulus());
    }
  };

  const totalAnswers = correctCount + wrongCount;
  const accuracy =
    totalAnswers === 0
      ? 0
      : Math.round((correctCount / totalAnswers) * 100);

  const averageRT =
    reactionTimes.length === 0
      ? 0
      : Math.round(
          reactionTimes.reduce((sum, v) => sum + v, 0) / reactionTimes.length
        );

  const inkColor = getColorById(stimulus.inkColorId).textColor;

  if (phase === "summary") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text style={styles.appTitle}>Focus Game Summary</Text>
          <Text style={styles.subtitle}>
            You completed {TOTAL_TRIALS} colour-focus trials.
          </Text>

          <View style={[styles.card, { marginTop: 32 }]}>
            <Text style={styles.sectionLabel}>Results</Text>
            <Text style={styles.cardText}>✅ Correct: {correctCount}</Text>
            <Text style={styles.cardText}>❌ Incorrect: {wrongCount}</Text>
            <Text style={styles.cardText}>🎯 Accuracy: {accuracy}%</Text>
            <Text style={styles.cardText}>
              ⚡ Average reaction time: {averageRT} ms
            </Text>
          </View>

          <View style={[styles.card, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>Interpretation</Text>
            <Text style={styles.cardText}>
              This task measures how well you can ignore automatic reading and
              focus on pure colour. Over time, you may notice improvements in
              accuracy and speed as your focus strengthens.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={goToCalmSelect}
          >
            <Text style={styles.primaryButtonText}>Go to Calm Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonOutline}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Playing phase
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text style={styles.appTitle}>Colour Focus</Text>
        <Text style={styles.subtitle}>
          Trial {trial} of {TOTAL_TRIALS}. Tap the ink colour, not the word.
        </Text>

        <View style={[styles.card, { marginTop: 32, alignItems: "center" }]}>
          <Text style={styles.sectionLabel}>Focus word</Text>
          <Text style={[styles.focusWord, { color: inkColor }]}>
            {stimulus.wordLabel}
          </Text>
          <Text
            style={[
              styles.cardText,
              { marginTop: 8, textAlign: "center" },
            ]}
          >
            Which colour is this word printed in?
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Choose the colour</Text>

          {COLOR_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.focusOptionButton,
                { backgroundColor: option.bgColor },
              ]}
              onPress={() => handleAnswer(option.id)}
            >
              <Text
                style={[
                  styles.focusOptionLabel,
                  { color: option.textColor },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.breathingHint, { marginTop: 16 }]}>
            {message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Mind Switch / Rule Flip Game Screen ---

const SWITCH_RULES = [
  {
    id: 1,
    description: "Rule 1: Tap if the shape is a RED CIRCLE.",
    targetShape: "circle",
    targetColor: "red",
  },
  {
    id: 2,
    description: "Rule 2: Tap if the shape is a BLUE SQUARE.",
    targetShape: "square",
    targetColor: "blue",
  },
];

const SWITCH_SHAPES = ["circle", "square"];
const SWITCH_COLORS = ["red", "blue"];

const SWITCH_COLOR_STYLES = {
  red: "#F87171",
  blue: "#60A5FA",
};

const TOTAL_SWITCH_TRIALS = 12;

function createSwitchStimulus() {
  const shape =
    SWITCH_SHAPES[Math.floor(Math.random() * SWITCH_SHAPES.length)];
  const color =
    SWITCH_COLORS[Math.floor(Math.random() * SWITCH_COLORS.length)];
  return { shape, color };
}

function MindSwitchGameScreen({ goHome, goToCalm }) {
  const [trial, setTrial] = useState(1);
  const [ruleIndex, setRuleIndex] = useState(0); // 0 -> rule 1, 1 -> rule 2
  const [stimulus, setStimulus] = useState(createSwitchStimulus());
  const [phase, setPhase] = useState("playing"); // "playing" | "summary"
  const [message, setMessage] = useState(
    "Decide quickly: does this shape match the rule?"
  );

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);

  const startTimeRef = useRef(Date.now());

  const currentRule = SWITCH_RULES[ruleIndex];

  useEffect(() => {
    if (phase === "playing") {
      startTimeRef.current = Date.now();
    }
  }, [trial, phase, ruleIndex]);

  // When we cross halfway, switch rules
  useEffect(() => {
    const halfPoint = TOTAL_SWITCH_TRIALS / 2 + 1;
    if (trial === halfPoint) {
      setRuleIndex(1);
      setMessage(
        "Rule change: Now tap ONLY if the shape is a BLUE SQUARE."
      );
    }
  }, [trial]);

  const isMatch = (stim, rule) =>
    stim.shape === rule.targetShape && stim.color === rule.targetColor;

  const handleResponse = (didTap) => {
    if (phase !== "playing") return;

    const now = Date.now();
    const rt = now - startTimeRef.current;
    setReactionTimes((prev) => [...prev, rt]);

    const match = isMatch(stimulus, currentRule);
    const isCorrect =
      (didTap && match) || (!didTap && !match);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setMessage("Nice adaptation. Keep going.");
    } else {
      setWrongCount((w) => w + 1);
      setMessage("Tricky! Recheck the current rule.");
    }

    if (trial >= TOTAL_SWITCH_TRIALS) {
      setPhase("summary");
    } else {
      setTrial((t) => t + 1);
      setStimulus(createSwitchStimulus());
    }
  };

  const totalAnswers = correctCount + wrongCount;
  const accuracy =
    totalAnswers === 0
      ? 0
      : Math.round((correctCount / totalAnswers) * 100);

  const averageRT =
    reactionTimes.length === 0
      ? 0
      : Math.round(
          reactionTimes.reduce((sum, v) => sum + v, 0) /
            reactionTimes.length
        );

  const shapeSize = 80;
  const shapeStyle = [
    styles.switchShapeBase,
    stimulus.shape === "circle" && styles.switchShapeCircle,
    {
      backgroundColor:
        SWITCH_COLOR_STYLES[stimulus.color] || "#E5E7EB",
      width: shapeSize,
      height: shapeSize,
    },
  ];

  if (phase === "summary") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text style={styles.appTitle}>Rule Switch Summary</Text>
          <Text style={styles.subtitle}>
            You completed {TOTAL_SWITCH_TRIALS} rule-switch trials.
          </Text>

          <View style={[styles.card, { marginTop: 32 }]}>
            <Text style={styles.sectionLabel}>Results</Text>
            <Text style={styles.cardText}>✅ Correct: {correctCount}</Text>
            <Text style={styles.cardText}>❌ Incorrect: {wrongCount}</Text>
            <Text style={styles.cardText}>🎯 Accuracy: {accuracy}%</Text>
            <Text style={styles.cardText}>
              ⚡ Average reaction time: {averageRT} ms
            </Text>
          </View>

          <View style={[styles.card, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>Why this matters</Text>
            <Text style={styles.cardText}>
              This task trains cognitive flexibility: your ability to switch
              mental rules without getting stuck on the old ones. Over time,
              you may find it easier to adjust and re-focus when plans change.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={goToCalm}
          >
            <Text style={styles.primaryButtonText}>Go to Calm Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonOutline}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Playing phase
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text style={styles.appTitle}>Rule Switch</Text>
        <Text style={styles.subtitle}>
          Trial {trial} of {TOTAL_SWITCH_TRIALS}. Decide if the shape matches
          the current rule.
        </Text>

        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Current rule</Text>
          <Text style={styles.cardText}>{currentRule.description}</Text>
        </View>

        <View
          style={[
            styles.card,
            { marginTop: 24, alignItems: "center" },
          ]}
        >
          <Text style={styles.sectionLabel}>Shape</Text>
          <View style={shapeStyle} />
          <Text
            style={[
              styles.cardText,
              { textAlign: "center", marginTop: 12 },
            ]}
          >
            Does this shape match the rule?
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 24 }]}>
          <Text style={styles.sectionLabel}>Your choice</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleResponse(true)}
          >
            <Text style={styles.primaryButtonText}>
              ✅ Matches the rule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleResponse(false)}
          >
            <Text style={styles.secondaryButtonText}>
              🚫 Does NOT match
            </Text>
          </TouchableOpacity>

          <Text style={[styles.breathingHint, { marginTop: 16 }]}>
            {message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Reaction Journey Game Screen (Stage 1) ---

const TOTAL_REACTION_TRIALS = 8;

function getRandomDelay() {
  // 800–2500ms
  return 800 + Math.floor(Math.random() * 1700);
}

function ReactionJourneyGameScreen({ goHome, goToCalm }) {
  const [trial, setTrial] = useState(1);
  const [phase, setPhase] = useState("idle"); // "idle" | "waiting" | "go" | "summary"
  const [message, setMessage] = useState(
    "When you start a trial, wait for the circle to turn green, then tap as fast as you can."
  );

  const [correctCount, setCorrectCount] = useState(0);
  const [falseStartCount, setFalseStartCount] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);

  const [isGreen, setIsGreen] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const startTrial = () => {
    if (phase === "go" || phase === "waiting") return;

    setIsGreen(false);
    setPhase("waiting");
    setMessage("Get ready… wait for green.");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const delay = getRandomDelay();
    timeoutRef.current = setTimeout(() => {
      setIsGreen(true);
      setPhase("go");
      startTimeRef.current = Date.now();
      setMessage("Tap now!");
    }, delay);
  };

  const handleTapCircle = () => {
    if (phase === "waiting") {
      // false start
      setFalseStartCount((c) => c + 1);
      setMessage("Too early! Wait for green next time.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      advanceTrial(false);
      return;
    }

    if (phase === "go") {
      const now = Date.now();
      const rt = now - startTimeRef.current;
      setReactionTimes((prev) => [...prev, rt]);
      setCorrectCount((c) => c + 1);
      setMessage(`Nice reaction! ~${rt} ms`);

      advanceTrial(true);
      return;
    }
  };

  const advanceTrial = (wasSuccess) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsGreen(false);

    if (trial >= TOTAL_REACTION_TRIALS) {
      setPhase("summary");
      return;
    }

    setTrial((t) => t + 1);
    setPhase("idle");
  };

  const averageRT =
    reactionTimes.length === 0
      ? 0
      : Math.round(
          reactionTimes.reduce((sum, v) => sum + v, 0) /
            reactionTimes.length
        );

  if (phase === "summary") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <Text style={styles.appTitle}>Reaction Journey</Text>
          <Text style={styles.subtitle}>
            Stage 1 complete. You finished {TOTAL_REACTION_TRIALS} trials.
          </Text>

          <View style={[styles.card, { marginTop: 32 }]}>
            <Text style={styles.sectionLabel}>Results</Text>
            <Text style={styles.cardText}>
              ✅ Successful reactions: {correctCount}
            </Text>
            <Text style={styles.cardText}>
              ⚠️ False starts (too early): {falseStartCount}
            </Text>
            <Text style={styles.cardText}>
              ⚡ Average reaction time: {averageRT} ms
            </Text>
          </View>

          <View style={[styles.card, { marginTop: 24 }]}>
            <Text style={styles.sectionLabel}>What this trains</Text>
            <Text style={styles.cardText}>
              This exercise challenges your ability to stay patient and then
              react quickly at the right moment. It blends impulse control
              with pure reaction speed. More stages can add distractors and
              extra rules later.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 24 }]}
            onPress={goToCalm}
          >
            <Text style={styles.primaryButtonText}>Go to Calm Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButtonOutline}
            onPress={goHome}
          >
            <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Playing phase
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32, alignItems: "center" }}
      >
        <Text style={styles.appTitle}>Reaction Journey</Text>
        <Text style={styles.subtitle}>
          Trial {trial} of {TOTAL_REACTION_TRIALS}. Wait for green, then tap.
        </Text>

        <View
          style={[
            styles.card,
            { marginTop: 32, alignItems: "center", width: "100%" },
          ]}
        >
          <Text style={styles.sectionLabel}>Target</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTapCircle}
          >
            <View
              style={[
                styles.reactionCircle,
                isGreen
                  ? styles.reactionCircleGreen
                  : styles.reactionCircleIdle,
              ]}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.cardText,
              { marginTop: 12, textAlign: "center" },
            ]}
          >
            {message}
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 24, width: "100%" }]}>
          <Text style={styles.sectionLabel}>Controls</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={startTrial}
          >
            <Text style={styles.primaryButtonText}>
              {phase === "waiting" ? "Waiting…" : "Start trial"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.breathingHint, { marginTop: 12 }]}>
            Try to relax your shoulders and breathe out slowly while you
            wait. Quick, calm reactions usually beat tense ones.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButtonOutline}
          onPress={goHome}
        >
          <Text style={styles.secondaryButtonOutlineText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  // --- Layout & global ---

safeArea: {
  flex: 1,
  backgroundColor: "#E0F2FE", // much brighter blue background

  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // --- Typography ---

  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827", // main text
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 8,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  // --- Cards ---

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
    lineHeight: 20,
  },

  // --- Buttons ---

  primaryButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: "#DBEAFE",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButtonOutline: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  secondaryButtonOutlineText: {
    color: "#374151",
    fontWeight: "500",
    fontSize: 15,
  },

  // --- Quotes / Calm copy ---

  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#111827",
    lineHeight: 26,
    marginTop: 4,
  },
 

  // --- Breathing visuals ---

 
  breathingHint: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },

  // --- Memory game buttons ---

  numberButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    width: "100%",
  },
  numberButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4F46E5",
  },

 

  // --- Focus / Stroop game ---

  focusWord: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 8,
  },
  focusOptionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  focusOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  // --- Mind Switch game shapes ---

  switchShapeBase: {
    borderRadius: 12,
  },
  switchShapeCircle: {
    borderRadius: 999,
  },

  // --- Reaction Journey circles ---

  reactionCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#D1D5DB",
    marginTop: 12,
  },
  reactionCircleIdle: {
    backgroundColor: "#E5E7EB",
  },
  reactionCircleGreen: {
    backgroundColor: "#34D399",
  },
});