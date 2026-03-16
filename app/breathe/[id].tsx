import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  withRepeat, cancelAnimation, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';
import { useColors, DARK, type Colors } from '@/constants/colors';
const C = DARK;

interface BreatheTechnique {
  id: string;
  name: string;
  description: string;
  phases: { label: string; duration: number; color: string }[];
  totalCycles: number;
  color: string;
  icon: string;
  bg: string;
}

const TECHNIQUES: Record<string, BreatheTechnique> = {
  box: {
    id: 'box', name: 'Box Breathing', icon: 'square-outline',
    description: 'Equal counts of inhale, hold, exhale, hold. Used by Navy SEALs to reduce stress and sharpen focus.',
    phases: [
      { label: 'Inhale', duration: 4, color: C.sage },
      { label: 'Hold', duration: 4, color: C.lavender },
      { label: 'Exhale', duration: 4, color: C.lightSky },
      { label: 'Hold', duration: 4, color: C.mauve },
    ],
    totalCycles: 4, color: C.sage, bg: '#0D2A1F',
  },
  '478': {
    id: '478', name: '4-7-8 Technique', icon: 'moon',
    description: 'Inhale for 4, hold for 7, exhale for 8. A natural tranquilizer for the nervous system.',
    phases: [
      { label: 'Inhale', duration: 4, color: C.sage },
      { label: 'Hold', duration: 7, color: C.lavender },
      { label: 'Exhale', duration: 8, color: C.lightSky },
    ],
    totalCycles: 4, color: '#818CF8', bg: '#1A1B4B',
  },
  deep: {
    id: 'deep', name: 'Deep Calm', icon: 'leaf',
    description: 'Slow, deep breaths to activate the parasympathetic nervous system for deep relaxation.',
    phases: [
      { label: 'Inhale', duration: 6, color: C.sage },
      { label: 'Hold', duration: 2, color: C.lavender },
      { label: 'Exhale', duration: 8, color: C.lightSky },
    ],
    totalCycles: 5, color: C.sage, bg: '#0D2A1F',
  },
  energize: {
    id: 'energize', name: 'Energize', icon: 'flash',
    description: 'Quick, rhythmic breaths to boost energy, alertness, and mental clarity.',
    phases: [
      { label: 'Inhale', duration: 2, color: C.gold },
      { label: 'Exhale', duration: 2, color: '#F59E0B90' },
    ],
    totalCycles: 8, color: C.gold, bg: '#2A1A00',
  },
  sigh: {
    id: 'sigh', name: 'Physiological Sigh', icon: 'sync',
    description: 'A double inhale through the nose followed by a long exhale. The fastest way to reduce stress.',
    phases: [
      { label: 'Inhale 1', duration: 2, color: C.mauve },
      { label: 'Inhale 2', duration: 1, color: C.lavender },
      { label: 'Long Exhale', duration: 6, color: C.lightSky },
    ],
    totalCycles: 5, color: C.mauve, bg: '#1A0D2A',
  },
};

const DURATIONS = [3, 5, 10];

const AMBIENT_SOUNDS = [
  { id: null, label: 'None', icon: 'volume-mute' },
  { id: 'rain', label: 'Rain', icon: 'rainy' },
  { id: 'bowls', label: 'Bowls', icon: 'musical-notes' },
  { id: 'forest', label: 'Forest', icon: 'leaf' },
] as const;

