import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated, Modal, PanResponder,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

// ─── Canonical Hamiltonian path through 5×5 grid ─────────────────────────────
// Path: 0→1→2→3→4→9→8→7→6→5→10→11→12→13→14→19→24→23→22→21→20→15→16→17→18
// Anchors: 4=1, 10=2, 20=3
// Gates (path order): 2, 7, 22, 16
// End: 18

const CANONICAL_PATH = [0,1,2,3,4,9,8,7,6,5,10,11,12,13,14,19,24,23,22,21,20,15,16,17,18];
const ANCHORS:  Record<number, string> = { 4: '1', 10: '2', 20: '3' };
const GATE_ORDER = [2, 7, 22, 16];
const GATE_SET   = new Set(GATE_ORDER);
const END_CELL   = 18;
const TOTAL      = 25;

const CELL_SIZE = 54;
const CELL_GAP  = 4;
const GRID_COLS = 5;

// ─── State / reducer ──────────────────────────────────────────────────────────
interface State {
  path:          number[];
  done:          boolean;
  gateCell:      number | null;
  gateAnswered:  boolean[];
  gateCorrect:   boolean[];
  selectedOpt:   number | null;
  showExplain:   boolean;
}

const INIT: State = {
  path:         [0],
  done:         false,
  gateCell:     null,
  gateAnswered: [false, false, false, false],
  gateCorrect:  [false, false, false, false],
  selectedOpt:  null,
  showExplain:  false,
};

type Action =
  | { type: 'ADVANCE';   cell: number }
  | { type: 'OPEN_GATE'; cell: number }
  | { type: 'ANSWER';    idx: number; correct: boolean }
  | { type: 'CLOSE_GATE' }
  | { type: 'UNDO' }
  | { type: 'RESET' };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'ADVANCE': {
      const next = CANONICAL_PATH[s.path.length];
      if (a.cell !== next) return s;
      const newPath = [...s.path, a.cell];
      const done = newPath.length === TOTAL && a.cell === END_CELL;
      return { ...s, path: newPath, done };
    }
    case 'OPEN_GATE':
      return { ...s, gateCell: a.cell, selectedOpt: null, showExplain: false };
    case 'ANSWER': {
      const gi = GATE_ORDER.indexOf(s.gateCell ?? -1);
      const newAnswered = [...s.gateAnswered];
      const newCorrect  = [...s.gateCorrect];
      if (gi >= 0) { newAnswered[gi] = true; newCorrect[gi] = a.correct; }
      return { ...s, selectedOpt: a.idx, showExplain: true, gateAnswered: newAnswered, gateCorrect: newCorrect };
    }
    case 'CLOSE_GATE': {
      const done = s.path.length === TOTAL && s.path[TOTAL - 1] === END_CELL;
      return { ...s, gateCell: null, selectedOpt: null, showExplain: false, done };
    }
    case 'UNDO': {
      if (s.path.length <= 1) return s;
      const last = s.path[s.path.length - 1];
      const gi   = GATE_ORDER.indexOf(last);
      if (gi >= 0 && s.gateAnswered[gi]) return s;
      return { ...s, path: s.path.slice(0, -1) };
    }
    case 'RESET':  return { ...INIT };
    default: return s;
  }
}

