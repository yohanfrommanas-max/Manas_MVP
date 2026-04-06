import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, ScrollView,
  Dimensions, PanResponder,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, cancelAnimation, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors, type Colors } from '@/constants/colors';
import GAMES from '@/constants/games';

const { width, height } = Dimensions.get('window');

type GameView = 'detail' | 'playing' | 'result';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

// ─── SIGNAL SPOTTER ───────────────────────────────────────────────────────────
function SignalSpotter({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MAX_TIME = 60;
  const SPAWN_INTERVAL = difficulty === 'Easy' ? 1200 : difficulty === 'Medium' ? 900 : 600;
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [circles, setCircles] = useState<{ id: string; x: number; y: number; color: string; isTarget: boolean }[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const COLORS = [C.lavender, C.sage, C.rose, C.gold, C.lightSky];
  const TARGET_COLOR = C.sage;
  const uid = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);

  useEffect(() => {
    timer.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          cleanup();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    spawnTimer.current = setInterval(() => {
      const isTarget = Math.random() < 0.35;
      const count = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
      const newCircles = Array.from({ length: count }, () => ({
        id: uid(),
        x: Math.random() * (width - 120) + 20,
        y: Math.random() * 280 + 80,
        color: isTarget ? TARGET_COLOR : COLORS[Math.floor(Math.random() * COLORS.length)].replace(TARGET_COLOR, C.lavender),
        isTarget,
      }));
      setCircles(prev => [...prev.slice(-8), ...newCircles]);
    }, SPAWN_INTERVAL);
    return cleanup;
  }, []);

  useEffect(() => { if (timeLeft === 0) onFinish(score); }, [timeLeft]);

  function cleanup() {
    if (timer.current) clearInterval(timer.current);
    if (spawnTimer.current) clearInterval(spawnTimer.current);
  }

  const tap = (id: string, isTarget: boolean) => {
    Haptics.impactAsync(isTarget ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    setCircles(prev => prev.filter(c => c.id !== id));
    if (isTarget) setScore(s => s + 10);
    else setMisses(m => m + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.gameHUD}>
        <Text style={styles.hudLabel}>Score</Text>
        <Text style={styles.hudValue}>{score}</Text>
        <View style={[styles.timerBar, { flex: 1 }]}>
          <View style={[styles.timerFill, { width: `${(timeLeft / MAX_TIME) * 100}%`, backgroundColor: timeLeft > 20 ? C.sage : C.error }]} />
        </View>
        <Text style={styles.hudValue}>{timeLeft}s</Text>
      </View>
      <View style={[styles.gameHUD, { paddingTop: 0 }]}>
        <View style={[styles.targetHint, { backgroundColor: TARGET_COLOR + '25', borderColor: TARGET_COLOR }]}>
          <View style={[styles.targetDot, { backgroundColor: TARGET_COLOR }]} />
          <Text style={[styles.targetHintText, { color: TARGET_COLOR }]}>Tap green only</Text>
        </View>
        {misses > 0 && <Text style={styles.missText}>{misses} miss{misses > 1 ? 'es' : ''}</Text>}
      </View>
      <View style={styles.gamePlayArea}>
        {circles.map(c => (
          <Pressable
            key={c.id}
            style={[styles.spotterCircle, { left: c.x, top: c.y - 80, backgroundColor: c.color + '30', borderColor: c.color }]}
            onPress={() => tap(c.id, c.isTarget)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── CODE CRACKER ─────────────────────────────────────────────────────────────
function CodeCracker({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const LENGTH = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 4 : 5;
  const MAX_ATTEMPTS = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 8 : 6;
  const [secret] = useState(() => Array.from({ length: LENGTH }, () => Math.floor(Math.random() * 8).toString()).join(''));
  const [current, setCurrent] = useState('');
  const [guesses, setGuesses] = useState<{ guess: string; bulls: number; cows: number }[]>([]);
  const [won, setWon] = useState(false);

  const evaluate = (guess: string) => {
    let bulls = 0, cows = 0;
    const secArr = secret.split(''), gArr = guess.split('');
    const secUsed = Array(LENGTH).fill(false), gUsed = Array(LENGTH).fill(false);
    for (let i = 0; i < LENGTH; i++) { if (gArr[i] === secArr[i]) { bulls++; secUsed[i] = gUsed[i] = true; } }
    for (let i = 0; i < LENGTH; i++) {
      if (gUsed[i]) continue;
      for (let j = 0; j < LENGTH; j++) {
        if (!secUsed[j] && gArr[i] === secArr[j]) { cows++; secUsed[j] = true; break; }
      }
    }
    return { bulls, cows };
  };

  const submit = () => {
    if (current.length !== LENGTH) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { bulls, cows } = evaluate(current);
    const newGuesses = [...guesses, { guess: current, bulls, cows }];
    setGuesses(newGuesses);
    setCurrent('');
    if (bulls === LENGTH) {
      setWon(true);
      setTimeout(() => onFinish(Math.max(0, (MAX_ATTEMPTS - newGuesses.length + 1) * 20)), 800);
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setTimeout(() => onFinish(0), 800);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.codeCracker}>
        <Text style={styles.ccInstruction}>Guess the {LENGTH}-digit code (digits 0-7). After each guess:  ● = correct digit & position  ○ = correct digit, wrong position</Text>
        <View style={styles.ccGuesses}>
          {guesses.map((g, i) => (
            <View key={i} style={styles.ccGuessRow}>
              <Text style={styles.ccGuessDigits}>{g.guess.split('').join(' ')}</Text>
              <View style={styles.ccFeedback}>
                {Array.from({ length: g.bulls }, (_, k) => <View key={'b'+k} style={[styles.ccDot, { backgroundColor: C.sage }]} />)}
                {Array.from({ length: g.cows }, (_, k) => <View key={'c'+k} style={[styles.ccDot, { backgroundColor: C.gold, borderRadius: 0 }]} />)}
                {g.bulls === 0 && g.cows === 0 && <Text style={styles.ccNone}>✗</Text>}
              </View>
              <Text style={styles.ccGuessCount}>#{i + 1}</Text>
            </View>
          ))}
          {!won && guesses.length < MAX_ATTEMPTS && (
            <View style={styles.ccInputRow}>
              {Array.from({ length: LENGTH }, (_, i) => (
                <View key={i} style={[styles.ccDigitBox, { borderColor: current.length > i ? C.lavender : C.border }]}>
                  <Text style={styles.ccDigit}>{current[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {won && <Text style={[styles.ccResult, { color: C.sage }]}>Cracked in {guesses.length} attempt{guesses.length > 1 ? 's' : ''}!</Text>}
        {!won && guesses.length >= MAX_ATTEMPTS && <Text style={[styles.ccResult, { color: C.error }]}>The code was: {secret}</Text>}
        <View style={styles.ccKeypad}>
          {['1','2','3','4','5','6','7','8','0','⌫'].map(k => (
            <Pressable
              key={k}
              style={({ pressed }) => [styles.ccKey, pressed && { opacity: 0.7, backgroundColor: C.lavender + '30' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (k === '⌫') setCurrent(c => c.slice(0, -1));
                else if (current.length < LENGTH) setCurrent(c => c + k);
              }}
            >
              <Text style={styles.ccKeyText}>{k}</Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }) => [styles.ccKey, styles.ccSubmit, { opacity: current.length === LENGTH ? 1 : 0.4 }, pressed && { opacity: 0.7 }]}
            onPress={submit}
          >
            <Ionicons name="checkmark" size={22} color={C.bg} />
          </Pressable>
        </View>
        <Text style={styles.ccAttemptsLeft}>{MAX_ATTEMPTS - guesses.length} attempt{MAX_ATTEMPTS - guesses.length !== 1 ? 's' : ''} remaining</Text>
      </View>
    </ScrollView>
  );
}

// ─── TRAVEL BAG ───────────────────────────────────────────────────────────────
function TravelBag({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const ITEM_COUNT = difficulty === 'Easy' ? 4 : difficulty === 'Medium' ? 6 : 8;
  const ALL_ITEMS = [
    { id: 'passport', icon: 'card', label: 'Passport' },
    { id: 'camera', icon: 'camera', label: 'Camera' },
    { id: 'book', icon: 'book', label: 'Book' },
    { id: 'umbrella', icon: 'umbrella', label: 'Umbrella' },
    { id: 'phone', icon: 'phone-portrait', label: 'Phone' },
    { id: 'watch', icon: 'watch', label: 'Watch' },
    { id: 'wallet', icon: 'wallet', label: 'Wallet' },
    { id: 'headset', icon: 'headset', label: 'Headphones' },
    { id: 'glasses', icon: 'glasses', label: 'Glasses' },
  ];
  const [items] = useState(() => ALL_ITEMS.sort(() => Math.random() - 0.5).slice(0, ITEM_COUNT));
  const [phase, setPhase] = useState<'show' | 'recall'>('show');
  const [showIdx, setShowIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => {
        if (showIdx < items.length - 1) setShowIdx(i => i + 1);
        else setTimeout(() => setPhase('recall'), 600);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, showIdx]);

  const tap = (id: string) => {
    if (done) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...selected, id];
    setSelected(next);
    if (next[next.length - 1] !== items[next.length - 1]?.id) {
      setDone(true);
      setTimeout(() => onFinish((next.length - 1) * 15), 600);
      return;
    }
    if (next.length === items.length) {
      setDone(true);
      setTimeout(() => onFinish(items.length * 15), 600);
    }
  };

  const shuffled = [...items].sort(() => Math.random() - 0.5);

  if (phase === 'show') {
    const item = items[showIdx];
    return (
      <View style={styles.tbShow}>
        <Text style={styles.tbPhaseLabel}>Memorize the sequence</Text>
        <Text style={styles.tbProgress}>{showIdx + 1} of {items.length}</Text>
        <View style={styles.tbItemBig}>
          <Ionicons name={item.icon as any} size={60} color={C.sage} />
          <Text style={styles.tbItemLabel}>{item.label}</Text>
        </View>
        <View style={styles.tbDots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.tbDot, i <= showIdx && { backgroundColor: C.sage }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tbRecall}>
      <Text style={styles.tbPhaseLabel}>Tap in order</Text>
      <View style={styles.tbSelectedRow}>
        {items.map((item, i) => {
          const sel = selected[i];
          const correct = sel === item.id;
          return (
            <View key={i} style={[styles.tbSlot, sel && { borderColor: correct ? C.sage : C.error }]}>
              {sel && <Ionicons name={items.find(x => x.id === sel)?.icon as any ?? 'help'} size={18} color={correct ? C.sage : C.error} />}
            </View>
          );
        })}
      </View>
      <View style={styles.tbGrid}>
        {shuffled.map(item => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              key={item.id}
              style={[styles.tbGridItem, isSelected && { opacity: 0.3 }]}
              onPress={() => !isSelected && tap(item.id)}
              disabled={isSelected || done}
            >
              <Ionicons name={item.icon as any} size={30} color={C.lavender} />
              <Text style={styles.tbGridLabel}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── TIME LOCK ────────────────────────────────────────────────────────────────
function TimeLock({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const TARGETS = difficulty === 'Easy' ? [10, 15] : difficulty === 'Medium' ? [10, 15, 20] : [7, 12, 18, 25];
  const [targetIdx, setTargetIdx] = useState(0);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [round, setRound] = useState(1);
  const pulse = useSharedValue(1);
  const target = TARGETS[targetIdx % TARGETS.length];

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.15], [0.8, 1]),
  }));

  const handleStart = () => {
    setStarted(true);
    setResult(null);
    setStartTime(Date.now());
    pulse.value = withRepeat(withSequence(
      withTiming(1.15, { duration: 800 }),
      withTiming(1, { duration: 800 })
    ), -1);
  };

  const handleStop = () => {
    if (!started) return;
    cancelAnimation(pulse);
    pulse.value = withTiming(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const diff = Math.abs(elapsed - target);
    setResult(elapsed);
    setStarted(false);
    const pts = Math.max(0, Math.round(100 - diff * 20));
    setTotalScore(s => s + pts);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (round >= TARGETS.length) {
      setTimeout(() => onFinish(totalScore + pts), 1500);
    } else {
      setTimeout(() => { setRound(r => r + 1); setTargetIdx(i => i + 1); }, 1500);
    }
  };

  const diff = result !== null ? Math.abs(result - target) : null;

  return (
    <View style={styles.timeLock}>
      <Text style={styles.tlRound}>Round {round} of {TARGETS.length}</Text>
      <Text style={styles.tlTarget}>Target: <Text style={{ color: C.lavender }}>{target}s</Text></Text>
      <Text style={styles.tlInstruction}>No clock shown. Tap when you think {target} seconds have passed.</Text>
      <Pressable onPress={started ? handleStop : handleStart}>
        <Reanimated.View style={[styles.tlOrb, orbStyle, { backgroundColor: started ? C.lavender + '30' : C.card, borderColor: started ? C.lavender : C.border }]}>
          <Text style={[styles.tlOrbText, { color: started ? C.lavender : C.textSub }]}>
            {started ? 'TAP\nSTOP' : 'TAP\nSTART'}
          </Text>
        </Reanimated.View>
      </Pressable>
      {result !== null && diff !== null && (
        <View style={styles.tlResult}>
          <Text style={styles.tlResultTime}>{result.toFixed(2)}s</Text>
          <Text style={[styles.tlResultDiff, { color: diff < 0.5 ? C.sage : diff < 1.5 ? C.gold : C.error }]}>
            {diff < 0.1 ? 'Perfect!' : `Off by ${diff.toFixed(2)}s`}
          </Text>
        </View>
      )}
      <Text style={styles.tlScore}>Score: {totalScore}</Text>
    </View>
  );
}

// ─── FOCUS ANCHOR ─────────────────────────────────────────────────────────────
function FocusAnchor({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MAX_TIME = 60;
  const CHANGE_INTERVAL = difficulty === 'Easy' ? 4000 : difficulty === 'Medium' ? 2800 : 2000;
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [score, setScore] = useState(0);
  const [isChanging, setIsChanging] = useState(false);
  const [missed, setMissed] = useState(false);
  const [distractors, setDistractors] = useState<{ id: string; x: number; y: number }[]>([]);
  const changeRef = useRef(false);
  const scale = useSharedValue(1);
  const anchorStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => { if (t <= 1) { onFinish(score); return 0; } return t - 1; }), 1000);
    const changer = setInterval(() => {
      if (Math.random() < 0.45) {
        setIsChanging(true); changeRef.current = true;
        scale.value = withSequence(withSpring(1.4), withSpring(1));
        const timeout = setTimeout(() => { if (changeRef.current) { setMissed(true); changeRef.current = false; setIsChanging(false); } }, 1200);
      }
      const count = Math.floor(Math.random() * 3);
      setDistractors(Array.from({ length: count }, () => ({
        id: Date.now().toString() + Math.random(),
        x: Math.random() * (width - 80) + 20,
        y: Math.random() * 200 + 40,
      })));
    }, CHANGE_INTERVAL);
    return () => { clearInterval(timer); clearInterval(changer); };
  }, []);

  useEffect(() => { if (timeLeft === 0) onFinish(score); }, [timeLeft]);

  const handleAnchorTap = () => {
    if (isChanging) {
      setScore(s => s + 20); setIsChanging(false); changeRef.current = false; setMissed(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setScore(s => Math.max(0, s - 5));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.gameHUD}>
        <Text style={styles.hudLabel}>Score</Text>
        <Text style={styles.hudValue}>{score}</Text>
        <View style={[styles.timerBar, { flex: 1 }]}>
          <View style={[styles.timerFill, { width: `${(timeLeft / MAX_TIME) * 100}%`, backgroundColor: C.lavender }]} />
        </View>
        <Text style={styles.hudValue}>{timeLeft}s</Text>
      </View>
      <Text style={styles.faInstruction}>Tap the center circle ONLY when it pulses. Ignore distractions.</Text>
      <View style={styles.gamePlayArea}>
        {distractors.map(d => (
          <Pressable
            key={d.id}
            style={{ position: 'absolute', left: d.x, top: d.y }}
            onPress={() => { setScore(s => Math.max(0, s - 5)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <View style={styles.distractor} />
          </Pressable>
        ))}
        <Pressable onPress={handleAnchorTap} style={styles.anchorWrap}>
          <Reanimated.View style={[styles.anchor, anchorStyle, { borderColor: isChanging ? C.sage : C.lavender, backgroundColor: isChanging ? C.sage + '20' : C.lavender + '20' }]}>
            <Text style={[styles.anchorText, { color: isChanging ? C.sage : C.lavender }]}>
              {isChanging ? 'NOW' : '●'}
            </Text>
          </Reanimated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── STORY RECALL ─────────────────────────────────────────────────────────────
function StoryRecall({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const STORIES = [
    {
      text: `Maya arrived at the old lighthouse at dawn. She carried a red backpack containing a journal, a compass, and three apples. The lighthouse keeper, a tall man with a grey beard, offered her a cup of tea. She noticed a photograph of a sailboat on the wall. The keeper said the last light was lit twelve years ago.`,
      questions: [
        { q: 'What color was Maya\'s backpack?', opts: ['Blue', 'Red', 'Green', 'Black'], ans: 1 },
        { q: 'What did the keeper offer Maya?', opts: ['Coffee', 'Water', 'Tea', 'Juice'], ans: 2 },
        { q: 'How many years since the last light?', opts: ['10', '15', '12', '8'], ans: 2 },
        { q: 'What was in the photograph on the wall?', opts: ['A boat', 'A lighthouse', 'A city', 'The sea'], ans: 0 },
      ]
    }
  ];
  const story = STORIES[0];
  const [phase, setPhase] = useState<'read' | 'quiz'>('read');
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  const question = story.questions[qIdx];

  const selectAns = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (i === question.ans) setCorrect(c => c + 1);
    setTimeout(() => {
      if (qIdx < story.questions.length - 1) { setQIdx(q => q + 1); setChosen(null); }
      else onFinish(((correct + (i === question.ans ? 1 : 0)) / story.questions.length) * 100);
    }, 900);
  };

  if (phase === 'read') {
    return (
      <View style={styles.srRead}>
        <Text style={styles.srPhaseLabel}>Read carefully. You'll answer questions after.</Text>
        <ScrollView style={styles.srStoryScroll}>
          <Text style={styles.srStory}>{story.text}</Text>
        </ScrollView>
        <Pressable style={styles.srReadyBtn} onPress={() => setPhase('quiz')}>
          <Text style={styles.srReadyText}>I'm Ready</Text>
          <Ionicons name="arrow-forward" size={18} color={C.bg} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.srQuiz}>
      <Text style={styles.srQProgress}>Question {qIdx + 1} of {story.questions.length}</Text>
      <Text style={styles.srQuestion}>{question.q}</Text>
      {question.opts.map((opt, i) => {
        let bg = C.card;
        let border = C.border;
        if (chosen !== null) {
          if (i === question.ans) { bg = C.sage + '25'; border = C.sage; }
          else if (i === chosen) { bg = C.error + '25'; border = C.error; }
        }
        return (
          <Pressable key={i} style={[styles.srOption, { backgroundColor: bg, borderColor: border }]} onPress={() => selectAns(i)}>
            <Text style={styles.srOptionText}>{opt}</Text>
            {chosen !== null && i === question.ans && <Ionicons name="checkmark-circle" size={18} color={C.sage} />}
          </Pressable>
        );
      })}
      <Text style={styles.srScore}>Score: {correct}/{qIdx + 1}</Text>
    </View>
  );
}

// ─── BEAT RECALL ──────────────────────────────────────────────────────────────
function BeatRecall({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const SEQ_LEN = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 7;
  const BEATS = [
    { id: 'A', label: 'DUN', color: C.lavender },
    { id: 'B', label: 'TUM', color: C.sage },
    { id: 'C', label: 'TAM', color: C.gold },
    { id: 'D', label: 'POW', color: C.rose },
  ];
  const [sequence] = useState(() => Array.from({ length: SEQ_LEN }, () => BEATS[Math.floor(Math.random() * BEATS.length)]));
  const [phase, setPhase] = useState<'listen' | 'recall'>('listen');
  const [playIdx, setPlayIdx] = useState(-1);
  const [userSeq, setUserSeq] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setPlayIdx(i);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      i++;
      if (i >= sequence.length) { clearInterval(t); setTimeout(() => { setPlayIdx(-1); setPhase('recall'); }, 600); }
    }, 700);
    return () => clearInterval(t);
  }, []);

  const tapBeat = (id: string) => {
    if (done) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...userSeq, id];
    setUserSeq(next);
    if (next[next.length - 1] !== sequence[next.length - 1].id) {
      setDone(true);
      const correctSoFar = next.length - 1;
      setTimeout(() => onFinish(Math.round((correctSoFar / SEQ_LEN) * 100)), 800);
      return;
    }
    if (next.length === SEQ_LEN) { setDone(true); setTimeout(() => onFinish(100), 800); }
  };

  return (
    <View style={styles.beatRecall}>
      {phase === 'listen' ? (
        <>
          <Text style={styles.brPhase}>Listen to the sequence...</Text>
          <View style={styles.brSequence}>
            {sequence.map((b, i) => (
              <View key={i} style={[styles.brSeqItem, { backgroundColor: i === playIdx ? b.color + '50' : C.card, borderColor: i === playIdx ? b.color : C.border, transform: [{ scale: i === playIdx ? 1.15 : 1 }] }]}>
                <Text style={[styles.brSeqLabel, { color: i === playIdx ? b.color : C.textMuted }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.brPhase}>Reproduce the sequence</Text>
          <View style={styles.brUserSeq}>
            {sequence.map((b, i) => {
              const sel = userSeq[i];
              const correct = sel === b.id;
              return (
                <View key={i} style={[styles.brSeqItem, { backgroundColor: sel ? (correct ? C.sage + '30' : C.error + '30') : C.card, borderColor: sel ? (correct ? C.sage : C.error) : C.border }]}>
                  {sel ? <Text style={[styles.brSeqLabel, { color: correct ? C.sage : C.error }]}>{BEATS.find(x => x.id === sel)?.label}</Text>
                       : <Text style={styles.brSeqLabel}>?</Text>}
                </View>
              );
            })}
          </View>
          <View style={styles.brBtns}>
            {BEATS.map(b => (
              <Pressable key={b.id} style={({ pressed }) => [styles.brBtn, { backgroundColor: b.color + '20', borderColor: b.color, opacity: pressed ? 0.7 : 1 }]} onPress={() => tapBeat(b.id)} disabled={done}>
                <Text style={[styles.brBtnLabel, { color: b.color }]}>{b.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <Text style={styles.brProgress}>{userSeq.length}/{SEQ_LEN} recalled</Text>
    </View>
  );
}

// ─── DRIFT CONTROL ────────────────────────────────────────────────────────────
function DriftControl({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const ZONE = difficulty === 'Easy' ? 80 : difficulty === 'Medium' ? 55 : 35;
  const MAX_TIME = 60;
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [score, setScore] = useState(0);
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const inZone = useRef(true);
  const inZoneTime = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      posX.value = withTiming(posX.value + (Math.random() - 0.5) * 20, { duration: 800 });
      posY.value = withTiming(posY.value + (Math.random() - 0.5) * 20, { duration: 800 });
      const dist = Math.sqrt(posX.value ** 2 + posY.value ** 2);
      inZone.current = dist < ZONE;
      if (inZone.current) { inZoneTime.current++; setScore(inZoneTime.current * 2); }
      setTimeLeft(t => { if (t <= 1) { onFinish(inZoneTime.current * 2); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
  }));

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => {
      posX.value = withTiming(g.dx * 0.15, { duration: 100 });
      posY.value = withTiming(g.dy * 0.15, { duration: 100 });
    },
  })).current;

  return (
    <View style={styles.driftControl} {...panResponder.panHandlers}>
      <View style={styles.gameHUD}>
        <Text style={styles.hudLabel}>Stability</Text>
        <Text style={styles.hudValue}>{score}</Text>
        <View style={[styles.timerBar, { flex: 1 }]}>
          <View style={[styles.timerFill, { width: `${(timeLeft / MAX_TIME) * 100}%`, backgroundColor: C.mauve }]} />
        </View>
        <Text style={styles.hudValue}>{timeLeft}s</Text>
      </View>
      <Text style={styles.dcInstruction}>Drag slowly to keep the orb within the zone</Text>
      <View style={styles.dcZone}>
        <View style={[styles.dcZoneRing, { width: ZONE * 2, height: ZONE * 2, borderRadius: ZONE }]} />
        <Reanimated.View style={[styles.dcOrb, orbStyle]} />
      </View>
    </View>
  );
}

// ─── ENDURANCE RUN ────────────────────────────────────────────────────────────
function EnduranceRun({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const PLATFORM_WIDTH = difficulty === 'Easy' ? 220 : difficulty === 'Medium' ? 160 : 100;
  const [charPos, setCharPos] = useState(0);
  const [survived, setSurvived] = useState(0);
  const [alive, setAlive] = useState(true);
  const charX = useSharedValue(0);
  const charStyle = useAnimatedStyle(() => ({ transform: [{ translateX: charX.value }] }));

  useEffect(() => {
    if (!alive) return;
    const timer = setInterval(() => setSurvived(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [alive]);

  const move = (dir: 'left' | 'right') => {
    if (!alive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = charX.value + (dir === 'left' ? -30 : 30);
    const limit = (PLATFORM_WIDTH / 2) - 20;
    if (Math.abs(next) > limit) {
      setAlive(false);
      charX.value = withSpring(0);
      onFinish(survived * 5);
      return;
    }
    charX.value = withSpring(next);
  };

  return (
    <View style={styles.endurance}>
      <View style={styles.gameHUD}>
        <Ionicons name="time" size={18} color={C.text} />
        <Text style={styles.hudValue}>{survived}s survived</Text>
      </View>
      <Text style={styles.endInstruction}>{alive ? `Stay on the ${PLATFORM_WIDTH}px platform!` : `Fell after ${survived} seconds`}</Text>
      <View style={styles.endArena}>
        <View style={[styles.endPlatform, { width: PLATFORM_WIDTH }]}>
          <Reanimated.View style={[styles.endChar, charStyle]}>
            <Ionicons name="person" size={28} color={alive ? C.lavender : C.error} />
          </Reanimated.View>
        </View>
      </View>
      <View style={styles.endControls}>
        <Pressable style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.7 }]} onPress={() => move('left')}>
          <Ionicons name="arrow-back" size={32} color={C.text} />
        </Pressable>
        <Pressable style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.7 }]} onPress={() => move('right')}>
          <Ionicons name="arrow-forward" size={32} color={C.text} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── SORTING FLOW ─────────────────────────────────────────────────────────────
function SortingFlow({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const COLORS_LIST = ['red', 'blue', 'green', 'yellow'];
  const SHAPES_LIST = ['circle', 'square', 'triangle', 'diamond'];
  const ITEMS_TOTAL = 12;
  const [rule, setRule] = useState<'color' | 'shape'>('color');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [switched, setSwitched] = useState(false);
  const [ruleHint, setRuleHint] = useState(true);
  const [items] = useState(() =>
    Array.from({ length: ITEMS_TOTAL }, (_, i) => ({
      color: COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)],
      shape: SHAPES_LIST[Math.floor(Math.random() * SHAPES_LIST.length)],
      correctGroup: i < ITEMS_TOTAL / 2 ? 'color' : 'shape',
    }))
  );

  useEffect(() => {
    if (currentIdx === ITEMS_TOTAL / 2 && !switched) {
      setSwitched(true);
      setRule('shape');
      setRuleHint(true);
      setTimeout(() => setRuleHint(false), 2000);
    }
  }, [currentIdx]);

  const sort = (guess: string) => {
    if (currentIdx >= ITEMS_TOTAL) return;
    const item = items[currentIdx];
    const correct = (rule === 'color' && guess === item.color) || (rule === 'shape' && guess === item.shape);
    Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    if (correct) setScore(s => s + 10);
    if (currentIdx + 1 >= ITEMS_TOTAL) setTimeout(() => onFinish(correct ? score + 10 : score), 600);
    else setCurrentIdx(i => i + 1);
  };

  if (currentIdx >= ITEMS_TOTAL) return <View style={styles.sfDone}><Text style={styles.sfDoneText}>Done! Score: {score}</Text></View>;
  const item = items[currentIdx];
  const CATEGORIES = rule === 'color' ? COLORS_LIST.slice(0, 3) : SHAPES_LIST.slice(0, 3);
  const CATEGORY_COLORS: Record<string, string> = { red: '#F87171', blue: C.lightSky, green: C.sage, yellow: C.gold, circle: C.lavender, square: C.rose, triangle: C.gold, diamond: C.wisteria };

  return (
    <View style={styles.sortingFlow}>
      <View style={styles.gameHUD}>
        <Text style={styles.hudLabel}>Sort by</Text>
        <Text style={[styles.hudValue, { color: switched ? C.gold : C.lavender }]}>{rule.toUpperCase()}</Text>
        <Text style={styles.hudLabel}>{currentIdx}/{ITEMS_TOTAL}</Text>
        <Text style={styles.hudValue}>{score}pts</Text>
      </View>
      {ruleHint && switched && (
        <View style={styles.sfHint}>
          <Ionicons name="swap-horizontal" size={18} color={C.gold} />
          <Text style={[styles.sfHintText, { color: C.gold }]}>Rule changed! Sort by shape now.</Text>
        </View>
      )}
      <View style={styles.sfItem}>
        <View style={[styles.sfItemShape, { backgroundColor: CATEGORY_COLORS[item.color] + '30', borderColor: CATEGORY_COLORS[item.color] }]}>
          <Text style={[styles.sfItemText, { color: CATEGORY_COLORS[item.color] }]}>{item.shape}</Text>
          <Text style={[styles.sfItemSubText, { color: CATEGORY_COLORS[item.color] + '80' }]}>{item.color}</Text>
        </View>
      </View>
      <Text style={styles.sfPrompt}>Sort into:</Text>
      <View style={styles.sfBins}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat}
            style={({ pressed }) => [styles.sfBin, { borderColor: CATEGORY_COLORS[cat] + '60', backgroundColor: CATEGORY_COLORS[cat] + '15', opacity: pressed ? 0.7 : 1 }]}
            onPress={() => sort(cat)}
          >
            <Text style={[styles.sfBinText, { color: CATEGORY_COLORS[cat] }]}>{cat}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── MULTI-TASK ───────────────────────────────────────────────────────────────
function MultiTaskChallenge({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const MAX_TIME = 30;
  const POPUP_AT = difficulty === 'Easy' ? 10 : difficulty === 'Medium' ? 8 : 5;
  const QUESTIONS = [
    { q: '3 + 5 = ?', opts: ['6', '8', '9', '7'], ans: 1 },
    { q: '12 - 4 = ?', opts: ['8', '6', '9', '7'], ans: 0 },
    { q: '6 × 3 = ?', opts: ['21', '16', '18', '24'], ans: 2 },
    { q: '20 ÷ 4 = ?', opts: ['6', '5', '4', '7'], ans: 1 },
  ];
  const [timeLeft, setTimeLeft] = useState(MAX_TIME);
  const [started, setStarted] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const popupTriggered = useRef(false);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { onFinish(score); return 0; }
        if ((MAX_TIME - t) % POPUP_AT === 0 && !popupTriggered.current) {
          popupTriggered.current = true;
          setShowQuestion(true);
          setTimeout(() => popupTriggered.current = false, 500);
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, score]);

  const answerQ = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const correct = i === QUESTIONS[qIdx % QUESTIONS.length].ans;
    if (correct) setScore(s => s + 20);
    setTimeout(() => { setShowQuestion(false); setChosen(null); setQIdx(q => q + 1); }, 800);
  };

  const q = QUESTIONS[qIdx % QUESTIONS.length];

  return (
    <View style={styles.multiTask}>
      <View style={styles.gameHUD}>
        <Text style={styles.hudLabel}>Score</Text>
        <Text style={styles.hudValue}>{score}</Text>
        <View style={[styles.timerBar, { flex: 1 }]}>
          <View style={[styles.timerFill, { width: `${(timeLeft / MAX_TIME) * 100}%`, backgroundColor: C.gold }]} />
        </View>
        <Text style={styles.hudValue}>{timeLeft}s</Text>
      </View>
      {!started ? (
        <Pressable style={styles.mtStartBtn} onPress={() => setStarted(true)}>
          <Text style={styles.mtStartText}>Start</Text>
          <Ionicons name="play" size={18} color={C.bg} />
        </Pressable>
      ) : showQuestion ? (
        <View style={styles.mtPopup}>
          <Text style={styles.mtPopupLabel}>INTERRUPTION</Text>
          <Text style={styles.mtQuestion}>{q.q}</Text>
          {q.opts.map((o, i) => (
            <Pressable
              key={i}
              style={[styles.mtOpt, chosen === i && { backgroundColor: i === q.ans ? C.sage + '25' : C.error + '25', borderColor: i === q.ans ? C.sage : C.error }]}
              onPress={() => answerQ(i)}
            >
              <Text style={styles.mtOptText}>{o}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.mtMain}>
          <Text style={styles.mtMainText}>Tracking timer...</Text>
          <Text style={styles.mtMainSub}>Stay focused. A question will interrupt you.</Text>
          <View style={styles.mtPulse}>
            <Ionicons name="radio-button-on" size={60} color={C.gold + '60'} />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── DETECTIVE'S NOTEBOOK ─────────────────────────────────────────────────────
function DetectivesNotebook({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const SCENE = {
    items: [
      { id: 'lamp', icon: 'bulb', label: 'Lamp', position: 'left corner' },
      { id: 'book', icon: 'book', label: 'Blue book', position: 'desk' },
      { id: 'cup', icon: 'cafe', label: 'Coffee cup', position: 'right side' },
      { id: 'key', icon: 'key', label: 'Gold key', position: 'drawer' },
      { id: 'flower', icon: 'flower', label: 'Red rose', position: 'windowsill' },
      { id: 'clock', icon: 'time', label: 'Clock', position: 'wall' },
    ],
    questions: [
      { q: 'Where is the coffee cup?', opts: ['On the desk', 'Left corner', 'Right side', 'Drawer'], ans: 2 },
      { q: 'What color is the key?', opts: ['Silver', 'Bronze', 'Gold', 'Iron'], ans: 2 },
      { q: 'Where is the lamp?', opts: ['Windowsill', 'Left corner', 'Desk', 'Wall'], ans: 1 },
      { q: 'What is on the windowsill?', opts: ['A clock', 'A lamp', 'A red rose', 'A key'], ans: 2 },
    ]
  };
  const [phase, setPhase] = useState<'observe' | 'quiz'>('observe');
  const [timeLeft, setTimeLeft] = useState(20);
  const [qIdx, setQIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'observe') return;
    const t = setInterval(() => setTimeLeft(s => { if (s <= 1) { setPhase('quiz'); clearInterval(t); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const answerQ = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    const isCorrect = i === SCENE.questions[qIdx].ans;
    if (isCorrect) setCorrect(c => c + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      if (qIdx < SCENE.questions.length - 1) { setQIdx(q => q + 1); setChosen(null); }
      else onFinish(((correct + (isCorrect ? 1 : 0)) / SCENE.questions.length) * 100);
    }, 800);
  };

  if (phase === 'observe') {
    return (
      <View style={styles.detective}>
        <Text style={styles.detPhaseLabel}>Study the scene — {timeLeft}s left</Text>
        <View style={styles.detScene}>
          {SCENE.items.map(item => (
            <View key={item.id} style={styles.detItem}>
              <Ionicons name={item.icon as any} size={24} color={C.lavender} />
              <View>
                <Text style={styles.detItemLabel}>{item.label}</Text>
                <Text style={styles.detItemPos}>{item.position}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.timerBar, { marginTop: 16 }]}>
          <View style={[styles.timerFill, { width: `${(timeLeft / 20) * 100}%`, backgroundColor: C.rose }]} />
        </View>
      </View>
    );
  }

  const q = SCENE.questions[qIdx];
  return (
    <View style={styles.srQuiz}>
      <Text style={styles.srQProgress}>Question {qIdx + 1} of {SCENE.questions.length}</Text>
      <Text style={styles.srQuestion}>{q.q}</Text>
      {q.opts.map((opt, i) => (
        <Pressable
          key={i}
          style={[styles.srOption, chosen !== null && i === q.ans && { backgroundColor: C.sage + '25', borderColor: C.sage }, chosen !== null && i === chosen && i !== q.ans && { backgroundColor: C.error + '25', borderColor: C.error }]}
          onPress={() => answerQ(i)}
        >
          <Text style={styles.srOptionText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── COLOUR MATCH ─────────────────────────────────────────────────────────────
function hslToRgb(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `rgb(${Math.round(f(0) * 255)},${Math.round(f(8) * 255)},${Math.round(f(4) * 255)})`;
}

function hslStops(h: number, s: number, l: number, channel: 'hue' | 'sat' | 'lit'): [string, string, string, string, string, string, string] | [string, string, string, string, string] {
  if (channel === 'hue') {
    const stops = [0, 60, 120, 180, 240, 300, 359].map(deg => hslToRgb(deg, Math.max(s, 60), Math.max(l, 45)));
    return stops as [string, string, string, string, string, string, string];
  }
  const stops = [0, 25, 50, 75, 100].map(v => channel === 'sat' ? hslToRgb(h, v, l) : hslToRgb(h, s, v));
  return stops as [string, string, string, string, string];
}

type GradientColors = [string, string, ...string[]];

function HSLSlider({
  label, value, min, max, stops,
  onChange,
  displayText,
  accentColor,
}: {
  label: string; value: number; min: number; max: number;
  stops: GradientColors; onChange: (v: number) => void; displayText: string;
  accentColor?: string;
}) {
  const C = useColors();
  const sliderWidth = useRef(0);
  const liveValue = useRef(value);
  liveValue.current = value;
  const valueAtGrant = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (_e, _gs) => {
        valueAtGrant.current = liveValue.current;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_e, gs) => {
        const w = sliderWidth.current || 1;
        const delta = (gs.dx / w) * (max - min);
        const next = Math.round(Math.max(min, Math.min(max, valueAtGrant.current + delta)));
        onChange(next);
      },
    })
  ).current;

  const fraction = (value - min) / (max - min);
  const accent = accentColor ?? '#C084A0';

  return (
    <View style={{ marginBottom: 20, marginHorizontal: -12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginHorizontal: 12 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub }}>{label}</Text>
        <View style={{ backgroundColor: accent + '22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: accent }}>{displayText}</Text>
        </View>
      </View>
      <View
        style={{ height: 52, justifyContent: 'center' }}
        onLayout={e => { sliderWidth.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        <View style={{ height: 36, borderRadius: 18, overflow: 'hidden' }}>
          <LinearGradient colors={stops} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </View>
        <View style={{
          position: 'absolute',
          left: `${fraction * 100}%`,
          top: '50%',
          width: 30, height: 30, borderRadius: 15,
          backgroundColor: '#fff',
          shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
          elevation: 8,
          transform: [{ translateX: -15 }, { translateY: -15 }],
        }} />
      </View>
    </View>
  );
}

type CMPhase = 'start' | 'memo' | 'match' | 'result' | 'final';

function ColourMatch({ difficulty, onFinish, onComplete }: { difficulty: Difficulty; onFinish: (score: number) => void; onComplete: () => void }) {
  const C = useColors();
  const ROUNDS = 5;
  const MEMO_MS = 5000;

  const [phase, setPhase] = useState<CMPhase>('start');
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [roundScore, setRoundScore] = useState(0);
  const [finalAvg, setFinalAvg] = useState(0);

  const [targetH, setTargetH] = useState(0);
  const [targetS, setTargetS] = useState(60);
  const [targetL, setTargetL] = useState(45);
  const [guessH, setGuessH] = useState(180);
  const [guessS, setGuessS] = useState(50);
  const [guessL, setGuessL] = useState(50);

  const [timerPct, setTimerPct] = useState(100);
  const memoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartMs = useRef(0);

  function startRound() {
    const h = Math.round(Math.random() * 359);
    const s = Math.round(35 + Math.random() * 55);
    const l = Math.round(25 + Math.random() * 40);
    setTargetH(h); setTargetS(s); setTargetL(l);
    setGuessH(Math.round(Math.random() * 359));
    setGuessS(50); setGuessL(50);
    setTimerPct(100);
    setPhase('memo');
    roundStartMs.current = Date.now();
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      const elapsed = Date.now() - roundStartMs.current;
      const pct = Math.max(0, 100 - (elapsed / MEMO_MS) * 100);
      setTimerPct(pct);
      if (pct <= 0 && timerInterval.current) { clearInterval(timerInterval.current); timerInterval.current = null; }
    }, 50);
    if (memoTimer.current) clearTimeout(memoTimer.current);
    memoTimer.current = setTimeout(() => {
      if (timerInterval.current) { clearInterval(timerInterval.current); timerInterval.current = null; }
      setPhase('match');
    }, MEMO_MS);
  }

  useEffect(() => {
    return () => {
      if (memoTimer.current) clearTimeout(memoTimer.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, []);

  function computeScore(tH: number, tS: number, tL: number, gH: number, gS: number, gL: number) {
    const hueDelta = Math.min(Math.abs(tH - gH), 360 - Math.abs(tH - gH));
    const hueAcc = 100 - (hueDelta / 180) * 100;
    const satAcc = 100 - Math.abs(tS - gS);
    const litAcc = 100 - Math.abs(tL - gL);
    return Math.round(hueAcc * 0.6 + satAcc * 0.2 + litAcc * 0.2);
  }

  function handleSubmit() {
    if (timerInterval.current) { clearInterval(timerInterval.current); timerInterval.current = null; }
    if (memoTimer.current) clearTimeout(memoTimer.current);
    const sc = computeScore(targetH, targetS, targetL, guessH, guessS, guessL);
    setRoundScore(sc);
    setScores(prev => [...prev, sc]);
    setPhase('result');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleNext() {
    if (round >= ROUNDS) {
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setFinalAvg(avg);
      onFinish(avg);
      setPhase('final');
    } else {
      setRound(r => r + 1);
      startRound();
    }
  }

  function handleDone() {
    onComplete();
  }

  function handlePlayAgain() {
    setRound(1);
    setScores([]);
    setRoundScore(0);
    setFinalAvg(0);
    setPhase('start');
  }

  async function handleCopyResult() {
    const breakdown = scores.map((s, i) => `R${i + 1}: ${s}%`).join(' · ');
    const text = `Colour Match — ${finalAvg}% accuracy\n${breakdown}`;
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const targetColor = hslToRgb(targetH, targetS, targetL);
  const guessColor = hslToRgb(guessH, guessS, guessL);

  function badge(channelAcc: number) {
    if (channelAcc >= 97) return { label: 'Exact',    bg: 'rgba(108,196,154,0.18)', color: '#6CC49A' };
    if (channelAcc >= 90) return { label: 'Perfect',  bg: 'rgba(138,176,154,0.18)', color: '#7AAA8A' };
    if (channelAcc >= 78) return { label: 'Close',    bg: 'rgba(172,196,108,0.18)', color: '#ACCA6C' };
    if (channelAcc >= 62) return { label: 'Near',     bg: 'rgba(196,172,108,0.18)', color: '#C4AC6C' };
    if (channelAcc >= 40) return { label: 'Off',      bg: 'rgba(196,149,106,0.18)', color: '#C4956A' };
    return                       { label: 'Way Off',  bg: 'rgba(196,100,100,0.18)', color: '#C46464' };
  }

  const hueDelta = Math.min(Math.abs(targetH - guessH), 360 - Math.abs(targetH - guessH));
  const hueAcc = Math.round(100 - (hueDelta / 180) * 100);
  const satAcc = Math.round(100 - Math.abs(targetS - guessS));
  const litAcc = Math.round(100 - Math.abs(targetL - guessL));

  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
      {/* Round header — hidden on start and final screens */}
      {phase !== 'start' && phase !== 'final' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, color: C.textMuted, textTransform: 'uppercase' }}>
            Round {round} of {ROUNDS}
          </Text>
          {scores.length > 0 && (
            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted }}>
              Best: {Math.max(...scores)}%
            </Text>
          )}
        </View>
      )}

      {/* START PHASE */}
      {phase === 'start' && (
        <View style={{ flex: 1 }}>
          {/* Title */}
          <Text style={{ fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center', letterSpacing: -0.5, marginBottom: 4 }}>
            Colour Match
          </Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted, textAlign: 'center', letterSpacing: 0.5, marginBottom: 24 }}>
            Colour perception · 5 rounds
          </Text>

          {/* Colour hint visual */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 120, height: 120, borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
              <View style={{ position: 'absolute', width: 85, height: 85, borderRadius: 43, backgroundColor: '#C084A0', opacity: 0.7, top: 4, left: 4 }} />
              <View style={{ position: 'absolute', width: 85, height: 85, borderRadius: 43, backgroundColor: '#A78BFA', opacity: 0.6, top: 8, left: 28 }} />
              <View style={{ position: 'absolute', width: 85, height: 85, borderRadius: 43, backgroundColor: '#60A5FA', opacity: 0.5, top: 28, left: 16 }} />
            </View>
          </View>

          {/* Description */}
          <Text style={{ fontSize: 15, fontFamily: 'Lora_400Italic', color: C.textSub, textAlign: 'center', lineHeight: 24, marginBottom: 20 }}>
            {difficulty === 'Easy'
              ? 'Memorise the colour for 8 seconds, then recreate it using the HSL sliders across 5 rounds.'
              : difficulty === 'Hard'
              ? '5 seconds to memorise. 15 seconds to match. Full spectrum — 5 rounds.'
              : 'Memorise the colour for 5 seconds, then recreate it using the HSL sliders across 5 rounds.'}
          </Text>

          {/* Instruction rows */}
          <View style={{ gap: 10 }}>
            {[
              {
                icon: 'eye-outline' as const,
                text: difficulty === 'Easy'
                  ? 'Memorise the colour — you have 8 seconds'
                  : difficulty === 'Hard'
                  ? 'Memorise in 5 s · match in 15 s · 5 rounds'
                  : 'Memorise the colour — you have 5 seconds',
              },
              { icon: 'color-filter-outline' as const, text: 'Adjust H · S · L sliders to match' },
              { icon: 'trophy-outline' as const, text: 'Score points for accuracy across 5 rounds' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.border }}>
                <Ionicons name={item.icon} size={20} color="#C084A0" />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: C.text, lineHeight: 18 }}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={{ alignSelf: 'stretch', marginTop: 28, paddingVertical: 16, borderRadius: 14, backgroundColor: '#C084A0', alignItems: 'center' }}
            onPress={() => { setRound(1); setScores([]); startRound(); }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' }}>Start game</Text>
          </Pressable>
        </View>
      )}

      {/* MEMO PHASE */}
      {phase === 'memo' && (
        <View style={{ flex: 1, justifyContent: 'flex-start', gap: 20 }}>
          <View style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: targetColor, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ alignItems: 'center', gap: 8 }}>
            {(() => {
              const ms = String(Math.ceil((timerPct / 100) * (MEMO_MS / 10)));
              const first = ms[0];
              const rest = ms.slice(1);
              return (
                <Text style={{ fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -2, lineHeight: 96 }}>
                  <Text style={{ fontSize: 80 }}>{first}</Text>
                  {rest.length > 0 && <Text style={{ fontSize: 46 }}>{rest}</Text>}
                </Text>
              );
            })()}
            <Text style={{ fontSize: 13, textAlign: 'center', color: C.textMuted, fontFamily: 'Inter_400Regular' }}>
              Memorise this colour
            </Text>
          </View>
        </View>
      )}

      {/* MATCH PHASE */}
      {phase === 'match' && (
        <View style={{ flex: 1 }}>
          <View style={{ marginBottom: 20 }}>
            <View style={{ height: 200, borderRadius: 16, backgroundColor: guessColor, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
            <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 6, fontFamily: 'Inter_400Regular' }}>Your mix</Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              <HSLSlider
                label="Hue"
                value={guessH} min={0} max={359}
                stops={hslStops(guessH, guessS, guessL, 'hue')}
                onChange={v => setGuessH(v)}
                displayText={`${Math.round(guessH)}°`}
              />
              <HSLSlider
                label="Saturation"
                value={guessS} min={0} max={100}
                stops={hslStops(guessH, guessS, guessL, 'sat')}
                onChange={v => setGuessS(v)}
                displayText={`${Math.round(guessS)}%`}
              />
              <HSLSlider
                label="Lightness"
                value={guessL} min={0} max={100}
                stops={hslStops(guessH, guessS, guessL, 'lit')}
                onChange={v => setGuessL(v)}
                displayText={`${Math.round(guessL)}%`}
              />
            </View>
            <Pressable
              style={{ paddingVertical: 16, borderRadius: 14, backgroundColor: '#C084A0', alignItems: 'center', marginBottom: 20 }}
              onPress={handleSubmit}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' }}>Submit match</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* RESULT PHASE */}
      {phase === 'result' && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ height: 120, borderRadius: 16, backgroundColor: guessColor, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 6, fontFamily: 'Inter_400Regular' }}>Your match</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ height: 120, borderRadius: 16, backgroundColor: targetColor, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
              <Text style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 6, fontFamily: 'Inter_400Regular' }}>Target</Text>
            </View>
          </View>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 52, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -2 }}>{roundScore}%</Text>
            <Text style={{ fontSize: 13, color: C.textMuted, fontFamily: 'Inter_400Regular', marginTop: 2 }}>accuracy this round</Text>
          </View>
          <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, paddingHorizontal: 16 }}>
            {([
              { label: 'Hue', guessVal: `${Math.round(guessH)}°`, targetVal: `${Math.round(targetH)}°`, acc: hueAcc },
              { label: 'Saturation', guessVal: `${Math.round(guessS)}%`, targetVal: `${Math.round(targetS)}%`, acc: satAcc },
              { label: 'Lightness', guessVal: `${Math.round(guessL)}%`, targetVal: `${Math.round(targetL)}%`, acc: litAcc },
            ]).map((row, i, arr) => {
              const b = badge(row.acc);
              return (
                <View key={row.label} style={{ paddingVertical: 12, borderBottomWidth: i < arr.length - 1 ? 0.5 : 0, borderBottomColor: C.border }}>
                  <Text style={{ fontSize: 11, color: C.textMuted, fontFamily: 'Inter_400Regular', marginBottom: 8 }}>{row.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text }}>{row.guessVal}</Text>
                    <View style={{ backgroundColor: b.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: b.color }}>{b.label}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.textSub, textAlign: 'right' }}>{row.targetVal}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Pressable
            style={{ marginTop: 24, paddingVertical: 16, borderRadius: 14, backgroundColor: '#C084A0', alignItems: 'center' }}
            onPress={handleNext}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' }}>
              {round >= ROUNDS ? 'See my results' : 'Next round'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* FINAL PHASE */}
      {phase === 'final' && (() => {
        const avg = finalAvg;
        const acLabel = avg >= 90 ? 'Perfect eye!' : avg >= 75 ? 'Sharp eye!' : avg >= 55 ? 'Getting there' : 'Keep practising';
        return (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center', marginBottom: 4 }}>
                Colour Match complete
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center', marginBottom: 20 }}>
                {acLabel}
              </Text>
              <View style={{ backgroundColor: '#C084A0', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 52, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 60 }}>{avg}%</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                  Average accuracy across {scores.length} round{scores.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 0.8, marginBottom: 10 }}>
                ROUND BREAKDOWN
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {scores.map((s, i) => (
                  <View key={i} style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: s >= 80 ? 'rgba(192,132,160,0.2)' : s >= 60 ? 'rgba(180,160,80,0.15)' : 'rgba(150,100,100,0.15)',
                    borderWidth: 1,
                    borderColor: s >= 80 ? '#C084A0' : s >= 60 ? 'rgba(180,160,80,0.5)' : 'rgba(180,80,80,0.4)',
                  }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.text }}>
                      R{i + 1} · {s}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ gap: 10 }}>
              <Pressable
                style={{ width: '100%', padding: 16, borderRadius: 16, backgroundColor: '#C084A0', alignItems: 'center' }}
                onPress={handlePlayAgain}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' }}>Play again</Text>
              </Pressable>
              <Pressable
                style={{ width: '100%', padding: 16, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center', borderWidth: 1.5, borderColor: '#C084A0' }}
                onPress={handleCopyResult}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#C084A0' }}>Copy result</Text>
              </Pressable>
              <Pressable
                style={{ width: '100%', padding: 14, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center' }}
                onPress={handleDone}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted }}>Done</Text>
              </Pressable>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

// ─── MIND MAP ─────────────────────────────────────────────────────────────────
function MindMap({ difficulty, onFinish, onComplete }: { difficulty: Difficulty; onFinish: (score: number) => void; onComplete: () => void }) {
  const C = useColors();

  const CFG = difficulty === 'Easy'
    ? { startSpan: 4, showMs: 1500, maxAttempts: 3, rounds: 5 }
    : difficulty === 'Medium'
    ? { startSpan: 5, showMs: 1200, maxAttempts: 2, rounds: 6 }
    : { startSpan: 6, showMs: 1000, maxAttempts: 1, rounds: 7 };

  type Phase = 'showing' | 'recall' | 'feedback' | 'result';
  type TState = 'idle' | 'lit' | 'selected' | 'correct' | 'wrong';

  const TILE_SIZE = Math.floor((width - 40 - 24) / 4);
  const ACCENT = '#89A8D9';

  const [phase, setPhase] = useState<Phase>('idle');
  const [tileStates, setTileStates] = useState<TState[]>(Array(16).fill('idle') as TState[]);
  const [spanDisplay, setSpanDisplay] = useState(CFG.startSpan);
  const [roundDisplay, setRoundDisplay] = useState(1);
  const [attemptsDisplay, setAttemptsDisplay] = useState(CFG.maxAttempts);
  const [lastCorrect, setLastCorrect] = useState<boolean>(true);
  const [resultData, setResultData] = useState<{ score: number; correct: number; total: number; peakSpan: number } | null>(null);

  const phaseRef = useRef<Phase>('idle');
  const litRef = useRef<number[]>([]);
  const selectedRef = useRef<number[]>([]);
  const spanRef = useRef(CFG.startSpan);
  const roundRef = useRef(1);
  const attemptsRef = useRef(CFG.maxAttempts);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const peakRef = useRef(0);

  const setPhaseSync = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  const doStartRound = (span: number) => {
    const indices: number[] = [];
    while (indices.length < span) {
      const n = Math.floor(Math.random() * 16);
      if (!indices.includes(n)) indices.push(n);
    }
    litRef.current = indices;
    selectedRef.current = [];
    const ts = Array(16).fill('idle') as TState[];
    indices.forEach(i => { ts[i] = 'lit'; });
    setTileStates(ts);
    setPhaseSync('showing');
  };

  useEffect(() => {
    const t = setTimeout(() => doStartRound(spanRef.current), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'result' && resultData) {
      onFinish(resultData.score);
    }
  }, [phase, resultData]);

  useEffect(() => {
    if (phase !== 'showing') return;
    const t = setTimeout(() => {
      setTileStates(Array(16).fill('idle') as TState[]);
      setPhaseSync('recall');
    }, CFG.showMs);
    return () => clearTimeout(t);
  }, [phase]);

  const handleTilePress = (idx: number) => {
    if (phaseRef.current !== 'recall') return;
    if (selectedRef.current.includes(idx)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...selectedRef.current, idx];
    selectedRef.current = next;

    setTileStates(ts => {
      const n = [...ts] as TState[];
      n[idx] = 'selected';
      return n;
    });

    if (next.length < litRef.current.length) return;

    const lit = litRef.current;
    const isCorrect = lit.every(i => next.includes(i));
    totalRef.current += 1;
    setLastCorrect(isCorrect);
    setPhaseSync('feedback');

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const roundScore = Math.max(0, spanRef.current * 100 - (CFG.maxAttempts - attemptsRef.current) * 20);
      scoreRef.current += roundScore;
      correctRef.current += 1;
      if (spanRef.current > peakRef.current) peakRef.current = spanRef.current;
      setTileStates(() => {
        const ts = Array(16).fill('idle') as TState[];
        lit.forEach(i => { ts[i] = 'correct'; });
        return ts;
      });
      setTimeout(() => {
        const nextSpan = spanRef.current + 1;
        spanRef.current = nextSpan;
        setSpanDisplay(nextSpan);
        if (roundRef.current >= CFG.rounds) {
          setResultData({ score: scoreRef.current, correct: correctRef.current, total: totalRef.current, peakSpan: peakRef.current });
          setPhaseSync('result');
          return;
        }
        roundRef.current += 1;
        setRoundDisplay(roundRef.current);
        attemptsRef.current = CFG.maxAttempts;
        setAttemptsDisplay(CFG.maxAttempts);
        setTimeout(() => doStartRound(nextSpan), 400);
      }, 600);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTileStates(() => {
        const ts = Array(16).fill('idle') as TState[];
        next.forEach(i => { ts[i] = lit.includes(i) ? 'correct' : 'wrong'; });
        lit.forEach(i => { if (!next.includes(i)) ts[i] = 'wrong'; });
        return ts;
      });
      const newAttempts = attemptsRef.current - 1;
      attemptsRef.current = newAttempts;
      setAttemptsDisplay(newAttempts);
      if (newAttempts <= 0) {
        setTimeout(() => {
          setResultData({ score: scoreRef.current, correct: correctRef.current, total: totalRef.current, peakSpan: peakRef.current });
          setPhaseSync('result');
        }, 600);
      } else {
        setTimeout(() => {
          setTileStates(Array(16).fill('idle') as TState[]);
          setTimeout(() => doStartRound(spanRef.current), 400);
        }, 600);
      }
    }
  };

  const statusLabel = phase === 'showing' ? 'Watch carefully…'
    : phase === 'recall' ? 'Your turn'
    : phase === 'feedback' ? (lastCorrect ? '✓ Correct' : '✗ Try again')
    : '';
  const statusColor = phase === 'showing' ? C.lavender
    : phase === 'feedback' && lastCorrect ? C.sage
    : phase === 'feedback' ? C.error
    : C.text;

  const getTileBg = (ts: TState) => {
    if (ts === 'lit') return C.lavender + '2A';
    if (ts === 'selected') return C.lavender + '18';
    if (ts === 'correct') return C.sage + '2A';
    if (ts === 'wrong') return C.error + '2A';
    return C.card;
  };
  const getTileBorder = (ts: TState) => {
    if (ts === 'lit') return C.lavender;
    if (ts === 'selected') return C.lavender + '80';
    if (ts === 'correct') return C.sage;
    if (ts === 'wrong') return C.error;
    return C.border;
  };

  if (phase === 'result' && resultData) {
    const { score, correct, total, peakSpan } = resultData;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const insight = peakSpan >= 7
      ? "Exceptional spatial working memory. You're in the top percentile for visuospatial recall."
      : peakSpan >= 5
      ? "Strong spatial memory. Average adult span is 5–6 on the Corsi Block Test."
      : "Spatial working memory is trainable. Consistent play measurably expands your span.";

    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.8, color: C.textMuted, textTransform: 'uppercase', textAlign: 'center', marginBottom: 32 }}>
          Session Complete
        </Text>

        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <Text style={{ fontSize: 96, fontFamily: 'Inter_700Bold', color: ACCENT, lineHeight: 96 }}>{peakSpan}</Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', letterSpacing: 1.4, color: C.textMuted, textTransform: 'uppercase', marginTop: 6 }}>
            Spatial Span Reached
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'Rounds', value: `${correct}/${CFG.rounds}` },
            { label: 'Score', value: `${score}` },
            { label: 'Accuracy', value: `${accuracy}%` },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text }}>{value}</Text>
              <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, borderLeftWidth: 3, borderLeftColor: ACCENT, borderWidth: 1, borderColor: C.border, marginBottom: 32 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4, color: ACCENT, textTransform: 'uppercase', marginBottom: 8 }}>
            Cognitive Insight
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22 }}>
            {insight}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            style={{ width: '100%', padding: 16, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center' }}
            onPress={() => {
              spanRef.current = CFG.startSpan;
              roundRef.current = 1;
              attemptsRef.current = CFG.maxAttempts;
              scoreRef.current = 0;
              correctRef.current = 0;
              totalRef.current = 0;
              peakRef.current = 0;
              setSpanDisplay(CFG.startSpan);
              setRoundDisplay(1);
              setAttemptsDisplay(CFG.maxAttempts);
              setResultData(null);
              setTimeout(() => doStartRound(CFG.startSpan), 300);
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' }}>Play again</Text>
          </Pressable>
          <Pressable
            style={{ width: '100%', padding: 14, borderRadius: 16, backgroundColor: 'transparent', alignItems: 'center' }}
            onPress={onComplete}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted }}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.textSub }}>
            Round {roundDisplay} / {CFG.rounds}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: ACCENT }}>
            Span {spanDisplay}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: CFG.maxAttempts }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 10, height: 10, borderRadius: 5,
                backgroundColor: i < attemptsDisplay ? ACCENT : C.border,
              }}
            />
          ))}
        </View>
      </View>

      <Text style={{ fontSize: 15, fontFamily: 'Inter_500Medium', color: statusColor, marginBottom: 28, textAlign: 'center', minHeight: 22 }}>
        {statusLabel}
      </Text>

      <View style={{ alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: TILE_SIZE * 4 + 8 * 3 }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const ts = tileStates[i];
            return (
              <Pressable
                key={i}
                onPress={() => handleTilePress(i)}
                disabled={phase !== 'recall'}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: 12,
                  backgroundColor: getTileBg(ts),
                  borderWidth: 1.5,
                  borderColor: getTileBorder(ts),
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── GHOST GRID ───────────────────────────────────────────────────────────────
function GhostGrid({ difficulty, onFinish, onComplete }: { difficulty: Difficulty; onFinish: (score: number) => void; onComplete: () => void }) {
  const C = useColors();

  const COLS = 10, ROWS = 12, GAP = 3;
  const CELL = Math.floor((width - 28 - GAP * (COLS - 1)) / COLS);
  const GRID_W = COLS * CELL + (COLS - 1) * GAP;
  const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;
  const ACCENT = '#22D3EE';

  type IoniconName = keyof typeof Ionicons.glyphMap;
  type AssetDef = { icon: IoniconName; label: string; w: number; h: number; color: string };
  const ASSET_MAP: Record<string, AssetDef> = {
    house:  { icon: 'home',            label: 'House',  w: 2, h: 2, color: C.lavender },
    road:   { icon: 'car',             label: 'Road',   w: 4, h: 1, color: ACCENT },
    lamp:   { icon: 'bulb',            label: 'Lamp',   w: 1, h: 2, color: C.gold },
    tower:  { icon: 'business',        label: 'Tower',  w: 2, h: 3, color: C.sage },
    park:   { icon: 'leaf',            label: 'Park',   w: 2, h: 2, color: C.success },
    tank:   { icon: 'water',           label: 'Tank',   w: 1, h: 2, color: C.error },
    bridge: { icon: 'swap-horizontal', label: 'Bridge', w: 3, h: 1, color: C.lightSky },
    market: { icon: 'storefront',      label: 'Market', w: 2, h: 2, color: C.journalAccent },
  };

  const TOTAL_ROUNDS = 4;

  const CFG = difficulty === 'Easy'
    ? { assets: ['house', 'road', 'lamp', 'tower'], observeTime: 8 }
    : difficulty === 'Medium'
    ? { assets: ['house', 'road', 'lamp', 'tower', 'park', 'tank'], observeTime: 6 }
    : { assets: ['house', 'road', 'lamp', 'tower', 'park', 'tank', 'bridge', 'market'], observeTime: 5 };

  type GGPhase = 'idle' | 'countdown' | 'observe' | 'ghost' | 'reconstruct' | 'reveal' | 'result';
  type Placement = { assetKey: string; col: number; row: number };
  type ScoreRow = { assetKey: string; pts: number; status: 'exact' | 'close' | 'near' | 'wrong' | 'missing' };

  const [phase, setPhase] = useState<GGPhase>('idle');
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [playerPlacements, setPlayerPlacements] = useState<Placement[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(CFG.observeTime);
  const [timerPct, setTimerPct] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [breakdown, setBreakdown] = useState<ScoreRow[]>([]);
  const [roundScore, setRoundScore] = useState(0);
  const [allExact, setAllExact] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionRounds, setSessionRounds] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [ghostVisible, setGhostVisible] = useState(false);
  const [flashCell, setFlashCell] = useState<{ col: number; row: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [countdownNum, setCountdownNum] = useState(3);

  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionScoreRef = useRef(0);
  const sessionRoundsRef = useRef(0);

  const pulseAnim = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: interpolate(pulseAnim.value, [0.85, 1.25], [0.5, 1.0]),
  }));
  const countdownScale = useSharedValue(0.4);
  const countdownStyle = useAnimatedStyle(() => ({ transform: [{ scale: countdownScale.value }] }));

  useEffect(() => {
    if (phase !== 'ghost') { cancelAnimation(pulseAnim); pulseAnim.value = 1; return; }
    pulseAnim.value = withRepeat(
      withSequence(withTiming(1.25, { duration: 700 }), withTiming(0.85, { duration: 700 })),
      -1, false
    );
  }, [phase]);

  useEffect(() => {
    const t = setTimeout(() => startCountdown(), 200);
    return () => { clearTimeout(t); if (timerRef.current) clearInterval(timerRef.current); if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  useEffect(() => {
    if (phase === 'result') onFinish(sessionScoreRef.current);
  }, [phase]);

  function ctl(col: number, row: number) {
    return { x: col * (CELL + GAP), y: row * (CELL + GAP) };
  }
  function apxSize(key: string) {
    const d = ASSET_MAP[key];
    return { w: d.w * CELL + (d.w - 1) * GAP, h: d.h * CELL + (d.h - 1) * GAP };
  }

  function generatePlacements(keys: string[]): Placement[] {
    const result: Placement[] = [];
    const used = new Set<string>();
    for (const key of keys) {
      const d = ASSET_MAP[key];
      let placed = false, tries = 0;
      while (!placed && tries < 400) {
        tries++;
        const col = Math.floor(Math.random() * (COLS - d.w + 1));
        const row = Math.floor(Math.random() * (ROWS - d.h + 1));
        let clash = false;
        outer: for (let r = row; r < row + d.h; r++)
          for (let c = col; c < col + d.w; c++)
            if (used.has(`${c},${r}`)) { clash = true; break outer; }
        if (!clash) {
          result.push({ assetKey: key, col, row });
          for (let r = row; r < row + d.h; r++)
            for (let c = col; c < col + d.w; c++)
              used.add(`${c},${r}`);
          placed = true;
        }
      }
    }
    return result;
  }

  function canPlace(key: string, col: number, row: number, excludeKey: string | null = null): boolean {
    const d = ASSET_MAP[key];
    if (col < 0 || row < 0 || col + d.w > COLS || row + d.h > ROWS) return false;
    for (const p of playerPlacements) {
      if (p.assetKey === excludeKey) continue;
      const pd = ASSET_MAP[p.assetKey];
      if (col < p.col + pd.w && col + d.w > p.col && row < p.row + pd.h && row + d.h > p.row) return false;
    }
    return true;
  }

  function startCountdown() {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCurrentRound(r => r + 1);
    setCountdownNum(3);
    setPhase('countdown');
    countdownScale.value = 0.4;
    countdownScale.value = withTiming(1.0, { duration: 350 });
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(iv);
        countdownRef.current = null;
        doStartObserve();
        return;
      }
      setCountdownNum(n);
      countdownScale.value = 0.4;
      countdownScale.value = withTiming(1.0, { duration: 350 });
    }, 1000);
    countdownRef.current = iv;
  }

  function doStartObserve() {
    const newP = generatePlacements(CFG.assets);
    setPlacements(newP);
    setPlayerPlacements([]);
    setSelectedKey(null);
    setTimeLeft(CFG.observeTime);
    setTimerPct(100);
    setIsPaused(false);
    isPausedRef.current = false;
    setPhase('observe');
    const total = CFG.observeTime * 1000;
    let elapsed = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      elapsed += 100;
      const pct = Math.max(0, 100 - (elapsed / total) * 100);
      setTimerPct(pct);
      setTimeLeft(Math.ceil(Math.max(0, total - elapsed) / 1000));
      if (elapsed >= total) {
        clearInterval(timerRef.current!);
        setPhase('ghost');
        setTimeout(() => setPhase('reconstruct'), 1800);
      }
    }, 100);
  }

  function togglePause() {
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleBankTap(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedKey(k => k === key ? null : key);
  }

  function handleCellTap(col: number, row: number) {
    if (!selectedKey) return;
    if (!canPlace(selectedKey, col, row, selectedKey)) {
      setFlashCell({ col, row });
      setTimeout(() => setFlashCell(null), 350);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setPlayerPlacements(prev => [...prev.filter(p => p.assetKey !== selectedKey), { assetKey: selectedKey, col, row }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedKey(null);
  }

  function submitReconstruction() {
    let total = 0;
    const rows: ScoreRow[] = [];
    for (const correct of placements) {
      const player = playerPlacements.find(p => p.assetKey === correct.assetKey);
      let pts = 0; let status: ScoreRow['status'] = 'missing';
      if (player) {
        const dist = Math.max(Math.abs(player.col - correct.col), Math.abs(player.row - correct.row));
        if (dist === 0) { pts = 100; status = 'exact'; }
        else if (dist <= 1) { pts = 60; status = 'close'; }
        else if (dist <= 2) { pts = 30; status = 'near'; }
        else { pts = 0; status = 'wrong'; }
      }
      total += pts;
      rows.push({ assetKey: correct.assetKey, pts, status });
    }
    const perfect = rows.every(r => r.status === 'exact');
    if (perfect) total += 300;
    setRoundScore(total);
    setAllExact(perfect);
    setBreakdown(rows);
    sessionScoreRef.current += total;
    sessionRoundsRef.current += 1;
    setSessionScore(sessionScoreRef.current);
    setSessionRounds(sessionRoundsRef.current);
    setGhostVisible(false);
    setPhase('reveal');
    setTimeout(() => setGhostVisible(true), 400);
  }

  function renderBlock(key: string, col: number, row: number, opts?: {
    onPress?: () => void; isSelected?: boolean; revealStatus?: ScoreRow['status']; readOnly?: boolean; passthrough?: boolean;
  }) {
    const def = ASSET_MAP[key];
    const pos = ctl(col, row);
    const sz = apxSize(key);
    const sel = opts?.isSelected;
    const rs = opts?.revealStatus;
    const borderColor = rs === 'exact' ? C.sage : (rs === 'close' || rs === 'near') ? C.gold : rs === 'wrong' ? C.error : sel ? def.color : def.color + '80';
    const bgColor = rs === 'exact' ? C.sage + '20' : rs === 'wrong' ? C.error + '18' : def.color + '18';
    const minDim = Math.min(sz.w, sz.h);
    const blockStyle = { position: 'absolute' as const, left: pos.x, top: pos.y, width: sz.w, height: sz.h, borderRadius: 8, backgroundColor: bgColor, borderWidth: sel ? 2 : 1.5, borderColor, alignItems: 'center' as const, justifyContent: 'center' as const };
    const inner = (
      <>
        <Ionicons name={def.icon} size={minDim * 0.38} color={def.color} />
        <Text style={{ fontSize: 7, fontFamily: 'Inter_600SemiBold', color: def.color, letterSpacing: 0.8, marginTop: 1, textTransform: 'uppercase' }}>{def.label}</Text>
      </>
    );
    if (opts?.passthrough) {
      return <View key={key} pointerEvents="none" style={blockStyle}>{inner}</View>;
    }
    return (
      <Pressable key={key} onPress={opts?.readOnly ? undefined : opts?.onPress} style={blockStyle}>
        {inner}
      </Pressable>
    );
  }

  const pauseOverlay = (phase === 'observe' || phase === 'reconstruct') && isPaused ? (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={[C.bg + 'F5', C.bg + 'FD']} style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 32, width: 280, borderWidth: 1, borderColor: C.border, gap: 14 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' }}>Paused</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' }}>The city waits for you.</Text>
        <Pressable onPress={togglePause} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '40' }}>
          <Ionicons name="play" size={16} color={ACCENT} />
          <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: ACCENT }}>Resume</Text>
        </Pressable>
        <Pressable onPress={() => { if (timerRef.current) clearInterval(timerRef.current); onComplete(); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="close" size={16} color={C.textSub} />
          <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.textSub }}>Exit</Text>
        </Pressable>
      </View>
    </View>
  ) : null;

  if (phase === 'idle' || phase === 'countdown') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, color: C.textMuted, textTransform: 'uppercase', marginBottom: 24 }}>Round {currentRound} of {TOTAL_ROUNDS}</Text>
        <Reanimated.View style={[{ alignItems: 'center', justifyContent: 'center' }, countdownStyle]}>
          <Text style={{ fontSize: 88, fontFamily: 'Inter_700Bold', color: ACCENT, lineHeight: 100 }}>{countdownNum}</Text>
        </Reanimated.View>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 28, textAlign: 'center', lineHeight: 22 }}>
          Study the city carefully.{'\n'}Remember where each asset is placed.
        </Text>
      </View>
    );
  }

  if (phase === 'observe') {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 24 }} scrollEnabled={!isPaused}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' }}>Round {currentRound} of {TOTAL_ROUNDS}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={togglePause} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Ionicons name={isPaused ? 'play' : 'pause'} size={15} color={C.textSub} />
            </Pressable>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.card, borderWidth: 2, borderColor: timeLeft <= 2 ? C.error : C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: timeLeft <= 2 ? C.error : C.lavender }}>{timeLeft}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginBottom: 10 }}>Study the city layout carefully. Remember what's placed where.</Text>
          <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: 14, overflow: 'hidden', flexDirection: 'row' }}>
            <View style={{ flex: Math.max(0.01, timerPct), height: 6, borderRadius: 3, backgroundColor: timerPct < 20 ? C.error : timerPct < 50 ? C.gold : ACCENT }} />
            <View style={{ flex: Math.max(0.01, 100 - timerPct), height: 6 }} />
          </View>
          <View style={{ width: GRID_W, height: GRID_H, position: 'relative' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: GRID_W }}>
              {Array.from({ length: COLS * ROWS }).map((_, i) => (
                <View key={i} style={{ width: CELL, height: CELL, backgroundColor: C.card, borderRadius: 3, borderWidth: 0.5, borderColor: C.border }} />
              ))}
            </View>
            {placements.map(p => renderBlock(p.assetKey, p.col, p.row, { readOnly: true }))}
          </View>
        </ScrollView>
        {pauseOverlay}
      </View>
    );
  }

  if (phase === 'ghost') {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Reanimated.View style={[{
          width: 112, height: 112, borderRadius: 56,
          backgroundColor: ACCENT + '14', borderWidth: 2, borderColor: ACCENT + '40',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: C.lightSky, shadowOpacity: 0.55, shadowRadius: 24, elevation: 10,
        }, pulseStyle]}>
          <Ionicons name="grid" size={44} color={ACCENT} />
        </Reanimated.View>
        <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, marginTop: 32, textAlign: 'center' }}>The city fades…</Text>
        <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          Reconstruct it from memory.{'\n'}Trust your spatial mind.
        </Text>
      </View>
    );
  }

  if (phase === 'reconstruct') {
    const totalAssets = CFG.assets.length;
    const placedCount = playerPlacements.length;
    const allPlaced = placedCount === totalAssets;
    const selDef = selectedKey ? ASSET_MAP[selectedKey] : null;
    return (
      <View style={{ flex: 1 }}>
        {/* ── Top bar (non-scrollable) ── */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 2, color: C.lavender, textTransform: 'uppercase' }}>Round {currentRound} of {TOTAL_ROUNDS}</Text>
            <View style={{ flex: 1 }} />
            <Pressable onPress={togglePause} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={isPaused ? 'play' : 'pause'} size={15} color={C.textSub} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted }}>{placedCount} of {totalAssets} placed</Text>
        </View>

        {/* ── Scrollable grid ── */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 8 }} scrollEnabled={!isPaused}>
          <View style={{ width: GRID_W, height: GRID_H, position: 'relative' }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: GRID_W }}>
              {Array.from({ length: COLS * ROWS }).map((_, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const isFlashing = flashCell?.col === col && flashCell?.row === row;
                return (
                  <Pressable key={i}
                    onPress={() => handleCellTap(col, row)}
                    onPressIn={() => { if (selectedKey) setHoverCell({ col, row }); }}
                    onPressOut={() => setHoverCell(null)}
                    disabled={!selectedKey}
                    style={{
                      width: CELL, height: CELL, borderRadius: 3,
                      backgroundColor: isFlashing ? C.error + '30' : C.card,
                      borderWidth: 0.5,
                      borderColor: isFlashing ? C.error : C.border,
                    }} />
                );
              })}
            </View>
            {playerPlacements.map(p => renderBlock(p.assetKey, p.col, p.row, {
              isSelected: selectedKey === p.assetKey,
              onPress: () => handleBankTap(p.assetKey),
              passthrough: !!(selectedKey && selectedKey !== p.assetKey),
            }))}
            {hoverCell && selectedKey ? (() => {
              const valid = canPlace(selectedKey, hoverCell.col, hoverCell.row, selectedKey);
              return (
                <View pointerEvents="none" style={{
                  position: 'absolute',
                  left: ctl(hoverCell.col, hoverCell.row).x,
                  top: ctl(hoverCell.col, hoverCell.row).y,
                  width: apxSize(selectedKey).w,
                  height: apxSize(selectedKey).h,
                  borderRadius: 8,
                  backgroundColor: valid ? ACCENT + '22' : C.error + '22',
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: valid ? ACCENT + '80' : C.error + '80',
                }} />
              );
            })() : null}
          </View>
        </ScrollView>

        {/* ── Fixed bottom: in-hand chip + asset bank + submit ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24 }}>
          <View style={{ height: 34, justifyContent: 'center', marginBottom: 8 }}>
            {selDef ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: selDef.color + '15', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: selDef.color + '40' }}>
                <Ionicons name={selDef.icon} size={13} color={selDef.color} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: selDef.color, flex: 1 }} numberOfLines={1}>
                  {selDef.label} — press & hold to preview, tap to place
                </Text>
                <Pressable onPress={() => { setSelectedKey(null); setHoverCell(null); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={selDef.color + 'BB'} />
                </Pressable>
              </View>
            ) : (
              <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' }}>
                Tap an asset below to select it
              </Text>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
            {CFG.assets.map(key => {
              const def = ASSET_MAP[key];
              const isPlaced = playerPlacements.some(p => p.assetKey === key);
              const isSel = selectedKey === key;
              return (
                <Pressable key={key} onPress={() => handleBankTap(key)} style={{
                  width: 62, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: isSel ? def.color + '20' : C.card,
                  borderWidth: 1.5, borderColor: isSel ? def.color : isPlaced ? def.color + '50' : C.border,
                  alignItems: 'center', gap: 4, opacity: isPlaced && !isSel ? 0.65 : 1,
                }}>
                  <Ionicons name={def.icon} size={20} color={def.color} />
                  <Text style={{ fontSize: 8, fontFamily: 'Inter_600SemiBold', color: def.color, textTransform: 'uppercase', letterSpacing: 0.7 }}>{def.label}</Text>
                  {isPlaced && (
                    <View style={{ position: 'absolute', top: 4, right: 4, width: 13, height: 13, borderRadius: 7, backgroundColor: C.sage, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={8} color={C.bg} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={allPlaced ? submitReconstruction : undefined} disabled={!allPlaced}
            style={{ padding: 15, borderRadius: 16, backgroundColor: allPlaced ? ACCENT : C.card, alignItems: 'center', borderWidth: 1, borderColor: allPlaced ? 'transparent' : C.border }}>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: allPlaced ? C.bg : C.textMuted }}>
              {allPlaced ? 'Submit →' : 'Place all assets to submit'}
            </Text>
          </Pressable>
        </View>

        {pauseOverlay}
      </View>
    );
  }

  if (phase === 'reveal') {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 2, color: C.text, textTransform: 'uppercase' }}>Results</Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: allExact ? C.sage : C.gold }}>{roundScore} pts</Text>
        </View>
        <View style={{ width: GRID_W, height: GRID_H, position: 'relative', marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, width: GRID_W }}>
            {Array.from({ length: COLS * ROWS }).map((_, i) => (
              <View key={i} style={{ width: CELL, height: CELL, backgroundColor: C.card, borderRadius: 3, borderWidth: 0.5, borderColor: C.border }} />
            ))}
          </View>
          {breakdown.filter(b => b.status !== 'missing').map(b => {
            const pp = playerPlacements.find(p => p.assetKey === b.assetKey)!;
            return renderBlock(b.assetKey, pp.col, pp.row, { revealStatus: b.status, readOnly: true });
          })}
          {ghostVisible && breakdown.filter(b => b.status !== 'exact').map(b => {
            const correct = placements.find(p => p.assetKey === b.assetKey)!;
            const pos = ctl(correct.col, correct.row);
            const sz = apxSize(b.assetKey);
            const def = ASSET_MAP[b.assetKey];
            return (
              <View key={`g-${b.assetKey}`} style={{
                position: 'absolute', left: pos.x, top: pos.y, width: sz.w, height: sz.h,
                borderRadius: 8, borderWidth: 1.5, borderColor: ACCENT + '55',
                borderStyle: 'dotted', backgroundColor: ACCENT + '08',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={def.icon} size={Math.min(sz.w, sz.h) * 0.3} color={ACCENT} style={{ opacity: 0.35 }} />
              </View>
            );
          })}
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, gap: 10 }}>
          {breakdown.map(b => {
            const def = ASSET_MAP[b.assetKey];
            const sc = b.pts === 100 ? C.sage : b.pts === 0 ? C.error : C.gold;
            const sl = b.status === 'exact' ? 'Exact' : b.status === 'close' ? 'Close · 1 cell' : b.status === 'near' ? 'Near · 2 cells' : b.status === 'missing' ? 'Not placed' : 'Wrong';
            return (
              <View key={b.assetKey} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={def.icon} size={15} color={def.color} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub, flex: 1 }}>{def.label}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: sc }}>{sl} · {b.pts}pt</Text>
              </View>
            );
          })}
          {allExact && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
              <Ionicons name="star" size={15} color={C.sage} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: C.sage, flex: 1 }}>Perfect bonus</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: C.sage }}>+300pt</Text>
            </View>
          )}
        </View>
        <View style={{ gap: 10 }}>
          {currentRound >= TOTAL_ROUNDS ? (
            <Pressable onPress={() => setPhase('result')} style={{ padding: 16, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.bg }}>See Results →</Text>
            </Pressable>
          ) : (
            <Pressable onPress={startCountdown} style={{ padding: 16, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.bg }}>Next Round ({currentRound + 1}/{TOTAL_ROUNDS}) →</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    );
  }

  if (phase === 'result') {
    const maxPossible = CFG.assets.length * 100 * Math.max(1, sessionRoundsRef.current);
    const accuracy = Math.min(100, Math.round((sessionScoreRef.current / maxPossible) * 100));
    const insight = accuracy >= 85
      ? "Exceptional spatial working memory. Your hippocampus is encoding city layouts with high fidelity — the same system that underpins real-world navigation."
      : accuracy >= 60
      ? "Strong object-location binding. You're accurately linking what to where, a skill processed by the parietal and hippocampal systems."
      : accuracy >= 40
      ? "Spatial memory is trainable. Consistent play measurably expands your recall capacity and strengthens the dorsal visual pathway."
      : "Every session builds the neural map. Spatial working memory sits in the parietal cortex and responds strongly to repeated practice.";
    return (
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.8, color: C.textMuted, textTransform: 'uppercase', marginBottom: 16 }}>
            {TOTAL_ROUNDS} Rounds Complete
          </Text>
          <Text style={{ fontSize: 64, fontFamily: 'Inter_700Bold', color: ACCENT, lineHeight: 68 }}>{sessionScoreRef.current}</Text>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 1.4, color: C.textMuted, textTransform: 'uppercase', marginTop: 4 }}>
            Total Score
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Rounds', value: `${sessionRoundsRef.current}` },
            { label: 'Accuracy', value: `${accuracy}%` },
          ].map(({ label, value }) => (
            <View key={label} style={{ flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text }}>{value}</Text>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_500Medium', color: C.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: ACCENT, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 }}>
            Cognitive Insight
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20 }}>{insight}</Text>
        </View>
        <View style={{ gap: 10 }}>
          <Pressable style={{ padding: 16, borderRadius: 16, backgroundColor: ACCENT, alignItems: 'center' }}
            onPress={() => {
              sessionScoreRef.current = 0; sessionRoundsRef.current = 0;
              setSessionScore(0); setSessionRounds(0); setCurrentRound(0);
              startCountdown();
            }}>
            <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.bg }}>Play Again</Text>
          </Pressable>
          <Pressable style={{ padding: 14, borderRadius: 16, alignItems: 'center' }} onPress={onComplete}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted }}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <View style={{ flex: 1 }} />;
}

function PlayGame({ gameId, difficulty, onFinish, onComplete }: { gameId: string; difficulty: Difficulty; onFinish: (score: number) => void; onComplete: () => void }) {
  const C = useColors();
  const map: Record<string, React.FC<{ difficulty: Difficulty; onFinish: (score: number) => void }>> = {
    'signal-spotter': SignalSpotter,
    'code-cracker': CodeCracker,
    'travel-bag': TravelBag,
    'time-lock': TimeLock,
    'focus-anchor': FocusAnchor,
    'story-recall': StoryRecall,
    'beat-recall': BeatRecall,
    'drift-control': DriftControl,
    'endurance-run': EnduranceRun,
    'sorting-flow': SortingFlow,
    'multitask-challenge': MultiTaskChallenge,
    'detectives-notebook': DetectivesNotebook,
  };
  if (gameId === 'colour-match') {
    return <ColourMatch difficulty={difficulty} onFinish={onFinish} onComplete={onComplete} />;
  }
  if (gameId === 'mind-map') {
    return <MindMap difficulty={difficulty} onFinish={onFinish} onComplete={onComplete} />;
  }
  if (gameId === 'ghost-grid') {
    return <GhostGrid difficulty={difficulty} onFinish={onFinish} onComplete={onComplete} />;
  }
  const Component = map[gameId];
  if (!Component) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.text }}>Game coming soon</Text></View>;
  return <Component difficulty={difficulty} onFinish={onFinish} />;
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function GameScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, recordGamePlay, gameStats } = useApp();
  const [view, setView] = useState<GameView>('detail');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [finalScore, setFinalScore] = useState(0);
  const [premiumModal, setPremiumModal] = useState(false);

  const game = GAMES.find(g => g.id === id);
  const stat = gameStats.find(s => s.gameId === id);
  const fav = isFavourite(id ?? '');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!game) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.text }}>Game not found</Text>
      </View>
    );
  }

  const handlePlay = () => {
    if (game.premium) { setPremiumModal(true); return; }
    setView('playing');
  };

  const handleFinish = (score: number) => {
    setFinalScore(score);
    // Pass difficulty as lowercase string (matches DB values: 'easy'|'medium'|'hard')
    recordGamePlay(game.id, score, difficulty.toLowerCase());
    if (game.id !== 'colour-match' && game.id !== 'mind-map' && game.id !== 'ghost-grid') setView('result');
  };

  const handleComplete = () => setView('result');

  if (view === 'playing') {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.gameHeader}>
          <Pressable style={styles.gameBackBtn} onPress={() => setView('detail')}>
            <Ionicons name="close" size={22} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={[styles.diffBadge, { backgroundColor: game.color + '20' }]}>
            <Text style={[styles.diffBadgeText, { color: game.color }]}>{difficulty}</Text>
          </View>
        </View>
        <PlayGame gameId={game.id} difficulty={difficulty} onFinish={handleFinish} onComplete={handleComplete} />
      </View>
    );
  }

  if (view === 'result') {
    const pct = Math.min(100, Math.round(finalScore));
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <LinearGradient colors={[C.gamePurple, C.gamePurple2, C.bg]} style={StyleSheet.absoluteFill} />
        <View style={styles.resultContent}>
          <View style={styles.resultIconWrap}>
            <LinearGradient colors={[game.color + '40', game.color + '10']} style={StyleSheet.absoluteFill} />
            <Ionicons name={game.icon as any} size={48} color={game.color} />
          </View>
          <Text style={styles.resultTitle}>Session Complete</Text>
          <Text style={styles.resultGame}>{game.name}</Text>
          <View style={styles.resultStars}>
            {[1,2,3].map(s => <Ionicons key={s} name="star" size={30} color={s <= stars ? C.gold : C.border} />)}
          </View>
          <Text style={styles.resultScore}>{finalScore}</Text>
          <Text style={styles.resultScoreLabel}>points</Text>
          {stat && <Text style={styles.resultBest}>Best: {Math.max(stat.bestScore, finalScore)}</Text>}
          <View style={styles.resultBtns}>
            <Pressable style={[styles.resultBtn, { borderColor: game.color + '60' }]} onPress={() => setView('detail')}>
              <Ionicons name="home" size={18} color={game.color} />
              <Text style={[styles.resultBtnText, { color: game.color }]}>Detail</Text>
            </Pressable>
            <Pressable style={[styles.resultBtn, { backgroundColor: game.color }]} onPress={() => setView('playing')}>
              <Ionicons name="refresh" size={18} color={C.bg} />
              <Text style={[styles.resultBtnText, { color: C.bg }]}>Play Again</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Detail view
  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={styles.gameHeader}>
          <Pressable style={styles.gameBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Pressable
            onPress={() => toggleFavourite({ id: game.id, type: 'game', title: game.name, color: game.color, icon: game.icon, category: game.category })}
          >
            <Ionicons name={fav ? 'star' : 'star-outline'} size={22} color={fav ? C.gold : C.textSub} />
          </Pressable>
        </View>

        <View style={styles.detailHero}>
          <LinearGradient colors={[game.color + '30', game.color + '10']} style={StyleSheet.absoluteFill} />
          <View style={[styles.detailIcon, { backgroundColor: game.color + '25', borderColor: game.color + '50' }]}>
            <Ionicons name={game.icon as any} size={48} color={game.color} />
          </View>
          {game.premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={C.gold} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
          <Text style={styles.detailName}>{game.name}</Text>
          <View style={styles.detailTagRow}>
            <View style={[styles.detailTag, { backgroundColor: game.color + '25' }]}>
              <Text style={[styles.detailTagText, { color: game.color }]}>{game.category}</Text>
            </View>
            <View style={[styles.detailTag, { backgroundColor: C.card }]}>
              <Text style={[styles.detailTagText, { color: C.textSub }]}>{game.cognitiveArea}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailBody}>
          <Text style={styles.detailDesc}>{game.description}</Text>

          {stat && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stat.plays}</Text>
                <Text style={styles.statLabel}>Plays</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stat.bestScore}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{stat.lastPlayed}</Text>
                <Text style={styles.statLabel}>Last Played</Text>
              </View>
            </View>
          )}

          <Text style={styles.diffLabel}>Difficulty</Text>
          <View style={styles.diffRow}>
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <Pressable
                key={d}
                style={[styles.diffChip, difficulty === d && { backgroundColor: game.color + '25', borderColor: game.color }]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.diffChipText, { color: difficulty === d ? game.color : C.textSub }]}>{d}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.playBigBtn, { backgroundColor: game.color, opacity: pressed ? 0.85 : 1 }, { marginHorizontal: 20, marginTop: 8 }]}
          onPress={handlePlay}
        >
          {game.premium ? <Ionicons name="star" size={20} color={C.bg} /> : <Ionicons name="play" size={20} color={C.bg} />}
          <Text style={styles.playBigText}>{game.premium ? 'Unlock to Play' : 'Play Now'}</Text>
        </Pressable>
      </ScrollView>

      {premiumModal && (
        <Pressable style={styles.premModalOverlay} onPress={() => setPremiumModal(false)}>
          <View style={styles.premModalBox}>
            <LinearGradient colors={[C.gold + '20', C.bg2]} style={StyleSheet.absoluteFill} />
            <Ionicons name="star" size={36} color={C.gold} />
            <Text style={styles.premModalTitle}>Premium Feature</Text>
            <Text style={styles.premModalSub}>Upgrade to Manas Premium to access {game.name} and all other advanced games.</Text>
            <Pressable style={[styles.playBigBtn, { backgroundColor: C.gold }]} onPress={() => setPremiumModal(false)}>
              <Text style={[styles.playBigText, { color: C.bg }]}>Unlock Premium</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  gameHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  gameBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  gameHeaderTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, flex: 1, textAlign: 'center' },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  diffBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  detailHero: { margin: 16, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  detailIcon: { width: 90, height: 90, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.gold + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  premiumBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.gold },
  detailName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.text, textAlign: 'center' },
  detailTagRow: { flexDirection: 'row', gap: 8 },
  detailTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  detailTagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  detailBody: { paddingHorizontal: 20, gap: 16 },
  detailDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 26 },
  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  statNum: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub },
  diffLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textSub },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  diffChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  playBigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  playBigText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  resultContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  resultIconWrap: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  resultTitle: { fontSize: 16, fontFamily: 'Inter_500Medium', color: C.textSub },
  resultGame: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.text },
  resultStars: { flexDirection: 'row', gap: 8 },
  resultScore: { fontSize: 56, fontFamily: 'Inter_700Bold', color: C.text },
  resultScoreLabel: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub, marginTop: -12 },
  resultBest: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  resultBtns: { flexDirection: 'row', gap: 12 },
  resultBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, backgroundColor: C.card },
  resultBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  gameHUD: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  hudLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  hudValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
  timerBar: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: 6, borderRadius: 3 },
  gamePlayArea: { flex: 1, position: 'relative' },
  spotterCircle: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  targetHint: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  targetDot: { width: 10, height: 10, borderRadius: 5 },
  targetHintText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  missText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.error },
  codeCracker: { padding: 16, gap: 16 },
  ccInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 20, backgroundColor: C.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  ccGuesses: { gap: 8 },
  ccGuessRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  ccGuessDigits: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: 8, flex: 1 },
  ccFeedback: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', maxWidth: 60 },
  ccDot: { width: 10, height: 10, borderRadius: 5 },
  ccNone: { fontSize: 16, color: C.error },
  ccGuessCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  ccInputRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  ccDigitBox: { width: 48, height: 60, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  ccDigit: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  ccResult: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  ccKeypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  ccKey: { width: 70, height: 50, borderRadius: 12, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  ccKeyText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  ccSubmit: { backgroundColor: C.lavender, borderColor: C.lavender, width: 70 },
  ccAttemptsLeft: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub },
  tbShow: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 },
  tbPhaseLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textSub },
  tbProgress: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  tbItemBig: { alignItems: 'center', gap: 16 },
  tbItemLabel: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  tbDots: { flexDirection: 'row', gap: 8 },
  tbDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  tbRecall: { flex: 1, padding: 16, gap: 16 },
  tbSelectedRow: { flexDirection: 'row', gap: 8 },
  tbSlot: { flex: 1, height: 40, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  tbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tbGridItem: { width: 80, height: 80, borderRadius: 16, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: C.border },
  tbGridLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: C.textSub, textAlign: 'center' },
  timeLock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  tlRound: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  tlTarget: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.text },
  tlInstruction: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
  tlOrb: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  tlOrbText: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  tlResult: { alignItems: 'center', gap: 6 },
  tlResultTime: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  tlResultDiff: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tlScore: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textSub },
  faInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', paddingHorizontal: 20 },
  distractor: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: C.error + '40', borderWidth: 1, borderColor: C.error },
  anchorWrap: { position: 'absolute', bottom: 80, alignSelf: 'center' },
  anchor: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  anchorText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  srRead: { flex: 1, padding: 20, gap: 16 },
  srPhaseLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub },
  srStoryScroll: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  srStory: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 28, padding: 20 },
  srReadyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.lavender, paddingVertical: 14, borderRadius: 14 },
  srReadyText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
  srQuiz: { flex: 1, padding: 20, gap: 14 },
  srQProgress: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted },
  srQuestion: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text, lineHeight: 30 },
  srOption: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  srOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text },
  srScore: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub, textAlign: 'center' },
  beatRecall: { flex: 1, padding: 20, gap: 24, alignItems: 'center' },
  brPhase: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textSub },
  brSequence: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  brSeqItem: { width: 60, height: 60, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  brSeqLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  brUserSeq: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  brBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  brBtn: { width: 80, height: 64, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  brBtnLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  brProgress: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub },
  driftControl: { flex: 1 },
  dcInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  dcZone: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dcZoneRing: { borderWidth: 2, borderColor: C.mauve + '50', borderStyle: 'dashed', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  dcOrb: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: C.mauve, shadowColor: C.mauve, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  endurance: { flex: 1, gap: 16 },
  endInstruction: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', paddingHorizontal: 20 },
  endArena: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  endPlatform: { height: 8, backgroundColor: C.lavender + '60', borderRadius: 4, alignItems: 'center', position: 'relative' },
  endChar: { position: 'absolute', bottom: 8 },
  endControls: { flexDirection: 'row', gap: 20, justifyContent: 'center', paddingBottom: 40 },
  endBtn: { width: 80, height: 80, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  sortingFlow: { flex: 1 },
  sfHint: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', backgroundColor: C.gold + '20', paddingVertical: 8, marginHorizontal: 16, borderRadius: 12 },
  sfHintText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sfItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sfItemShape: { width: 140, height: 140, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 8 },
  sfItemText: { fontSize: 20, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  sfItemSubText: { fontSize: 14, fontFamily: 'Inter_400Regular', textTransform: 'capitalize' },
  sfPrompt: { textAlign: 'center', fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textSub },
  sfBins: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 20 },
  sfBin: { flex: 1, height: 60, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sfBinText: { fontSize: 13, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },
  sfDone: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sfDoneText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  multiTask: { flex: 1 },
  mtStartBtn: { alignSelf: 'center', marginTop: 60, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.gold, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 },
  mtStartText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.bg },
  mtPopup: { margin: 20, backgroundColor: C.card, borderRadius: 20, padding: 24, gap: 14, borderWidth: 1, borderColor: C.border },
  mtPopupLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: C.gold, letterSpacing: 2 },
  mtQuestion: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  mtOpt: { backgroundColor: C.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  mtOptText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: C.text },
  mtMain: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  mtMainText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
  mtMainSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center' },
  mtPulse: { marginTop: 20 },
  detective: { flex: 1, padding: 16, gap: 12 },
  detPhaseLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textSub },
  detScene: { gap: 10 },
  detItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  detItemLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
  detItemPos: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  premModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'flex-end' },
  premModalBox: { width: '100%', padding: 32, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 16, alignItems: 'center', overflow: 'hidden', borderTopWidth: 1, borderColor: C.gold + '40' },
  premModalTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  premModalSub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
});
}
