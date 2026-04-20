import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

// ─── Canonical Hamiltonian path through 5×5 grid ────────────────────────────
// Grid layout (cell = row*5+col):
//  0  1  2  3  4
//  5  6  7  8  9
// 10 11 12 13 14
// 15 16 17 18 19
// 20 21 22 23 24
//
// Path: 0→1→2→3→4→9→8→7→6→5→10→11→12→13→14→19→24→23→22→21→20→15→16→17→18
// Anchors in order: 4, 10, 20
// Gates (in path order): 2, 7, 22, 16  →  questions [0,1,2,3]
// End cell: 18

const CANONICAL_PATH = [0,1,2,3,4,9,8,7,6,5,10,11,12,13,14,19,24,23,22,21,20,15,16,17,18];
const ANCHORS:  Record<number, string> = { 4: 'A', 10: 'B', 20: 'C' };
const GATE_ORDER = [2, 7, 22, 16];
const GATE_SET   = new Set(GATE_ORDER);
const END_CELL   = 18;
const TOTAL      = 25;

const CELL_SIZE = 54;
const CELL_GAP  = 4;
const GRID_COLS = 5;

// ─── State / reducer ─────────────────────────────────────────────────────────
interface State {
  path:           number[];
  done:           boolean;
  gateCell:       number | null;   // which gate is open (null = closed)
  gateCleared:    boolean[];       // [q0,q1,q2,q3] correct/wrong
  selectedOpt:    number | null;
  showExplain:    boolean;
  error:          string;
}

const INIT: State = {
  path:        [0],
  done:        false,
  gateCell:    null,
  gateCleared: [false, false, false, false],
  selectedOpt: null,
  showExplain: false,
  error:       '',
};

type Action =
  | { type: 'TAP';         cell: number }
  | { type: 'OPEN_GATE';   cell: number }
  | { type: 'ANSWER';      idx: number; correct: boolean }
  | { type: 'CLOSE_GATE' }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ERROR';       msg: string };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'TAP': {
      const next = CANONICAL_PATH[s.path.length];
      if (a.cell !== next) return { ...s, error: 'Wrong cell — follow the glowing path' };
      const newPath = [...s.path, a.cell];
      if (GATE_SET.has(a.cell)) return { ...s, path: newPath, error: '' }; // gate opened by timer
      const done = newPath.length === TOTAL && a.cell === END_CELL;
      return { ...s, path: newPath, done, error: '' };
    }
    case 'OPEN_GATE':
      return { ...s, gateCell: a.cell, selectedOpt: null, showExplain: false };
    case 'ANSWER': {
      const newCleared = [...s.gateCleared];
      const gi = GATE_ORDER.indexOf(s.gateCell ?? -1);
      if (gi >= 0) newCleared[gi] = a.correct;
      return { ...s, selectedOpt: a.idx, showExplain: true, gateCleared: newCleared };
    }
    case 'CLOSE_GATE': {
      const done = s.path.length === TOTAL && s.path[TOTAL - 1] === END_CELL;
      return { ...s, gateCell: null, selectedOpt: null, showExplain: false, done };
    }
    case 'UNDO': {
      if (s.path.length <= 1) return s;
      const last = s.path[s.path.length - 1];
      const gi   = GATE_ORDER.indexOf(last);
      if (gi >= 0 && s.gateCleared[gi]) return s; // cannot undo past answered gate
      return { ...s, path: s.path.slice(0, -1), error: '' };
    }
    case 'RESET':  return { ...INIT };
    case 'ERROR':  return { ...s, error: a.msg };
    case 'CLEAR_ERROR': return { ...s, error: '' };
    default: return s;
  }
}

