import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Phase = 'splash' | 'difficulty' | 'announce' | 'playing' | 'roundSummary' | 'results';
type Difficulty = 'Easy' | 'Medium' | 'Hard';
interface CircleState { lit: boolean; color: string; litAt: number; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROUNDS = 3;
const ROUND_SEC = 30;
const ANNOUNCE_MS = 2000;
const ROUND_SUMMARY_MS = 2000;
const SPEED_BONUS_MS = 400;

const DIFF_SETTINGS: Record<Difficulty, { ms: number; n: number }> = {
  Easy:   { ms: 1200, n: 1 },
  Medium: { ms: 900,  n: 2 },
  Hard:   { ms: 650,  n: 3 },
};

const FORBIDDEN_NAMES = ['Rose', 'Violet', 'Amber'];

// ─── SPLASH CIRCLE ────────────────────────────────────────────────────────────
function SplashCircle({ active, color }: { active: boolean; color: string }) {
  const opacity = useSharedValue(active ? 0.45 : 0.1);

  useEffect(() => {
    if (active) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 950 }),
          withTiming(0.45, { duration: 950 }),
        ),
        -1, true,
      );
    }
  }, [active]);

  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: active ? color : 'rgba(255,255,255,0.08)',
        },
        aStyle,
      ]}
    />
  );
}

// ─── ANNOUNCE BAR ─────────────────────────────────────────────────────────────
function AnnounceBar({ durationMs, color }: { durationMs: number; color: string }) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 1;
    progress.value = withTiming(0, { duration: durationMs });
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <View style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: color }, aStyle]} />
    </View>
  );
}