export default function BreatheScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addWellnessMinutes, toggleFavourite, isFavourite } = useApp();
  const { play, stop } = useAmbientAudio();

  const technique = TECHNIQUES[id ?? 'box'] ?? TECHNIQUES.box;
  const [phase, setPhase] = useState<'select' | 'session' | 'done'>('select');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ambientSound, setAmbientSound] = useState<string | null>(null);
  const phaseRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.6);
  const fav = isFavourite(technique.id);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
    opacity: orbOpacity.value,
  }));

  const handleSelectSound = (soundId: string | null) => {
    setAmbientSound(soundId);
    if (soundId) {
      play(soundId);
    } else {
      stop();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const stopSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stop();
    setAmbientSound(null);
    setPhase('select');
  };

  const goBack = () => {
    stop();
    router.back();
  };

  const startSession = () => {
    setPhase('session');
    phaseRef.current = 0;
    setCurrentPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
    runPhase(0, 0);
  };

  const runPhase = (phaseIdx: number, cycle: number) => {
    const phases = technique.phases;
    const p = phases[phaseIdx];
    setCurrentPhaseIdx(phaseIdx);
    setCountdown(p.duration);

    const isInhale = p.label.toLowerCase().includes('inhale');
    const isExhale = p.label.toLowerCase().includes('exhale');

    if (isInhale) {
      orbScale.value = withTiming(1.35, { duration: p.duration * 1000, easing: Easing.inOut(Easing.ease) });
      orbOpacity.value = withTiming(1, { duration: p.duration * 1000 });
    } else if (isExhale) {
      orbScale.value = withTiming(0.85, { duration: p.duration * 1000, easing: Easing.inOut(Easing.ease) });
      orbOpacity.value = withTiming(0.5, { duration: p.duration * 1000 });
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let ticks = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      ticks++;
      setCountdown(p.duration - ticks);
      setElapsed(e => e + 1);

      if (ticks >= p.duration) {
        clearInterval(intervalRef.current!);
        const nextPhaseIdx = (phaseIdx + 1) % phases.length;
        const nextCycle = nextPhaseIdx === 0 ? cycle + 1 : cycle;

        if (nextCycle * (phases.reduce((a, x) => a + x.duration, 0)) >= selectedDuration * 60) {
          stop();
          setPhase('done');
          addWellnessMinutes(selectedDuration);
          return;
        }
        if (nextPhaseIdx === 0) setCycleCount(nextCycle);
        runPhase(nextPhaseIdx, nextCycle);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stop();
    };
  }, []);

  const currentPhase = technique.phases[currentPhaseIdx];
  const totalSecs = selectedDuration * 60;

  if (phase === 'done') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[technique.bg, '#0D0F14']} style={StyleSheet.absoluteFill} />
        <View style={[styles.innerContainer, { paddingTop: topInset + 16 }]}>
          <Pressable style={[styles.backBtn, { marginLeft: 20 }]} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <View style={styles.doneContent}>
            <View style={[styles.doneOrb, { backgroundColor: technique.color + '20', borderColor: technique.color + '40' }]}>
              <Ionicons name="checkmark-circle" size={60} color={technique.color} />
            </View>
            <Text style={styles.doneTitle}>Well done</Text>
            <Text style={styles.doneSub}>{selectedDuration} minutes of {technique.name}</Text>
            <Text style={styles.doneCycles}>{cycleCount} breathing cycles completed</Text>
            <Pressable style={[styles.doneBtn, { backgroundColor: technique.color }]} onPress={() => { setPhase('select'); }}>
              <Text style={styles.doneBtnText}>Another Session</Text>
            </Pressable>
            <Pressable style={styles.doneBtnOutline} onPress={goBack}>
              <Text style={[styles.doneBtnText, { color: C.textSub }]}>Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'session') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[technique.bg, '#0D0F14']} style={StyleSheet.absoluteFill} />
        <View style={[styles.sessionHeader, { marginTop: topInset }]}>
          <Pressable style={styles.backBtn} onPress={stopSession}>
            <Ionicons name="close" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.sessionName}>{technique.name}</Text>
          <View style={[styles.durationBadge, { backgroundColor: technique.color + '25' }]}>
            <Text style={[styles.durationBadgeText, { color: technique.color }]}>{selectedDuration}min</Text>
          </View>
        </View>

        <View style={styles.sessionContent}>
          <View style={styles.phaseLabel}>
            <Text style={[styles.phaseLabelText, { color: currentPhase.color }]}>{currentPhase.label}</Text>
          </View>

          <View style={styles.orbContainer}>
            <View style={[styles.orbRing, { borderColor: currentPhase.color + '30' }]} />
            <View style={[styles.orbRingInner, { borderColor: currentPhase.color + '20' }]} />
            <Pressable onPress={stopSession}>
              <Reanimated.View style={[styles.orb, { backgroundColor: currentPhase.color + '30', borderColor: currentPhase.color }, orbStyle]}>
                <Text style={[styles.orbCount, { color: currentPhase.color }]}>{countdown}</Text>
              </Reanimated.View>
            </Pressable>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(elapsed / totalSecs) * 100}%`, backgroundColor: technique.color }]} />
          </View>
          <Text style={styles.progressText}>{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / {selectedDuration}:00</Text>

          <Text style={styles.cycleText}>Cycle {cycleCount + 1}</Text>
        </View>

        {/* Ambient sound selector */}
        <View style={[styles.soundBar, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16 }]}>
          <Text style={styles.soundBarLabel}>Ambient</Text>
          <View style={styles.soundChips}>
            {AMBIENT_SOUNDS.map(s => {
              const active = ambientSound === s.id;
              return (
                <Pressable
                  key={String(s.id)}
                  style={[styles.soundChip, active && { backgroundColor: technique.color + '30', borderColor: technique.color }]}
                  onPress={() => handleSelectSound(s.id as string | null)}
                >
                  <Ionicons name={s.icon as any} size={14} color={active ? technique.color : C.textSub} />
                  <Text style={[styles.soundChipText, { color: active ? technique.color : C.textSub }]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[technique.bg, '#0D0F14']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.selectContent, { paddingTop: topInset + 16 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.selectHeader}>
        <Pressable style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Pressable onPress={() => toggleFavourite({ id: technique.id, type: 'breathe', title: technique.name, color: technique.color, icon: technique.icon })}>
          <Ionicons name={fav ? 'star' : 'star-outline'} size={22} color={fav ? C.gold : C.textSub} />
        </Pressable>
      </View>

      <View style={styles.techHeader}>
        <View style={[styles.techIcon, { backgroundColor: technique.color + '20', borderColor: technique.color + '40' }]}>
          <Ionicons name={technique.icon as any} size={40} color={technique.color} />
        </View>
        <Text style={styles.techName}>{technique.name}</Text>
        <Text style={styles.techDesc}>{technique.description}</Text>
      </View>

      <View style={styles.phasesPreview}>
        {technique.phases.map((p, i) => (
          <View key={i} style={[styles.phaseRow, { borderColor: p.color + '30' }]}>
            <View style={[styles.phaseDot, { backgroundColor: p.color }]} />
            <Text style={[styles.phaseRowLabel, { color: p.color }]}>{p.label}</Text>
            <Text style={styles.phaseRowDuration}>{p.duration}s</Text>
          </View>
        ))}
      </View>

      <Text style={styles.durationLabel}>Duration</Text>
      <View style={styles.durationRow}>
        {DURATIONS.map(d => (
          <Pressable
            key={d}
            style={[styles.durationChip, selectedDuration === d && { backgroundColor: technique.color + '25', borderColor: technique.color }]}
            onPress={() => setSelectedDuration(d)}
          >
            <Text style={[styles.durationChipText, { color: selectedDuration === d ? technique.color : C.textSub }]}>{d} min</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.startBtn, { backgroundColor: technique.color }]}
        onPress={startSession}
      >
        <Ionicons name="play" size={20} color={C.bg} />
        <Text style={styles.startBtnText}>Begin Session</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
}

function createStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  innerContainer: { flex: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  selectContent: { paddingHorizontal: 20, paddingBottom: 60, gap: 20 },
  selectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  techHeader: { alignItems: 'center', gap: 14, paddingTop: 20 },
  techIcon: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  techName: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' },
  techDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 26 },
  phasesPreview: { gap: 8 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, borderWidth: 1 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseRowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  phaseRowDuration: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub },
  durationLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationChip: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)' },
  durationChipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  startBtnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.bg },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  sessionName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, flex: 1, textAlign: 'center' },
  durationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  durationBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sessionContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 24 },
  phaseLabel: { alignItems: 'center' },
  phaseLabelText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase' },
  orbContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  orbRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1 },
  orbRingInner: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1 },
  orb: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  orbCount: { fontSize: 40, fontFamily: 'Inter_700Bold' },
  progressBarTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub },
  cycleText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textMuted },
  soundBar: {
    paddingTop: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  soundBarLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  soundChips: { flexDirection: 'row', gap: 8 },
  soundChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  soundChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  doneOrb: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  doneTitle: { fontSize: 32, fontFamily: 'Inter_700Bold', color: C.text },
  doneSub: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub },
  doneCycles: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textMuted },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16, width: '100%' },
  doneBtnOutline: { paddingVertical: 12 },
  doneBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
});
}
