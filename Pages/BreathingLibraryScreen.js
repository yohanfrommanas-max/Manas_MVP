import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  TextInput
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

function BreathingScreen({ goHome, goToCalmSelect }) {
  const SESSION_SECONDS = 60;

  const [remainingSeconds, setRemainingSeconds] = useState(SESSION_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const [sessionDone, setSessionDone] = useState(false);

  const [mode, setMode] = useState("calm");
  const [breathPhase, setBreathPhase] = useState("Inhale");
  const [phaseIndex, setPhaseIndex] = useState(0);

  const [feeling, setFeeling] = useState(null);      // ✅ ADD
const [reflection, setReflection] = useState("");  // ✅ ADD

  const scale = useRef(new Animated.Value(1)).current;

  const quotes = [
    { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
    { text: "Calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
    { text: "Slow is smooth. Smooth is steady.", author: "Manas" },
  ];

  const dailyQuote = useRef(quotes[Math.floor(Math.random() * quotes.length)]).current;

  // Breathing patterns
  const patterns = {
    calm: [
      { phase: "Inhale", duration: 4000 },
      { phase: "Hold", duration: 4000 },
      { phase: "Exhale", duration: 4000 },
      { phase: "Hold", duration: 4000 },
    ],
    focus: [
      { phase: "Inhale", duration: 4000 },
      { phase: "Hold", duration: 2000 },
      { phase: "Exhale", duration: 4000 },
      { phase: "Hold", duration: 2000 },
    ],
    sleep: [
      { phase: "Inhale", duration: 4000 },
      { phase: "Hold", duration: 7000 },
      { phase: "Exhale", duration: 8000 },
    ],
  };

  // Timer
  useEffect(() => {
    if (!isRunning || sessionDone) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSessionDone(true);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, sessionDone]);

  // Breathing loop
  useEffect(() => {
    if (!isRunning) return;

    const currentPattern = patterns[mode];
    const current = currentPattern[phaseIndex];

    setBreathPhase(current.phase);

    let animation;

    if (current.phase === "Inhale") {
      animation = Animated.timing(scale, {
        toValue: 1.2,
        duration: current.duration,
        useNativeDriver: true,
      });
    } else if (current.phase === "Exhale") {
      animation = Animated.timing(scale, {
        toValue: 0.8,
        duration: current.duration,
        useNativeDriver: true,
      });
    } else {
      animation = Animated.timing(scale, {
        toValue: scale._value,
        duration: current.duration,
        useNativeDriver: true,
      });
    }

    animation.start();

    const timeout = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % currentPattern.length);
    }, current.duration);

    return () => clearTimeout(timeout);
  }, [phaseIndex, mode, isRunning]);
  
  const restartSession = () => {
  setRemainingSeconds(SESSION_SECONDS);
  setIsRunning(true);
  setSessionDone(false);
  setPhaseIndex(0);
  setFeeling(null);
  setReflection("");
};


  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const progress = 1 - remainingSeconds / SESSION_SECONDS;

  const GRADIENT = ["#020617", "#0B1220"];

  const GlassCard = ({ children, style }) => (
    <View
      style={[
        {
          borderRadius: 22,
          padding: 16,
          backgroundColor: "#0F172A",
          borderWidth: 1,
          borderColor: "#1E293B",
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 20,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  const phaseHint = {
    Inhale: "Breathe in slowly through your nose",
    Hold: "Hold gently — no strain",
    Exhale: "Release slowly through your mouth",
  };

  return (
    <LinearGradient colors={GRADIENT} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>

          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 30, fontWeight: "900", color: "#FFF" }}>
                Calm Mode
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                Breathe with intention
              </Text>
            </View>

            <View style={{
              backgroundColor: "#1E293B",
              padding: 10,
              borderRadius: 999
            }}>
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                {minutes}:{seconds}
              </Text>
            </View>
          </View>

          {/* Quote */}
          <GlassCard style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              DAILY WISDOM
            </Text>
            <Text style={{ color: "#FFF", fontSize: 18, marginTop: 8 }}>
              {dailyQuote.text}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
              — {dailyQuote.author}
            </Text>
          </GlassCard>

          {/* Breathing */}
          <GlassCard style={{ marginTop: 16, alignItems: "center" }}>

            {/* Mode Buttons */}
            <View style={{ flexDirection: "row", width: "100%" }}>
              {["calm", "focus", "sleep"].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    setMode(m);
                    setPhaseIndex(0);
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    marginRight: m !== "sleep" ? 8 : 0,
                    borderRadius: 999,
                    backgroundColor: mode === m ? "#1D4ED8" : "#1E293B",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{
              marginTop: 10,
              color: "rgba(255,255,255,0.6)",
              fontSize: 13
            }}>
              {mode === "calm" && "Relax your body and slow your breath"}
              {mode === "focus" && "Sharpen attention and stay present"}
              {mode === "sleep" && "Wind down for deep rest"}
            </Text>

            {/* Circle */}
            <View style={{ marginTop: 20 }}>
              <View style={{
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: "#020617",
                borderWidth: 1,
                borderColor: "#1E293B",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Animated.View style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(59,130,246,0.15)",
                  borderWidth: 2,
                  borderColor: "#3B82F6",
                  transform: [{ scale }],
                  shadowColor: "#3B82F6",
                  shadowOpacity: 0.8,
                  shadowRadius: 25,
                }} />
              </View>
            </View>

            <Text style={{ color: "#FFF", fontSize: 24, marginTop: 16 }}>
              {breathPhase}
            </Text>

            <Text style={{
              color: "rgba(255,255,255,0.6)",
              marginTop: 6
            }}>
              {phaseHint[breathPhase]}
            </Text>

            {/* Progress */}
            <View style={{
              width: "100%",
              height: 8,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              marginTop: 12
            }}>
              <View style={{
                width: `${progress * 100}%`,
                height: "100%",
                backgroundColor: "#2563EB",
                borderRadius: 999
              }} />
            </View>

            {/* Button */}
            <TouchableOpacity
              onPress={() => setIsRunning(v => !v)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: 14,
                borderRadius: 999,
                backgroundColor: "#2563EB",
                alignItems: "center"
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>
                {isRunning ? "Pause Session" : "Resume Session"}
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Session Complete */}
{sessionDone && (
  <GlassCard style={{ marginTop: 16 }}>

    <Text style={{
      color: "#FFF",
      fontSize: 18,
      fontWeight: "bold"
    }}>
      Session Complete ✨
    </Text>

    <Text style={{
      color: "rgba(255,255,255,0.6)",
      marginTop: 6
    }}>
      How do you feel?
    </Text>

    <View style={{ flexDirection: "row", marginTop: 12 }}>
      {["🙂", "😐", "😞"].map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => setFeeling(m)}
          style={{
            flex: 1,
            marginRight: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: feeling === m ? "#1D4ED8" : "#1E293B",
            alignItems: "center"
          }}
        >
          <Text style={{ fontSize: 20 }}>{m}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <TextInput
      placeholder="Optional reflection..."
      placeholderTextColor="rgba(255,255,255,0.4)"
      value={reflection}
      onChangeText={setReflection}
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#020617",
        borderWidth: 1,
        borderColor: "#1E293B",
        color: "#FFF"
      }}
    />

    <TouchableOpacity
      onPress={restartSession}
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 999,
        backgroundColor: "#2563EB",
        alignItems: "center"
      }}
    >
      <Text style={{ color: "#FFF", fontWeight: "bold" }}>
        Start Again
      </Text>
    </TouchableOpacity>

  </GlassCard>
)}


          {/* Back */}
          <TouchableOpacity
            onPress={goToCalmSelect}
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#1E293B",
              backgroundColor: "#020617",
              alignItems: "center"
            }}
          >
            <Text style={{ color: "#FFF" }}>Back to Activities</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default BreathingScreen;
