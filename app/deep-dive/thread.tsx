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
import { sanitizeDashes } from '@/utils/sanitize';

// ─── Grid constants ────────────────────────────────────────────────────────────
// Hamiltonian path through a 5×5 grid
// Start:0  Waypoints:4→1,10→2,20→3  Gates:2,7,22,16  End:18
const CANONICAL_PATH = [0,1,2,3,4,9,8,7,6,5,10,11,12,13,14,19,24,23,22,21,20,15,16,17,18];
const ANCHORS: Record<number, string> = { 4: '1', 10: '2', 20: '3' };
const GATE_ORDER = [2, 7, 22, 16];
const GATE_SET   = new Set(GATE_ORDER);
const END_CELL   = 18;
const START_CELL = CANONICAL_PATH[0]; // 0
const TOTAL      = 25;

const CELL_SIZE = 60;
const CELL_GAP  = 8;
const GRID_COLS = 5;
const GRID_W    = GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP; // 332
const GRID_H    = GRID_W; // square

const LINE_W    = 10; // path ribbon thickness
const OPT_KEYS  = ['A', 'B', 'C', 'D'];

// ─── State / reducer ──────────────────────────────────────────────────────────
interface State {
  path:         number[];
  done:         boolean;
  gateCell:     number | null;
  gateAnswered: boolean[];
  gateCorrect:  boolean[];
  selectedOpt:  number | null;
  showExplain:  boolean;
}

const INIT: State = {
  path:         [],
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
      if (s.path.includes(a.cell)) return s;
      const newPath = [...s.path, a.cell];
      const done = newPath.length === TOTAL && a.cell === END_CELL;
      return { ...s, path: newPath, done };
    }
    case 'OPEN_GATE':
      return { ...s, gateCell: a.cell, selectedOpt: null, showExplain: false };
    case 'ANSWER': {
      const gi = GATE_ORDER.indexOf(s.gateCell ?? -1);
      const ans = [...s.gateAnswered];
      const cor = [...s.gateCorrect];
      if (gi >= 0) { ans[gi] = true; cor[gi] = a.correct; }
      return { ...s, selectedOpt: a.idx, showExplain: true, gateAnswered: ans, gateCorrect: cor };
    }
    case 'CLOSE_GATE': {
      const done = s.path.length === TOTAL && s.path[TOTAL - 1] === END_CELL;
      return { ...s, gateCell: null, selectedOpt: null, showExplain: false, done };
    }
    case 'UNDO': {
      if (s.path.length === 0) return s;
      return { ...s, path: s.path.slice(0, -1) };
    }
    case 'RESET': return { ...INIT };
    default: return s;
  }
}

// ─── Pulsing gate icon ────────────────────────────────────────────────────────
function PulseGem({ color }: { color: string }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const nd = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.25, duration: 750, useNativeDriver: nd }),
          Animated.timing(opacity, { toValue: 0.5,  duration: 750, useNativeDriver: nd }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 750, useNativeDriver: nd }),
          Animated.timing(opacity, { toValue: 0.9,  duration: 750, useNativeDriver: nd }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Ionicons name="diamond" size={20} color={color} />
    </Animated.View>
  );
}

// ─── Path ribbon overlay ─────────────────────────────────────────────────────
function cellCenterXY(cell: number) {
  const col = cell % GRID_COLS;
  const row = Math.floor(cell / GRID_COLS);
  return {
    x: col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
    y: row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
  };
}