// ─── Pulsing diamond for gate cells ──────────────────────────────────────────
function PulseDiamond({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.35, duration: 650, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,    duration: 650, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 650, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5,  duration: 650, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Ionicons name="diamond" size={16} color={color} />
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ThreadScreen() {
  const C        = useColors();
  const insets   = useSafeAreaInsets();
  const { topic, setThreadResult } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [state, dispatch] = React.useReducer(reducer, INIT);
  const stateRef = useRef(state);
  stateRef.current = state;

  const slideAnim = useRef(new Animated.Value(500)).current;
  const gateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCell = useRef<number | null>(null);

  // Grid position for hit-testing
  const gridRef   = useRef<View>(null);
  const gridPageX = useRef(0);
  const gridPageY = useRef(0);

  function measureGrid() {
    gridRef.current?.measure((_x, _y, _w, _h, px, py) => {
      gridPageX.current = px;
      gridPageY.current = py;
    });
  }

  function getCellFromTouch(pageX: number, pageY: number): number | null {
    const relX = pageX - gridPageX.current;
    const relY = pageY - gridPageY.current;
    if (relX < 0 || relY < 0) return null;
    const col = Math.floor(relX / (CELL_SIZE + CELL_GAP));
    const row = Math.floor(relY / (CELL_SIZE + CELL_GAP));
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_COLS) return null;
    return row * GRID_COLS + col;
  }

  function isAdjacent(a: number, b: number): boolean {
    const rowA = Math.floor(a / GRID_COLS), colA = a % GRID_COLS;
    const rowB = Math.floor(b / GRID_COLS), colB = b % GRID_COLS;
    return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
  }

  function tryAdvance(cell: number) {
    const s = stateRef.current;
    if (s.done || s.gateCell !== null) return;

    // Block if last cell is an unanswered gate
    const lastInPath = s.path[s.path.length - 1];
    const lastGateIdx = GATE_ORDER.indexOf(lastInPath);
    if (lastGateIdx >= 0 && !s.gateAnswered[lastGateIdx]) return;

    // Buzz for adjacent invalid moves (already visited or wrong next cell)
    if (isAdjacent(lastInPath, cell)) {
      if (s.path.includes(cell) || cell !== CANONICAL_PATH[s.path.length]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
    } else {
      if (s.path.includes(cell)) return;
      const next = CANONICAL_PATH[s.path.length];
      if (cell !== next) return;
    }

    Haptics.selectionAsync();
    dispatch({ type: 'ADVANCE', cell });

    if (GATE_SET.has(cell)) {
      gateTimer.current = setTimeout(() => dispatch({ type: 'OPEN_GATE', cell }), 300);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (stateRef.current.done || stateRef.current.gateCell !== null) return;
        measureGrid();
        lastDragCell.current = null;
        const cell = getCellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (cell !== null) {
          lastDragCell.current = cell;
          tryAdvance(cell);
        }
      },
      onPanResponderMove: (evt) => {
        if (stateRef.current.done || stateRef.current.gateCell !== null) return;
        const cell = getCellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (cell !== null && cell !== lastDragCell.current) {
          lastDragCell.current = cell;
          tryAdvance(cell);
        }
      },
      onPanResponderRelease: () => { lastDragCell.current = null; },
      onPanResponderTerminate: () => { lastDragCell.current = null; },
    })
  ).current;

  // Slide gate sheet
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
    const correct = state.gateCorrect.filter(Boolean).length;
    const gatesAnsweredNums = state.gateCorrect.map(b => (b ? 1 : 0));
    doneTimer.current = setTimeout(() => {
      setThreadResult(correct, 4, gatesAnsweredNums, state.path);
      router.push('/deep-dive/results');
    }, 800);
    return () => { if (doneTimer.current) clearTimeout(doneTimer.current); };
  }, [state.done]);

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
    if (gateTimer.current) clearTimeout(gateTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);
    dispatch({ type: 'RESET' });
  }

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const pathSet  = new Set(state.path);
  const nextCell = CANONICAL_PATH[state.path.length];
  const progress = state.path.length / TOTAL;

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
          <Text style={[styles.phaseLabel, { color: C.textMuted }]}>Thread</Text>
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
          Gates: <Text style={{ color: C.text, fontFamily: 'Inter_700Bold' }}>{state.gateCorrect.filter(Boolean).length}/4</Text>
        </Text>
      </View>

      {/* Instruction */}
      <Text style={[styles.hint, { color: C.textMuted }]}>
        {state.done ? 'Path complete!' : 'Drag through every cell to complete the thread'}
      </Text>

      {/* Grid */}
      <View style={styles.gridWrap}>
        <View
          ref={gridRef}
          style={styles.grid}
          {...panResponder.panHandlers}
          onLayout={measureGrid}
        >
          {Array.from({ length: TOTAL }, (_, cell) => {
            const visited    = pathSet.has(cell);
            const isCurrent  = cell === state.path[state.path.length - 1];
            const isNextHint = !state.done && cell === nextCell;
            const isAnchor   = cell in ANCHORS;
            const isGate     = GATE_SET.has(cell);
            const isEnd      = cell === END_CELL;
            const gatePend   = isGate && !visited;

            let bg   = C.card;
            let bdr  = C.border;
            let bdrW = 1;
            if (isCurrent)             { bg = C.lavender;        bdr = C.lavender; bdrW = 2; }
            else if (visited)          { bg = C.lavender + '35'; }
            else if (isNextHint)       { bg = C.lavender + '14'; }
            if (!visited && isGate)    { bdr = C.gold;            bdrW = 2; }
            if (!visited && isEnd)     { bdr = C.rose;            bdrW = 2; }
            if (!visited && isAnchor)  { bdr = C.sage;            bdrW = 2; }

            return (
              <View
                key={cell}
                style={[styles.cell, { backgroundColor: bg, borderColor: bdr, borderWidth: bdrW }]}
                pointerEvents="none"
              >
                {isAnchor && !visited ? (
                  <Text style={[styles.anchorLabel, { color: C.sage }]}>{ANCHORS[cell]}</Text>
                ) : isEnd && !visited ? (
                  <Ionicons name="flag" size={16} color={C.rose} />
                ) : isGate && !visited ? (
                  gatePend ? <PulseDiamond color={C.gold} /> : <Ionicons name="diamond" size={14} color={C.gold} />
                ) : visited ? (
                  <Ionicons name="checkmark" size={13} color={isCurrent ? C.bg : C.lavender} />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: C.sage, borderWidth: 2 }]} />
          <Text style={[styles.legendText, { color: C.textMuted }]}>Waypoint</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="diamond" size={12} color={C.gold} />
          <Text style={[styles.legendText, { color: C.textMuted }]}>Gate</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="flag" size={12} color={C.rose} />
          <Text style={[styles.legendText, { color: C.textMuted }]}>Finish</Text>
        </View>
      </View>

      {/* Undo / Reset */}
      <View style={[styles.actions, { paddingBottom: botInset + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: C.border, opacity: state.path.length <= 1 ? 0.4 : pressed ? 0.7 : 1 },
          ]}
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
                    const answered     = state.selectedOpt !== null;
                    const isChosen     = state.selectedOpt === i;
                    const isCorrectOpt = question.correct === i;
                    let bdrColor = C.border;
                    let bgColor  = C.card;
                    let txtColor = C.text;
                    if (answered) {
                      if (isCorrectOpt)                   { bdrColor = C.sage; bgColor = C.sage + '20'; txtColor = C.sage; }
                      else if (isChosen && !isCorrectOpt) { bdrColor = C.rose; bgColor = C.rose + '20'; txtColor = C.rose; }
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
                    <Text style={[styles.continueBtnText, { color: C.bg }]}>Continue tracing</Text>
                    <Ionicons name="arrow-forward" size={15} color={C.bg} />
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
  gridWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    gap: CELL_GAP,
  },
  cell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  anchorLabel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 8 },
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
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
  },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