// ─── GAME CIRCLE ──────────────────────────────────────────────────────────────
function GameCircle({
  state,
  scale,
  translateX,
  onPress,
  size,
}: {
  state: CircleState;
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  onPress: () => void;
  size: number;
}) {
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Pressable onPress={onPress} testID="game-circle">
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: state.lit ? state.color : 'rgba(255,255,255,0.08)',
            borderWidth: state.lit ? 0 : 1,
            borderColor: 'rgba(255,255,255,0.12)',
          },
          aStyle,
        ]}
      />
    </Pressable>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SignalOverrideScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { recordGamePlay, gameOfTheDayId, gameOfTheDayCompleted, markGameOfDayComplete } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Phase & UI state
  const [phase, setPhase] = useState<Phase>('splash');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [showHowTo, setShowHowTo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ── Game state (rendered)
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(ROUND_SEC);
  const [circleStates, setCircleStates] = useState<CircleState[]>(() =>
    Array(9).fill(null).map(() => ({ lit: false, color: 'transparent', litAt: 0 }))
  );
  const [roundSummary, setRoundSummary] = useState({ score: 0, accuracy: 0 });
  const [results, setResults] = useState({ totalScore: 0, accuracy: 0, fastestReaction: 0, bestRound: 0 });

  // ── Game refs (for closures)
  const isPausedRef = useRef(false);
  const roundRef = useRef(1);
  const difficultyRef = useRef<Difficulty>('Medium');
  const scoreRef = useRef(0);
  const roundScoreRef = useRef(0);
  const tapsRef = useRef(0);
  const correctTapsRef = useRef(0);
  const fastestRef = useRef(Infinity);
  const bestRoundRef = useRef(0);
  const totalTapsAllRef = useRef(0);
  const totalCorrectAllRef = useRef(0);

  // ── Timer refs
  const gameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const circleTimeouts = useRef<(ReturnType<typeof setTimeout> | null)[]>(Array(9).fill(null)).current;

  // ── Context refs (stable closures)
  const recordGamePlayRef = useRef(recordGamePlay);
  const gameOfTheDayIdRef = useRef(gameOfTheDayId);
  const gameOfTheDayCompletedRef = useRef(gameOfTheDayCompleted);
  const markGameOfDayCompleteRef = useRef(markGameOfDayComplete);
  useEffect(() => { recordGamePlayRef.current = recordGamePlay; }, [recordGamePlay]);
  useEffect(() => { gameOfTheDayIdRef.current = gameOfTheDayId; }, [gameOfTheDayId]);
  useEffect(() => { gameOfTheDayCompletedRef.current = gameOfTheDayCompleted; }, [gameOfTheDayCompleted]);
  useEffect(() => { markGameOfDayCompleteRef.current = markGameOfDayComplete; }, [markGameOfDayComplete]);

  // ── Forbidden/flash colors (theme-aware)
  const forbiddenColors = useMemo(() => [C.rose, C.lavender, C.gold], [C.rose, C.lavender, C.gold]);
  const flashPool = useMemo(() => [C.rose, C.lavender, C.gold, C.lightSky, C.sage], [C.rose, C.lavender, C.gold, C.lightSky, C.sage]);
  const forbiddenColorsRef = useRef(forbiddenColors);
  const flashPoolRef = useRef(flashPool);
  useEffect(() => { forbiddenColorsRef.current = forbiddenColors; }, [forbiddenColors]);
  useEffect(() => { flashPoolRef.current = flashPool; }, [flashPool]);

  // ── 18 shared values: 9 circle scales + 9 circle shake Xs
  const cs0 = useSharedValue(1); const cs1 = useSharedValue(1); const cs2 = useSharedValue(1);
  const cs3 = useSharedValue(1); const cs4 = useSharedValue(1); const cs5 = useSharedValue(1);
  const cs6 = useSharedValue(1); const cs7 = useSharedValue(1); const cs8 = useSharedValue(1);

  const cx0 = useSharedValue(0); const cx1 = useSharedValue(0); const cx2 = useSharedValue(0);
  const cx3 = useSharedValue(0); const cx4 = useSharedValue(0); const cx5 = useSharedValue(0);
  const cx6 = useSharedValue(0); const cx7 = useSharedValue(0); const cx8 = useSharedValue(0);

  const circleScalesRef = useRef([cs0, cs1, cs2, cs3, cs4, cs5, cs6, cs7, cs8]);
  const circleShakesRef = useRef([cx0, cx1, cx2, cx3, cx4, cx5, cx6, cx7, cx8]);

  // Mirror circleStates in a ref for synchronous reads in tap handler
  const circleStatesRef2 = useRef<CircleState[]>(Array(9).fill(null).map(() => ({ lit: false, color: 'transparent', litAt: 0 })));
  useEffect(() => { circleStatesRef2.current = circleStates; }, [circleStates]);

  // ─── HELPERS ──────────────────────────────────────────────────────────────────
  const clearGameTimers = useCallback(() => {
    if (gameTimerRef.current) { clearInterval(gameTimerRef.current); gameTimerRef.current = null; }
    if (flashTimerRef.current) { clearInterval(flashTimerRef.current); flashTimerRef.current = null; }
    for (let i = 0; i < 9; i++) {
      if (circleTimeouts[i]) { clearTimeout(circleTimeouts[i]!); circleTimeouts[i] = null; }
    }
  }, [circleTimeouts]);

  const clearAllTimers = useCallback(() => {
    clearGameTimers();
    if (summaryTimerRef.current) { clearTimeout(summaryTimerRef.current); summaryTimerRef.current = null; }
    if (announceTimerRef.current) { clearTimeout(announceTimerRef.current); announceTimerRef.current = null; }
  }, [clearGameTimers]);

  // ─── GAME LOOP (useEffect) ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    const r = roundRef.current;
    const diff = difficultyRef.current;
    const forbidden = forbiddenColorsRef.current[r - 1];
    const pool = flashPoolRef.current;
    const nonForbidden = pool.filter(c => c !== forbidden);
    const { ms, n } = DIFF_SETTINGS[diff];
    const scales = circleScalesRef.current;

    // Reset round tracking
    roundScoreRef.current = 0;
    tapsRef.current = 0;
    correctTapsRef.current = 0;
    let flashCycle = 0;

    // Reset circles
    for (let i = 0; i < 9; i++) {
      if (circleTimeouts[i]) { clearTimeout(circleTimeouts[i]!); circleTimeouts[i] = null; }
      scales[i].value = 1;
    }
    setCircleStates(Array(9).fill(null).map(() => ({ lit: false, color: 'transparent', litAt: 0 })));
    setTimer(ROUND_SEC);

    // Flash interval
    flashTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      flashCycle += 1;
      const useForbidden = flashCycle % 3 === 0;

      setCircleStates(prev => {
        const next = [...prev];
        const available: number[] = [];
        for (let i = 0; i < 9; i++) { if (!next[i].lit) available.push(i); }
        for (let i = available.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [available[i], available[j]] = [available[j], available[i]];
        }
        const selected = available.slice(0, Math.min(n, available.length));
        const now = Date.now();

        selected.forEach((idx, i) => {
          const color = (useForbidden && i === 0)
            ? forbidden
            : nonForbidden[Math.floor(Math.random() * nonForbidden.length)];
          next[idx] = { lit: true, color, litAt: now };
          scales[idx].value = withSpring(1.06, { damping: 12, stiffness: 220 });
          if (circleTimeouts[idx]) clearTimeout(circleTimeouts[idx]!);
          const clearIdx = idx;
          circleTimeouts[clearIdx] = setTimeout(() => {
            scales[clearIdx].value = withSpring(1, { damping: 15 });
            setCircleStates(p => {
              const nx = [...p];
              nx[clearIdx] = { lit: false, color: 'transparent', litAt: 0 };
              return nx;
            });
            circleTimeouts[clearIdx] = null;
          }, ms * 0.8);
        });

        return next;
      });
    }, ms);

    // Game timer
    let t = ROUND_SEC;
    gameTimerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      t -= 1;
      setTimer(t);
      if (t <= 0) {
        clearGameTimers();

        const rScore = roundScoreRef.current;
        const taps = tapsRef.current;
        const correct = correctTapsRef.current;
        const accuracy = taps > 0 ? Math.round((correct / taps) * 100) : 100;

        totalTapsAllRef.current += taps;
        totalCorrectAllRef.current += correct;

        if (rScore > bestRoundRef.current) bestRoundRef.current = rScore;

        setRoundSummary({ score: rScore, accuracy });
        setPhase('roundSummary');

        summaryTimerRef.current = setTimeout(() => {
          if (r >= ROUNDS) {
            const totalAccuracy = totalTapsAllRef.current > 0
              ? Math.round((totalCorrectAllRef.current / totalTapsAllRef.current) * 100)
              : 100;
            const totalScore = scoreRef.current;
            const fastest = fastestRef.current === Infinity ? 0 : Math.round(fastestRef.current);

            setResults({
              totalScore,
              accuracy: totalAccuracy,
              fastestReaction: fastest,
              bestRound: bestRoundRef.current,
            });

            recordGamePlayRef.current('signal-override', totalScore, difficultyRef.current.toLowerCase());
            if (gameOfTheDayIdRef.current === 'signal-override' && !gameOfTheDayCompletedRef.current) {
              markGameOfDayCompleteRef.current();
            }

            setPhase('results');
          } else {
            roundRef.current = r + 1;
            setRound(r + 1);
            setPhase('announce');

            announceTimerRef.current = setTimeout(() => {
              setPhase('playing');
            }, ANNOUNCE_MS);
          }
        }, ROUND_SUMMARY_MS);
      }
    }, 1000);

    return () => {
      clearGameTimers();
    };
  }, [phase, circleTimeouts, clearGameTimers]);

  // Cleanup on unmount
  useEffect(() => () => { clearAllTimers(); }, [clearAllTimers]);

  // ─── TAP HANDLER ─────────────────────────────────────────────────────────────
  const handleCircleTap = useCallback((idx: number) => {
    const circle = circleStatesRef2.current[idx];
    if (!circle.lit) return;

    const scales = circleScalesRef.current;
    const shakes = circleShakesRef.current;
    const forbidden = forbiddenColorsRef.current[roundRef.current - 1];
    const isForbidden = circle.color === forbidden;
    const reactionTime = Date.now() - circle.litAt;

    // Clear fade-out timeout for this circle
    if (circleTimeouts[idx]) { clearTimeout(circleTimeouts[idx]!); circleTimeouts[idx] = null; }

    // Immediately mark as unlit in ref to prevent double-tap
    const next = [...circleStatesRef2.current];
    next[idx] = { lit: false, color: 'transparent', litAt: 0 };
    circleStatesRef2.current = next;
    setCircleStates(next);

    // Scale back
    scales[idx].value = withSpring(1, { damping: 15 });

    if (isForbidden) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakes[idx].value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming(10,  { duration: 55 }),
        withTiming(-6,  { duration: 45 }),
        withTiming(0,   { duration: 45 }),
      );
      tapsRef.current += 1;
      const ns = Math.max(0, scoreRef.current - 2);
      scoreRef.current = ns;
      roundScoreRef.current = Math.max(0, roundScoreRef.current - 2);
      setScore(ns);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      tapsRef.current += 1;
      correctTapsRef.current += 1;
      if (reactionTime < fastestRef.current) fastestRef.current = reactionTime;
      const pts = 1 + (reactionTime < SPEED_BONUS_MS ? 1 : 0);
      const ns = scoreRef.current + pts;
      scoreRef.current = ns;
      roundScoreRef.current += pts;
      setScore(ns);
    }
  }, [circleTimeouts]);

  // ─── FLOW HANDLERS ────────────────────────────────────────────────────────────
  const handleStartGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    difficultyRef.current = diff;
    setRound(1);
    roundRef.current = 1;
    setScore(0);
    scoreRef.current = 0;
    bestRoundRef.current = 0;
    fastestRef.current = Infinity;
    totalTapsAllRef.current = 0;
    totalCorrectAllRef.current = 0;

    setPhase('announce');
    announceTimerRef.current = setTimeout(() => {
      setPhase('playing');
    }, ANNOUNCE_MS);
  }, []);

  const handlePause = useCallback(() => {
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    clearAllTimers();
    isPausedRef.current = false;
    setIsPaused(false);
    setPhase('difficulty');
  }, [clearAllTimers]);

  const handleExit = useCallback(() => {
    clearAllTimers();
    router.back();
  }, [clearAllTimers]);

  const handlePlayAgain = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setRound(1);
    roundRef.current = 1;
    bestRoundRef.current = 0;
    fastestRef.current = Infinity;
    totalTapsAllRef.current = 0;
    totalCorrectAllRef.current = 0;
    setPhase('difficulty');
  }, []);

  // ─── STYLES ──────────────────────────────────────────────────────────────────
  const styles = useMemo(() => createStyles(C), [C]);

  const forbiddenColor = forbiddenColors[round - 1] ?? C.rose;
  const forbiddenName = FORBIDDEN_NAMES[round - 1] ?? 'Rose';

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — SPLASH
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'splash') {
    return (
      <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Modal
          visible={showHowTo}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHowTo(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowHowTo(false)}>
            <View style={[styles.howToSheet, { paddingBottom: bottomInset + 20 }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.howToTitle}>How to play</Text>
              {([
                ['Watch', 'Coloured circles flash across the grid. Tap any lit circle to score points.'],
                ['Avoid', "Each round has a forbidden colour. Never tap it — you'll lose 2 points."],
                ['Speed', 'Tap within 400 ms for a bonus point on top of your regular score.'],
                ['Override', 'Three rounds of 30 seconds each. Control the signal.'],
              ] as [string, string][]).map(([head, body]) => (
                <View key={head} style={styles.howToRow}>
                  <View style={[styles.howToIcon, { backgroundColor: C.rose + '20' }]}>
                    <Ionicons name="radio-button-on" size={16} color={C.rose} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.howToHead}>{head}</Text>
                    <Text style={styles.howToBody}>{body}</Text>
                  </View>
                </View>
              ))}
              <Pressable
                style={({ pressed }) => [styles.beginBtn, { marginTop: 8, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => setShowHowTo(false)}
              >
                <Text style={styles.beginBtnText}>Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.splashContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.monoTag}>MANAS · INHIBITORY CONTROL</Text>

          <View style={styles.splashGrid}>
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <SplashCircle
                key={i}
                active={i === 1 || i === 4 || i === 7}
                color={i === 1 ? C.rose : i === 4 ? C.lavender : C.gold}
              />
            ))}
          </View>

          <Text style={styles.splashTitle}>{'Signal\nOverride'}</Text>

          <View style={styles.splashPill}>
            <Text style={styles.splashPillText}>INHIBITORY CONTROL</Text>
          </View>

          <Text style={styles.splashDesc}>
            A grid of signals fires at speed. Every colour is fair game — except one. Override the impulse. Tap everything else.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.beginBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setPhase('difficulty')}
            testID="begin-session"
          >
            <Text style={styles.beginBtnText}>Begin Session</Text>
          </Pressable>

          <Pressable onPress={() => setShowHowTo(true)}>
            <Text style={styles.howToLink}>How to play?</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — DIFFICULTY
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'difficulty') {
    const cards: { d: Difficulty; color: string; label: string; sub: string }[] = [
      { d: 'Easy',   color: C.sage,    label: 'Easy',   sub: 'Slow flashes · 1 target · Long window' },
      { d: 'Medium', color: C.gold,    label: 'Medium', sub: 'Moderate pace · 2 targets · Standard' },
      { d: 'Hard',   color: C.rose,    label: 'Hard',   sub: 'Fast flashes · 3 targets · Short window' },
    ];
    return (
      <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.diffHeader}>
          <Pressable style={styles.backBtn} onPress={() => setPhase('splash')}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.diffHeading}>Choose Difficulty</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.diffBody}>
          {cards.map(({ d, color, label, sub }) => (
            <Pressable
              key={d}
              style={({ pressed }) => [styles.diffCard, { opacity: pressed ? 0.82 : 1 }]}
              onPress={() => {
                setDifficulty(d);
                setTimeout(() => handleStartGame(d), 300);
              }}
              testID={`difficulty-${d.toLowerCase()}`}
            >
              <View style={[styles.diffAccent, { backgroundColor: color }]} />
              <View style={{ flex: 1, paddingLeft: 20 }}>
                <Text style={[styles.diffCardLabel, { color }]}>{label}</Text>
                <Text style={styles.diffCardSub}>{sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.textSub} style={{ marginRight: 16 }} />
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — ANNOUNCE
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'announce') {
    return (
      <View style={[styles.container, styles.centred, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Text style={styles.announceRoundLabel}>ROUND {round} OF {ROUNDS}</Text>
        <Text style={styles.announceHeading}>DON'T TOUCH</Text>
        <View style={[
          styles.announceCircle,
          { backgroundColor: forbiddenColor, shadowColor: forbiddenColor },
        ]} />
        <Text style={styles.announceColorName}>{forbiddenName}</Text>
        <View style={{ width: '65%', marginTop: 24 }}>
          <AnnounceBar durationMs={ANNOUNCE_MS} color={forbiddenColor} />
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — ROUND SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'roundSummary') {
    const msg =
      roundSummary.accuracy >= 90 ? 'Override complete.' :
      roundSummary.accuracy >= 70 ? 'Strong signal.' :
      roundSummary.accuracy >= 50 ? 'Getting there.' :
      'The signal won this round.';
    return (
      <View style={[styles.container, styles.centred, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <Text style={styles.announceRoundLabel}>ROUND {round} COMPLETE</Text>
        <Text style={styles.summaryScore}>{roundSummary.score}</Text>
        <Text style={styles.summaryPoints}>points this round</Text>
        <Text style={styles.summaryAccuracy}>{roundSummary.accuracy}%</Text>
        <Text style={styles.summaryAccuracyLabel}>accuracy</Text>
        <Text style={styles.summaryMsg}>{msg}</Text>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'results') {
    const { totalScore, accuracy, fastestReaction, bestRound } = results;
    const isGreat = accuracy >= 85;
    const isGood  = accuracy >= 60;
    const resultIcon  = isGreat ? 'radio-button-on' : isGood ? 'flash' : 'refresh';
    const resultColor = isGreat ? C.sage : isGood ? C.gold : C.rose;
    const resultTitle = isGreat ? 'Override Complete' : isGood ? 'Signal Detected' : 'Overwhelmed';
    const resultSub   = isGreat
      ? 'Your inhibitory control is exceptional.'
      : isGood
      ? 'The override is taking hold. Keep pushing.'
      : 'The signal broke through. Train harder.';

    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <LinearGradient
          colors={[C.gamePurple, C.gamePurple2, C.bg]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          contentContainerStyle={[styles.resultContent, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.resultIconWrap, { backgroundColor: resultColor + '25', borderColor: resultColor + '55' }]}>
            <Ionicons name={resultIcon as any} size={44} color={resultColor} />
          </View>
          <Text style={styles.resultTitle}>{resultTitle}</Text>
          <Text style={styles.resultSub}>{resultSub}</Text>

          <View style={styles.statsGrid}>
            {([
              { label: 'Total Score',    value: String(totalScore) },
              { label: 'Accuracy',       value: `${accuracy}%` },
              { label: 'Fastest Tap',    value: fastestReaction > 0 ? `${fastestReaction}ms` : '—' },
              { label: 'Best Round',     value: String(bestRound) },
            ] as { label: string; value: string }[]).map(({ label, value }) => (
              <View key={label} style={[styles.statCard, { borderColor: C.border }]}>
                <Text style={styles.statVal}>{value}</Text>
                <Text style={styles.statLbl}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.insightCard, { borderColor: C.border, borderLeftColor: C.rose }]}>
            <Text style={styles.insightText}>
              "Inhibitory control — the capacity to suppress automatic or prepotent responses — is a cornerstone of executive function and predicts long-term academic, social, and mental health outcomes."
            </Text>
            <Text style={styles.insightSource}>— Diamond, 2013 · Annual Review of Psychology</Text>
          </View>

          <View style={styles.resultBtns}>
            <Pressable
              style={({ pressed }) => [styles.resultBtnOutline, { borderColor: C.rose + '60', opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.back()}
              testID="result-done"
            >
              <Ionicons name="home-outline" size={18} color={C.rose} />
              <Text style={[styles.resultBtnText, { color: C.rose }]}>Done</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.resultBtnFill, { backgroundColor: C.rose, opacity: pressed ? 0.85 : 1 }]}
              onPress={handlePlayAgain}
              testID="result-play-again"
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={[styles.resultBtnText, { color: '#fff' }]}>Play Again</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — PLAYING
  // ═══════════════════════════════════════════════════════════════════════════
  const CIRCLE_SIZE = 88;
  const circleScales = circleScalesRef.current;
  const circleShakes = circleShakesRef.current;

  return (
    <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={[styles.hudPill, { backgroundColor: C.card }]}>
          <Text style={styles.hudPillText}>Round {round}/{ROUNDS}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={[styles.hudPill, { backgroundColor: C.rose + '22' }]}>
          <Text style={[styles.hudPillText, { color: C.rose, fontFamily: 'Inter_700Bold' }]}>{score}</Text>
        </View>
        <View style={{ width: 8 }} />
        <View style={[styles.hudPill, { backgroundColor: timer <= 8 ? C.rose + '22' : C.card }]}>
          <Text style={[styles.hudPillText, { color: timer <= 8 ? C.rose : C.text }]}>{timer}s</Text>
        </View>
        <Pressable style={styles.pauseBtn} onPress={handlePause} testID="pause-btn">
          <Ionicons name="pause" size={18} color={C.text} />
        </Pressable>
      </View>

      {/* Forbidden reminder */}
      <View style={styles.forbiddenRow}>
        <View style={[styles.forbiddenDot, { backgroundColor: forbiddenColor }]} />
        <Text style={styles.forbiddenText}>Don't touch {forbiddenName}</Text>
      </View>

      {/* 3 × 3 circle grid */}
      <View style={styles.grid}>
        {circleStates.map((state, idx) => (
          <GameCircle
            key={idx}
            state={state}
            scale={circleScales[idx]}
            translateX={circleShakes[idx]}
            onPress={() => handleCircleTap(idx)}
            size={CIRCLE_SIZE}
          />
        ))}
      </View>

      {/* Pause overlay */}
      <Modal
        visible={isPaused}
        transparent
        animationType="fade"
        onRequestClose={handleResume}
      >
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseSheet, { paddingBottom: bottomInset + 16 }]}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <Pressable
              style={({ pressed }) => [styles.pauseAction, { backgroundColor: C.rose, opacity: pressed ? 0.8 : 1 }]}
              onPress={handleResume}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={[styles.pauseActionText, { color: '#fff' }]}>Resume</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.pauseAction, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, opacity: pressed ? 0.8 : 1 }]}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={18} color={C.text} />
              <Text style={[styles.pauseActionText, { color: C.text }]}>Restart</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, paddingVertical: 12 }]}
              onPress={handleExit}
            >
              <Text style={styles.pauseExitText}>Exit to Menu</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
function createStyles(C: Colors) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: C.bg },
    centred:    { alignItems: 'center', justifyContent: 'center', gap: 16 },

    // Splash
    splashContent: {
      paddingHorizontal: 28, paddingTop: 36, paddingBottom: 56,
      alignItems: 'center', gap: 22,
    },
    monoTag: {
      fontFamily: 'Inter_600SemiBold', fontSize: 11,
      letterSpacing: 2.5, color: C.textMuted, textTransform: 'uppercase',
    },
    splashGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      width: 72 * 3 + 14 * 2, gap: 14, marginVertical: 4,
    },
    splashTitle: {
      fontFamily: 'Lora_700Bold', fontSize: 52,
      color: C.text, letterSpacing: -1.5, textAlign: 'center', lineHeight: 60,
    },
    splashPill: {
      backgroundColor: C.rose + '1E',
      borderRadius: 100, paddingHorizontal: 16, paddingVertical: 6,
      borderWidth: 1, borderColor: C.rose + '40',
    },
    splashPillText: {
      fontFamily: 'Inter_600SemiBold', fontSize: 11,
      letterSpacing: 2.2, color: C.rose, textTransform: 'uppercase',
    },
    splashDesc: {
      fontFamily: 'Inter_400Regular', fontSize: 15,
      color: C.textSub, lineHeight: 26, textAlign: 'center',
    },
    beginBtn: {
      backgroundColor: C.rose, borderRadius: 16,
      paddingVertical: 16, paddingHorizontal: 40,
      width: '100%', alignItems: 'center',
    },
    beginBtnText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff' },
    howToLink: {
      fontFamily: 'Inter_500Medium', fontSize: 14,
      color: C.textSub, textDecorationLine: 'underline',
    },

    // How-to modal
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    howToSheet: {
      backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 28, gap: 20,
    },
    sheetHandle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    howToTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: C.text },
    howToRow:  { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
    howToIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    howToHead: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text, marginBottom: 2 },
    howToBody: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSub, lineHeight: 22 },

    // Difficulty
    diffHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 16, gap: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },
    diffHeading: { flex: 1, textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
    diffBody:   { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 14 },
    diffCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.card, borderRadius: 18,
      paddingVertical: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
    },
    diffAccent: { width: 4, alignSelf: 'stretch' },
    diffCardLabel: { fontFamily: 'Inter_700Bold', fontSize: 17, marginBottom: 4 },
    diffCardSub:   { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub },

    // Announce
    announceRoundLabel: {
      fontFamily: 'Inter_600SemiBold', fontSize: 11,
      letterSpacing: 2.5, color: C.textMuted, textTransform: 'uppercase',
    },
    announceHeading: {
      fontFamily: 'Inter_700Bold', fontSize: 30, color: C.text, letterSpacing: 1,
    },
    announceCircle: {
      width: 100, height: 100, borderRadius: 50,
      shadowOpacity: 0.55, shadowOffset: { width: 0, height: 0 }, shadowRadius: 22, elevation: 14,
    },
    announceColorName: {
      fontFamily: 'Lora_700Bold', fontSize: 34, color: C.text,
    },

    // Round summary
    summaryScore: {
      fontFamily: 'Lora_700Bold', fontSize: 72, color: C.text, lineHeight: 80,
    },
    summaryPoints:       { fontFamily: 'Inter_400Regular', fontSize: 15, color: C.textSub },
    summaryAccuracy:     { fontFamily: 'Inter_700Bold', fontSize: 36, color: C.text },
    summaryAccuracyLabel:{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSub },
    summaryMsg: {
      fontFamily: 'Lora_400Regular_Italic', fontSize: 18,
      color: C.textSub, textAlign: 'center', paddingHorizontal: 32,
    },

    // HUD
    hud: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
    },
    hudPill: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 100, alignItems: 'center', minWidth: 58,
    },
    hudPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
    pauseBtn: {
      marginLeft: 8, width: 38, height: 38, borderRadius: 19,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.border,
    },

    // Forbidden reminder
    forbiddenRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingBottom: 10,
    },
    forbiddenDot:  { width: 12, height: 12, borderRadius: 6 },
    forbiddenText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSub },

    // Grid
    grid: {
      flex: 1, flexDirection: 'row', flexWrap: 'wrap',
      alignContent: 'center', justifyContent: 'center', gap: 16,
      paddingHorizontal: 20,
    },

    // Pause overlay
    pauseOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    pauseSheet: {
      backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 28, gap: 14, alignItems: 'center',
    },
    pauseTitle:      { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text, marginBottom: 6 },
    pauseAction: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 14, paddingHorizontal: 32,
      borderRadius: 16, width: '100%',
    },
    pauseActionText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
    pauseExitText: {
      fontFamily: 'Inter_500Medium', fontSize: 14,
      color: C.textSub, textDecorationLine: 'underline',
    },

    // Results
    resultContent: { paddingHorizontal: 24, paddingTop: 52, alignItems: 'center', gap: 20 },
    resultIconWrap: {
      width: 96, height: 96, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },
    resultTitle: {
      fontFamily: 'Lora_700Bold', fontSize: 32, color: C.text, textAlign: 'center',
    },
    resultSub: {
      fontFamily: 'Inter_400Regular', fontSize: 15,
      color: C.textSub, textAlign: 'center', lineHeight: 24,
    },
    statsGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%', justifyContent: 'center',
    },
    statCard: {
      width: '46%', backgroundColor: C.card, borderRadius: 16,
      paddingVertical: 18, paddingHorizontal: 12,
      alignItems: 'center', borderWidth: 1, gap: 6,
    },
    statVal: { fontFamily: 'Inter_700Bold', fontSize: 26, color: C.text },
    statLbl: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSub, textAlign: 'center' },
    insightCard: {
      backgroundColor: C.card, borderRadius: 16, padding: 20,
      borderLeftWidth: 3, borderWidth: 1, width: '100%',
    },
    insightText: {
      fontFamily: 'Lora_400Regular_Italic', fontSize: 14,
      color: C.textSub, lineHeight: 24, marginBottom: 10,
    },
    insightSource: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted },
    resultBtns: { flexDirection: 'row', gap: 12, width: '100%' },
    resultBtnOutline: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1,
    },
    resultBtnFill: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 16,
    },
    resultBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  });
}