function PathRibbon({ path, color }: { path: number[]; color: string }) {
  if (path.length < 2) return null;
  return (
    <>
      {path.slice(1).map((cell, i) => {
        const prev = path[i];
        const { x: x1, y: y1 } = cellCenterXY(prev);
        const { x: x2, y: y2 } = cellCenterXY(cell);
        const isH = y1 === y2;
        return (
          <View
            key={`r${i}`}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              backgroundColor: color,
              borderRadius: LINE_W / 2,
              ...(isH ? {
                left: Math.min(x1, x2),
                top: y1 - LINE_W / 2,
                width: Math.abs(x2 - x1),
                height: LINE_W,
              } : {
                left: x1 - LINE_W / 2,
                top: Math.min(y1, y2),
                width: LINE_W,
                height: Math.abs(y2 - y1),
              }),
            }}
          />
        );
      })}
    </>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ThreadScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, setThreadResult } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [state, dispatch] = React.useReducer(reducer, INIT);
  const stateRef = useRef(state);
  stateRef.current = state;

  const sheetAnim     = useRef(new Animated.Value(600)).current;
  const gateTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDragCell  = useRef<number | null>(null);
  const pendingGate   = useRef<number | null>(null);

  const gridRef   = useRef<View>(null);
  const gridPageX = useRef(0);
  const gridPageY = useRef(0);

  function measureGrid() {
    gridRef.current?.measure((_x, _y, _w, _h, px, py) => {
      gridPageX.current = px;
      gridPageY.current = py;
    });
  }

  function getCellFromTouch(px: number, py: number): number | null {
    const rx = px - gridPageX.current;
    const ry = py - gridPageY.current;
    if (rx < 0 || ry < 0) return null;
    const col = Math.floor(rx / (CELL_SIZE + CELL_GAP));
    const row = Math.floor(ry / (CELL_SIZE + CELL_GAP));
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_COLS) return null;
    return row * GRID_COLS + col;
  }

  function adjacent(a: number, b: number) {
    const rA = Math.floor(a / GRID_COLS), cA = a % GRID_COLS;
    const rB = Math.floor(b / GRID_COLS), cB = b % GRID_COLS;
    return Math.abs(rA - rB) + Math.abs(cA - cB) === 1;
  }

  function tryAdvance(cell: number) {
    const s = stateRef.current;
    if (s.done || s.gateCell !== null || pendingGate.current !== null) return;

    // Block if last cell is an unanswered gate
    if (s.path.length > 0) {
      const last = s.path[s.path.length - 1];
      const gi   = GATE_ORDER.indexOf(last);
      if (gi >= 0 && !s.gateAnswered[gi]) return;
    }

    // First touch must land on start cell
    if (s.path.length === 0) {
      if (cell === START_CELL) {
        Haptics.selectionAsync();
        dispatch({ type: 'ADVANCE', cell });
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return;
    }

    // Revisit
    if (s.path.includes(cell)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    // Must be adjacent to tip of path
    const tip = s.path[s.path.length - 1];
    if (!adjacent(tip, cell)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    // Gate ordering: gate N requires gate N-1 answered
    const cellGate = GATE_ORDER.indexOf(cell);
    if (cellGate > 0 && !s.gateAnswered[cellGate - 1]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    Haptics.selectionAsync();
    dispatch({ type: 'ADVANCE', cell });

    if (GATE_SET.has(cell)) {
      pendingGate.current = cell;
      gateTimer.current = setTimeout(() => {
        pendingGate.current = null;
        dispatch({ type: 'OPEN_GATE', cell });
      }, 300);
    }
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (stateRef.current.done || stateRef.current.gateCell !== null) return;
        measureGrid();
        lastDragCell.current = null;
        const cell = getCellFromTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell !== null) { lastDragCell.current = cell; tryAdvance(cell); }
      },
      onPanResponderMove: (e) => {
        if (stateRef.current.done || stateRef.current.gateCell !== null) return;
        const cell = getCellFromTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell !== null && cell !== lastDragCell.current) {
          lastDragCell.current = cell;
          tryAdvance(cell);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Gate sheet slide-in
  const nd = Platform.OS !== 'web';
  useEffect(() => {
    if (state.gateCell !== null) {
      Animated.spring(sheetAnim, {
        toValue: 0, useNativeDriver: nd, tension: 90, friction: 12,
      }).start();
    } else {
      sheetAnim.setValue(600);
    }
  }, [state.gateCell]);

  // Navigate to results on completion
  useEffect(() => {
    if (!state.done) return;
    const score = state.gateCorrect.filter(Boolean).length;
    setThreadResult(
      score, 4,
      state.gateAnswered.map((_, i) => i).filter(i => state.gateAnswered[i]),
      state.path,
    );
    doneTimer.current = setTimeout(() => router.replace('/deep-dive/results'), 900);
    return () => { if (doneTimer.current) clearTimeout(doneTimer.current); };
  }, [state.done]);

  function handleAnswer(idx: number) {
    if (state.selectedOpt !== null || !topic) return;
    const gi = GATE_ORDER.indexOf(state.gateCell ?? -1);
    const correct = gi >= 0 && topic.questions?.[gi]?.correct === idx;
    Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
    dispatch({ type: 'ANSWER', idx, correct });
  }

  function handleContinue() {
    if (gateTimer.current) clearTimeout(gateTimer.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    pendingGate.current = null;
    dispatch({ type: 'RESET' });
  }

  if (!topic) {
    return (
      <View style={[S.root, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const pathSet     = new Set(state.path);
  const tip         = state.path.length > 0 ? state.path[state.path.length - 1] : null;
  const canonNext   = CANONICAL_PATH[state.path.length];
  const hintCell    = (tip === null || (
    !state.path.includes(canonNext) &&
    adjacent(tip, canonNext)
  )) ? canonNext : -1;

  const progress   = state.path.length / TOTAL;
  const gateIdx    = state.gateCell !== null ? GATE_ORDER.indexOf(state.gateCell) : -1;
  const question   = gateIdx >= 0 ? topic.questions?.[gateIdx] : null;
  const wasCorrect = state.selectedOpt !== null && question?.correct === state.selectedOpt;

  // Design tokens
  const PURPLE  = C.lavender;
  const GOLD    = C.gold;
  const GREEN   = C.sage;
  const PINK    = C.rose;

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topInset + 10 }]}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={S.headerMid}>
          <View style={[S.phaseChip, { backgroundColor: PURPLE + '18' }]}>
            <Text style={[S.phaseChipText, { color: PURPLE }]}>Thread  ·  Phase 3</Text>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Thin progress bar */}
      <View style={[S.progTrack, { backgroundColor: C.border }]}>
        <View style={[S.progFill, { width: `${Math.round(progress * 100)}%` as `${number}%`, backgroundColor: PURPLE }]} />
      </View>

      {/* Gate score dots + cell count */}
      <View style={[S.subRow, { paddingTop: 10 }]}>
        <Text style={[S.cellCount, { color: C.textMuted }]}>
          <Text style={{ color: C.text, fontFamily: 'Inter_700Bold' }}>{state.path.length}</Text>
          {' '}/ {TOTAL}
        </Text>
        <View style={S.gateRow}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                S.gateDot,
                {
                  backgroundColor: state.gateAnswered[i]
                    ? (state.gateCorrect[i] ? GREEN : PINK)
                    : C.border,
                },
              ]}
            />
          ))}
          <Text style={[S.gateLabel, { color: C.textMuted }]}>gates</Text>
        </View>
      </View>

      {/* Instruction / status */}
      <Text style={[S.hint, { color: C.textMuted }]}>
        {state.path.length === 0
          ? 'Start on the highlighted cell — drag to fill every square'
          : state.done
            ? '✓  Path complete'
            : 'Keep dragging — visit every cell'}
      </Text>

      {/* Grid */}
      <View style={S.gridWrap}>
        <View
          ref={gridRef}
          style={[S.grid, { width: GRID_W, height: GRID_H }]}
          {...pan.panHandlers}
          onLayout={measureGrid}
        >
          {/* Ribbon lines drawn first (behind cells) */}
          <PathRibbon path={state.path} color={PURPLE + 'AA'} />

          {/* Cells */}
          {Array.from({ length: TOTAL }, (_, cell) => {
            const visited  = pathSet.has(cell);
            const isTip    = cell === tip;
            const isHint   = !state.done && cell === hintCell && state.path.length === 0;
            const isGate   = GATE_SET.has(cell);
            const isAnchor = cell in ANCHORS;
            const isEnd    = cell === END_CELL;
            const isStart  = cell === START_CELL;

            let bg: string, bdr: string, bdrW: number;
            if (isTip)         { bg = PURPLE;           bdr = 'transparent'; bdrW = 0; }
            else if (visited)  { bg = PURPLE + '55';    bdr = 'transparent'; bdrW = 0; }
            else if (isGate)   { bg = GOLD + '18';      bdr = GOLD;          bdrW = 1.5; }
            else if (isEnd)    { bg = PINK + '18';      bdr = PINK;          bdrW = 1.5; }
            else if (isAnchor) { bg = GREEN + '18';     bdr = GREEN;         bdrW = 1.5; }
            else if (isStart)  { bg = PURPLE + '22';    bdr = PURPLE;        bdrW = 1.5; }
            else if (isHint)   { bg = PURPLE + '14';    bdr = PURPLE + '50'; bdrW = 1; }
            else               { bg = C.card;           bdr = C.border;      bdrW = 1; }

            return (
              <View
                key={cell}
                style={[
                  S.cell,
                  { backgroundColor: bg, borderColor: bdr, borderWidth: bdrW, pointerEvents: 'none' },
                  isTip && S.cellTip,
                ]}
              >
                {/* Unvisited special cells only show icons */}
                {!visited && isGate   && <PulseGem color={GOLD} />}
                {!visited && isEnd    && <Ionicons name="star" size={20} color={PINK} />}
                {!visited && isAnchor && (
                  <View style={[S.anchorBubble, { backgroundColor: GREEN }]}>
                    <Text style={S.anchorNum}>{ANCHORS[cell]}</Text>
                  </View>
                )}
                {!visited && isStart && !isAnchor && (
                  <View style={[S.startDot, { backgroundColor: PURPLE }]} />
                )}
                {/* Tip cell: small white dot for visual clarity */}
                {isTip && <View style={S.tipDot} />}
              </View>
            );
          })}
        </View>
      </View>

      {/* Legend row */}
      <View style={S.legend}>
        <LegendItem icon="●" color={GREEN} label="Waypoint" />
        <LegendItem icon="◆" color={GOLD}  label="Gate" />
        <LegendItem icon="★" color={PINK}  label="Finish" />
      </View>

      {/* Undo / Reset */}
      <View style={[S.actions, { paddingBottom: botInset + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            S.actionBtn,
            { borderColor: C.border, backgroundColor: C.card, opacity: state.path.length === 0 ? 0.3 : pressed ? 0.65 : 1 },
          ]}
          onPress={handleUndo}
          disabled={state.path.length === 0}
        >
          <Ionicons name="arrow-undo-outline" size={19} color={C.text} />
          <Text style={[S.actionLabel, { color: C.textSub }]}>Undo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            S.actionBtn,
            { borderColor: C.border, backgroundColor: C.card, opacity: pressed ? 0.65 : 1 },
          ]}
          onPress={handleReset}
        >
          <Ionicons name="refresh-outline" size={19} color={C.text} />
          <Text style={[S.actionLabel, { color: C.textSub }]}>Reset</Text>
        </Pressable>
      </View>

      {/* Gate question sheet */}
      <Modal visible={state.gateCell !== null} transparent animationType="none" statusBarTranslucent>
        <View style={S.overlay}>
          <Animated.View
            style={[
              S.sheet,
              { backgroundColor: C.bg, borderTopColor: C.border, paddingBottom: botInset + 28 },
              { transform: [{ translateY: sheetAnim }] },
            ]}
          >
            <View style={[S.sheetHandle, { backgroundColor: C.border }]} />

            <View style={[S.gateBadge, { backgroundColor: GOLD + '20' }]}>
              <Ionicons name="diamond" size={13} color={GOLD} />
              <Text style={[S.gateBadgeTxt, { color: GOLD }]}>
                Gate {gateIdx + 1} of 4  ·  Knowledge check
              </Text>
            </View>

            {question && (
              <>
                <Text style={[S.qText, { color: C.text }]}>
                  {sanitizeDashes(question.q)}
                </Text>

                <View style={S.opts}>
                  {(question.opts as string[]).map((opt, i) => {
                    const answered  = state.selectedOpt !== null;
                    const chosen    = state.selectedOpt === i;
                    const correct   = question.correct === i;

                    let letterBg  = C.card;
                    let letterCol = C.textSub;
                    let rowBdr    = C.border;
                    let rowBg     = C.card;
                    let txtCol    = C.text;

                    if (answered) {
                      if (correct) {
                        letterBg = GREEN;  letterCol = '#fff';
                        rowBdr = GREEN;    rowBg = GREEN + '14';  txtCol = GREEN;
                      } else if (chosen) {
                        letterBg = PINK;  letterCol = '#fff';
                        rowBdr = PINK;    rowBg = PINK + '14';   txtCol = PINK;
                      }
                    }

                    return (
                      <Pressable
                        key={i}
                        style={({ pressed }) => [
                          S.opt,
                          { borderColor: rowBdr, backgroundColor: rowBg, opacity: pressed && !answered ? 0.8 : 1 },
                        ]}
                        onPress={() => handleAnswer(i)}
                        disabled={answered}
                      >
                        <View style={[S.optKey, { backgroundColor: letterBg }]}>
                          <Text style={[S.optKeyTxt, { color: letterCol }]}>{OPT_KEYS[i]}</Text>
                        </View>
                        <Text style={[S.optTxt, { color: txtCol }]}>{sanitizeDashes(opt)}</Text>
                        {answered && correct && <Ionicons name="checkmark-circle" size={18} color={GREEN} />}
                        {answered && chosen && !correct && <Ionicons name="close-circle" size={18} color={PINK} />}
                      </Pressable>
                    );
                  })}
                </View>

                {state.showExplain && (
                  <View style={[S.explainBox, {
                    backgroundColor: (wasCorrect ? GREEN : PINK) + '12',
                    borderColor:     (wasCorrect ? GREEN : PINK) + '40',
                  }]}>
                    <Text style={[S.explainTitle, { color: wasCorrect ? GREEN : PINK }]}>
                      {sanitizeDashes(wasCorrect ? question.right : question.wrong)}
                    </Text>
                    <Text style={[S.explainBody, { color: C.textSub }]}>
                      {sanitizeDashes(question.explain)}
                    </Text>
                  </View>
                )}

                {state.showExplain && (
                  <Pressable
                    style={({ pressed }) => [S.contBtn, { backgroundColor: PURPLE, opacity: pressed ? 0.85 : 1 }]}
                    onPress={handleContinue}
                  >
                    <Text style={S.contBtnTxt}>Continue tracing</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
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

function LegendItem({ icon, color, label }: { icon: string; color: string; label: string }) {
  return (
    <View style={S.legendItem}>
      <Text style={{ color, fontSize: 11 }}>{icon}</Text>
      <Text style={[S.legendTxt]}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  root:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:   { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerMid: { flex: 1, alignItems: 'center' },
  phaseChip: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  phaseChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  progTrack: { height: 2 },
  progFill:  { height: 2 },
  subRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingBottom: 2,
  },
  cellCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  gateRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gateDot:   { width: 8, height: 8, borderRadius: 4 },
  gateLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginLeft: 2 },
  hint: {
    textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular',
    paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8,
  },
  gridWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP,
    alignContent: 'flex-start',
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cellTip:   { transform: [{ scale: 1.07 }] },
  anchorBubble: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  anchorNum:  { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  startDot:   { width: 14, height: 14, borderRadius: 7 },
  tipDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 22,
    paddingBottom: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendTxt:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#888' },
  actions: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 40,
    paddingTop: 8, justifyContent: 'center',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 14, borderWidth: 1, paddingVertical: 11,
  },
  actionLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    borderTopWidth: 1,
    paddingHorizontal: 24, paddingTop: 12, gap: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 8,
  },
  gateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  gateBadgeTxt: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  qText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', lineHeight: 26 },
  opts:  { gap: 9 },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    borderRadius: 14, borderWidth: 1.5, padding: 12,
  },
  optKey: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  optKeyTxt:  { fontSize: 13, fontFamily: 'Inter_700Bold' },
  optTxt:     { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },
  explainBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  explainTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  explainBody:  { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  contBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
  },
  contBtnTxt: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