// ─── Pulsing animation for unvisited gate cells ───────────────────────────────
function PulseDot({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,   duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, transform: [{ scale }], opacity }}
    />
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ThreadScreen() {
  const C        = useColors();
  const insets   = useSafeAreaInsets();
  const { topic, setThreadResult, startTime } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [state, dispatch] = React.useReducer(reducer, INIT);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(500)).current;
  const gateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shake on wrong tap
  const triggerShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Slide gate sheet up/down
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.gateCell !== null ? 0 : 500,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.gateCell, slideAnim]);

  // Auto-advance to results when done
  useEffect(() => {
    if (!state.done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const correct = state.gateCleared.filter(Boolean).length;
    // gatesAnswered: number[] — 1 = correct, 0 = wrong, per gate index
    const gatesAnsweredNums = state.gateCleared.map(b => (b ? 1 : 0));
    doneTimer.current = setTimeout(() => {
      setThreadResult(correct, 4, gatesAnsweredNums, state.path);
      router.push('/deep-dive/results');
    }, 800);
    return () => { if (doneTimer.current) clearTimeout(doneTimer.current); };
  }, [state.done]);

  // Clear error after 2.2s
  useEffect(() => {
    if (!state.error) return;
    triggerShake();
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 2200);
    return () => clearTimeout(t);
  }, [state.error, triggerShake]);

  function handleCellTap(cell: number) {
    // Block taps while done, gate modal is open, or last cell is a gate pending clearance
    const lastCell = state.path[state.path.length - 1];
    const lastGateIdx = GATE_ORDER.indexOf(lastCell);
    const awaitingGate = lastGateIdx >= 0 && !state.gateCleared[lastGateIdx];
    if (state.done || state.gateCell !== null || awaitingGate) return;

    if (state.path.includes(cell)) {
      dispatch({ type: 'ERROR', msg: 'Already visited — no revisiting cells' });
      return;
    }

    const next = CANONICAL_PATH[state.path.length];
    if (cell !== next) {
      dispatch({ type: 'ERROR', msg: 'Wrong cell — follow the glowing path' });
      return;
    }

    Haptics.selectionAsync();
    dispatch({ type: 'TAP', cell });

    if (GATE_SET.has(cell)) {
      gateTimer.current = setTimeout(() => dispatch({ type: 'OPEN_GATE', cell }), 280);
    }
  }

  function handleAnswer(idx: number) {
    if (state.selectedOpt !== null || state.gateCell === null) return;
    const gi = GATE_ORDER.indexOf(state.gateCell);
    const correct = gi >= 0 && topic?.questions?.[gi]?.correct === idx;
    if (correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    dispatch({ type: 'ANSWER', idx, correct });
  }

  function handleContinueGate() {
    if (!state.showExplain) return;
    dispatch({ type: 'CLOSE_GATE' });
  }

  function handleUndo() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch({ type: 'UNDO' });
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (gateTimer.current)  clearTimeout(gateTimer.current);
    if (doneTimer.current)  clearTimeout(doneTimer.current);
    dispatch({ type: 'RESET' });
  }

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const pathSet   = new Set(state.path);
  const nextCell  = CANONICAL_PATH[state.path.length];
  const progress  = state.path.length / TOTAL;

  // Current gate question
  const gateQIdx  = state.gateCell !== null ? GATE_ORDER.indexOf(state.gateCell) : -1;
  const question  = gateQIdx >= 0 ? topic.questions?.[gateQIdx] : null;
  const isCorrect = state.selectedOpt !== null && question?.correct === state.selectedOpt;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.phaseNum, { color: C.lavender }]}>Phase 3 of 3</Text>
          <Text style={[styles.phaseLabel, { color: C.textMuted }]} numberOfLines={1}>Thread · {topic.name}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: C.card }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%`, backgroundColor: C.sage }]} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={[styles.statText, { color: C.textMuted }]}>
          <Text style={{ color: C.text, fontFamily: 'Inter_700Bold' }}>{state.path.length}</Text>
          /{TOTAL} cells
        </Text>
        <Text style={[styles.statText, { color: C.textMuted }]}>
          {'Gates: '}<Text style={{ color: C.text, fontFamily: 'Inter_700Bold' }}>{state.gateCleared.filter(Boolean).length}/4</Text>
        </Text>
      </View>

      {/* Instruction */}
      <Text style={[styles.hint, { color: C.textMuted }]}>
        {state.done ? '✓ Complete!' : `Next: tap cell ${nextCell}`}
      </Text>

      {/* Error */}
      {!!state.error && (
        <View style={[styles.errorBanner, { backgroundColor: C.rose + '20', borderColor: C.rose + '50' }]}>
          <Ionicons name="close-circle" size={14} color={C.rose} />
          <Text style={[styles.errorText, { color: C.rose }]}>{state.error}</Text>
        </View>
      )}

      {/* Grid */}
      <View style={styles.gridWrap}>
        <Animated.View style={[styles.grid, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: TOTAL }, (_, cell) => {
            const visited   = pathSet.has(cell);
            const isCurrent = cell === state.path[state.path.length - 1];
            const isNextHint = !state.done && cell === nextCell;
            const isAnchor  = cell in ANCHORS;
            const isGate    = GATE_SET.has(cell);
            const isEnd     = cell === END_CELL;
            const gi        = GATE_ORDER.indexOf(cell);
            const gateClrd  = gi >= 0 && state.gateCleared[gi];
            const gatePend  = isGate && !visited;

            let bg    = C.card;
            let bdr   = C.border;
            let bdrW  = 1;
            if (isCurrent)            { bg = C.lavender;          bdr = C.lavender; bdrW = 2; }
            else if (visited)         { bg = C.lavender + '35'; }
            else if (isNextHint)      { bg = C.lavender + '18';   bdrW = 1; }
            if (!visited && isGate)   { bdr = C.gold;              bdrW = 2; }
            if (!visited && isEnd)    { bdr = C.rose;              bdrW = 2; }
            if (!visited && isAnchor) { bdr = C.sage;              bdrW = 2; }

            return (
              <Pressable
                key={cell}
                onPress={() => handleCellTap(cell)}
                style={({ pressed }) => [
                  styles.cell,
                  { backgroundColor: bg, borderColor: bdr, borderWidth: bdrW, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {isAnchor && !visited ? (
                  <Text style={[styles.anchorLabel, { color: C.sage }]}>{ANCHORS[cell]}</Text>
                ) : isEnd && !visited ? (
                  <Ionicons name="flag" size={16} color={C.rose} />
                ) : isGate && !visited ? (
                  gatePend ? <PulseDot color={C.gold} /> : <Ionicons name="diamond" size={14} color={C.gold} />
                ) : visited ? (
                  <Ionicons name="checkmark" size={13} color={isCurrent ? C.bg : C.lavender} />
                ) : (
                  <Text style={[styles.cellNum, { color: C.textMuted }]}>{cell}</Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {/* Undo / Reset */}
      <View style={[styles.actions, { paddingBottom: botInset + 16 }]}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { borderColor: C.border, opacity: state.path.length <= 1 ? 0.4 : pressed ? 0.7 : 1 }]}
          onPress={handleUndo}
          disabled={state.path.length <= 1}
        >
          <Ionicons name="arrow-undo" size={16} color={C.text} />
          <Text style={[styles.actionLabel, { color: C.text }]}>Undo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={16} color={C.text} />
          <Text style={[styles.actionLabel, { color: C.text }]}>Reset</Text>
        </Pressable>
      </View>

      {/* Gate bottom sheet */}
      <Modal visible={state.gateCell !== null} transparent animationType="none" statusBarTranslucent>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: C.bg, borderColor: C.border, paddingBottom: botInset + 24 },
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.gateBadge}>
              <Ionicons name="diamond" size={15} color={C.gold} />
              <Text style={[styles.gateBadgeText, { color: C.gold }]}>
                Gate {gateQIdx + 1} of 4
              </Text>
            </View>

            {question && (
              <>
                <Text style={[styles.questionText, { color: C.text }]}>{question.q}</Text>

                <View style={styles.opts}>
                  {(question.opts as string[]).map((opt, i) => {
                    const answered  = state.selectedOpt !== null;
                    const isChosen  = state.selectedOpt === i;
                    const isCorrectOpt = question.correct === i;
                    let bdrColor = C.border;
                    let bgColor  = C.card;
                    let txtColor = C.text;
                    if (answered) {
                      if (isCorrectOpt)                  { bdrColor = C.sage; bgColor = C.sage + '20'; txtColor = C.sage; }
                      else if (isChosen && !isCorrectOpt){ bdrColor = C.rose; bgColor = C.rose + '20'; txtColor = C.rose; }
                    }
                    return (
                      <Pressable
                        key={i}
                        style={({ pressed }) => [
                          styles.opt,
                          { borderColor: bdrColor, backgroundColor: bgColor, opacity: pressed && !answered ? 0.8 : 1 },
                        ]}
                        onPress={() => handleAnswer(i)}
                        disabled={answered}
                      >
                        <Text style={[styles.optText, { color: txtColor }]}>{opt}</Text>
                        {answered && isCorrectOpt && <Ionicons name="checkmark-circle" size={16} color={C.sage} />}
                        {answered && isChosen && !isCorrectOpt && <Ionicons name="close-circle" size={16} color={C.rose} />}
                      </Pressable>
                    );
                  })}
                </View>

                {state.showExplain && (
                  <View style={[styles.explainBox, { backgroundColor: C.card, borderColor: C.border }]}>
                    <Text style={[styles.explainLabel, { color: isCorrect ? C.sage : C.rose }]}>
                      {isCorrect ? question.right : question.wrong}
                    </Text>
                    <Text style={[styles.explainBody, { color: C.textSub }]}>{question.explain}</Text>
                  </View>
                )}

                {state.showExplain && (
                  <Pressable
                    style={({ pressed }) => [styles.continueBtn, { backgroundColor: C.lavender, opacity: pressed ? 0.88 : 1 }]}
                    onPress={handleContinueGate}
                  >
                    <Text style={[styles.continueBtnText, { color: C.bg }]}>Continue threading →</Text>
                  </Pressable>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phaseNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 10 },
  statText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  hint: { textAlign: 'center', fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  gridWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    gap: CELL_GAP,
  },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cellNum: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  anchorLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 10,
  },
  actionLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    padding: 24, gap: 16,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#555', alignSelf: 'center', marginBottom: 4 },
  gateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  gateBadgeText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  questionText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', lineHeight: 24 },
  opts: { gap: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1.5, padding: 12 },
  optText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },
  explainBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  explainLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  explainBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  continueBtn: { borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, alignItems: 'center' },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
