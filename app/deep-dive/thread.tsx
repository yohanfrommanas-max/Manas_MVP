import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, ScrollView, Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

const SCREEN_W = Dimensions.get('window').width;
const GRID_SIZE = 5;
const TOTAL = GRID_SIZE * GRID_SIZE;
const GRID_GAP = 6;
const CELL_SIZE = Math.floor((SCREEN_W - 40 - GRID_GAP * (GRID_SIZE - 1)) / GRID_SIZE);

const ANCHOR_CELLS = [4, 10, 20];
const GATE_CELLS = [2, 7, 16, 22];
const START_CELL = 0;
const LAST_CELL = 18;

const GATE_QUESTION_MAP: Record<number, number> = {
  2: 0, 7: 1, 16: 2, 22: 3,
};

function cellToPos(idx: number) {
  return { row: Math.floor(idx / GRID_SIZE), col: idx % GRID_SIZE };
}

function isAdjacent(a: number, b: number) {
  const pa = cellToPos(a);
  const pb = cellToPos(b);
  return (
    (Math.abs(pa.row - pb.row) === 1 && pa.col === pb.col) ||
    (Math.abs(pa.col - pb.col) === 1 && pa.row === pb.row)
  );
}

type CellState =
  | 'start'
  | 'end'
  | 'anchor-unvisited'
  | 'anchor-visited'
  | 'gate-unvisited'
  | 'gate-visited'
  | 'current'
  | 'path'
  | 'idle';

export default function ThreadScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, setThreadResult } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [path, setPath] = useState<number[]>([START_CELL]);
  const [visitedAnchors, setVisitedAnchors] = useState<Set<number>>(new Set());
  const [visitedGates, setVisitedGates] = useState<Set<number>>(new Set());
  const [gateScore, setGateScore] = useState(0);
  const [errorCell, setErrorCell] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [completed, setCompleted] = useState(false);

  const [pendingGateCell, setPendingGateCell] = useState<number | null>(null);
  const [gateModal, setGateModal] = useState<{ cellIdx: number; qIdx: number } | null>(null);
  const [gateSelected, setGateSelected] = useState<number | null>(null);
  const [gateAnswered, setGateAnswered] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const questions = topic.questions;
  const current = path[path.length - 1];
  const nextAnchor = ANCHOR_CELLS.find(a => !visitedAnchors.has(a));

  function getCellState(idx: number): CellState {
    if (idx === START_CELL) return path.includes(idx) && idx !== current ? 'path' : idx === current ? 'current' : 'start';
    if (idx === LAST_CELL) return 'end';
    if (ANCHOR_CELLS.includes(idx)) {
      return visitedAnchors.has(idx) ? 'anchor-visited' : 'anchor-unvisited';
    }
    if (GATE_CELLS.includes(idx)) {
      return visitedGates.has(idx) ? 'gate-visited' : 'gate-unvisited';
    }
    if (idx === current) return 'current';
    if (path.includes(idx)) return 'path';
    return 'idle';
  }

  function shake() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function showError(msg: string, idx: number) {
    setErrorCell(idx);
    setErrorMsg(msg);
    shake();
    setTimeout(() => { setErrorCell(null); setErrorMsg(''); }, 1200);
  }

  function complete(finalPath: number[], finalGateScore: number, finalVisitedGates: Set<number>) {
    setCompleted(true);
    setThreadResult(finalGateScore, GATE_CELLS.length, [...finalVisitedGates], finalPath);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => router.push('/deep-dive/results'), 800);
  }

  function handleCellTap(idx: number) {
    if (completed || gateModal || pendingGateCell !== null) return;

    if (path.includes(idx)) {
      showError('Already visited this cell', idx);
      return;
    }
    if (!isAdjacent(current, idx)) {
      showError('Must tap an adjacent cell', idx);
      return;
    }
    if (ANCHOR_CELLS.includes(idx) && nextAnchor !== idx) {
      const needed = nextAnchor ? ANCHOR_CELLS.indexOf(nextAnchor) + 1 : '?';
      showError(`Visit waypoint ${needed} first`, idx);
      return;
    }
    if (idx === LAST_CELL && path.length < TOTAL - 1) {
      showError('Fill all cells first — this is the final cell', idx);
      return;
    }

    if (GATE_CELLS.includes(idx) && !visitedGates.has(idx)) {
      setPendingGateCell(idx);
      setTimeout(() => {
        setGateModal({ cellIdx: idx, qIdx: GATE_QUESTION_MAP[idx] ?? 0 });
        setGateSelected(null);
        setGateAnswered(false);
        setPendingGateCell(null);
      }, 280);
      return;
    }

    const newPath = [...path, idx];
    setPath(newPath);

    if (ANCHOR_CELLS.includes(idx)) {
      setVisitedAnchors(prev => new Set([...prev, idx]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (idx === LAST_CELL && newPath.length === TOTAL) {
      complete(newPath, gateScore, visitedGates);
    }
  }

  function handleGateAnswer(optIdx: number) {
    if (gateAnswered || !gateModal) return;
    setGateSelected(optIdx);
    setGateAnswered(true);
    const q = questions[gateModal.qIdx];
    if (optIdx === q.correct) {
      setGateScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleGateContinue() {
    if (!gateModal || !gateAnswered) return;
    const cellIdx = gateModal.cellIdx;
    const newVisitedGates = new Set([...visitedGates, cellIdx]);
    setVisitedGates(newVisitedGates);
    const newPath = [...path, cellIdx];
    setPath(newPath);
    setGateModal(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (cellIdx === LAST_CELL && newPath.length === TOTAL) {
      complete(newPath, gateScore + (questions[gateModal.qIdx]?.correct === gateSelected ? 1 : 0), newVisitedGates);
    }
  }

  function handleUndo() {
    if (path.length <= 1) return;
    let minPathLength = 1;
    for (let i = path.length - 1; i >= 0; i--) {
      if (visitedGates.has(path[i])) {
        minPathLength = i + 1;
        break;
      }
    }
    if (path.length > minPathLength) {
      const newPath = path.slice(0, -1);
      setPath(newPath);
      const newVisitedAnchors = new Set<number>();
      for (const c of newPath) {
        if (ANCHOR_CELLS.includes(c)) newVisitedAnchors.add(c);
      }
      setVisitedAnchors(newVisitedAnchors);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleReset() {
    setPath([START_CELL]);
    setVisitedAnchors(new Set());
    setVisitedGates(new Set());
    setGateScore(0);
    setCompleted(false);
    setErrorCell(null);
    setErrorMsg('');
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function getCellBg(idx: number, state: CellState): { bg: string; border: string } {
    const err = errorCell === idx;
    switch (state) {
      case 'start': return { bg: C.lavender + '30', border: C.lavender };
      case 'end': return { bg: C.gold + '25', border: C.gold };
      case 'current': return { bg: C.lavender + '45', border: C.lavender };
      case 'path': return { bg: C.lavender + '18', border: C.lavender + '50' };
      case 'anchor-unvisited': return err
        ? { bg: C.error + '25', border: C.error }
        : { bg: C.rose + '22', border: C.rose + '90' };
      case 'anchor-visited': return { bg: C.sage + '25', border: C.sage };
      case 'gate-unvisited': return err
        ? { bg: C.error + '25', border: C.error }
        : { bg: C.gold + '18', border: C.gold + '80' };
      case 'gate-visited': return { bg: C.sage + '18', border: C.sage + '60' };
      default: return err
        ? { bg: C.error + '25', border: C.error }
        : { bg: C.card, border: C.border };
    }
  }

  function getCellContent(idx: number, state: CellState) {
    if (state === 'start' || (idx === START_CELL && state === 'current')) {
      return <Ionicons name="radio-button-on" size={14} color={C.lavender} />;
    }
    if (state === 'end') return <Ionicons name="flag" size={14} color={C.gold} />;
    if (state === 'anchor-unvisited' || state === 'anchor-visited') {
      const n = ANCHOR_CELLS.indexOf(idx) + 1;
      return (
        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: state === 'anchor-visited' ? C.sage : C.rose }}>
          {n}
        </Text>
      );
    }
    if (state === 'gate-unvisited') {
      return <Ionicons name="diamond" size={13} color={C.gold} />;
    }
    if (state === 'gate-visited') return <Ionicons name="diamond" size={13} color={C.sage} />;
    if (state === 'current') return <View style={[styles.currentDot, { backgroundColor: C.lavender }]} />;
    if (state === 'path') return <View style={[styles.pathDot, { backgroundColor: C.lavender + '80' }]} />;
    return null;
  }

  const gateQ = gateModal ? questions[gateModal.qIdx] : null;
  const isGateCorrect = gateAnswered && gateSelected !== null && gateQ ? gateSelected === gateQ.correct : false;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.phaseLabel, { color: C.gold }]}>Phase 3 of 3</Text>
          <Text style={[styles.phaseSub, { color: C.textMuted }]}>Thread Puzzle</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={handleUndo} hitSlop={12}>
            <Ionicons name="arrow-undo" size={18} color={C.textMuted} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleReset} hitSlop={12}>
            <Ionicons name="refresh" size={18} color={C.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: C.border }]}>
        <View style={[styles.progressFill, { backgroundColor: C.gold, width: '100%' }]} />
      </View>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={[styles.hudValue, { color: C.gold }]}>{gateScore}/{GATE_CELLS.length}</Text>
          <Text style={[styles.hudLabel, { color: C.textMuted }]}>Gates</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={[styles.hudValue, { color: C.lavender }]}>{path.length - 1}/{TOTAL - 1}</Text>
          <Text style={[styles.hudLabel, { color: C.textMuted }]}>Cells</Text>
        </View>
        {nextAnchor !== undefined ? (
          <View style={styles.hudItem}>
            <Text style={[styles.hudValue, { color: C.rose }]}>
              {ANCHOR_CELLS.indexOf(nextAnchor) + 1}
            </Text>
            <Text style={[styles.hudLabel, { color: C.textMuted }]}>Next waypoint</Text>
          </View>
        ) : (
          <View style={styles.hudItem}>
            <Ionicons name="checkmark-circle" size={20} color={C.sage} />
            <Text style={[styles.hudLabel, { color: C.textMuted }]}>All waypoints</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <Text style={[styles.instructions, { color: C.textSub }]}>
        Fill <Text style={{ color: C.lavender, fontFamily: 'Inter_700Bold' }}>all 25 cells</Text> · visit ①②③ in order · reach{' '}
        <Text style={{ color: C.gold, fontFamily: 'Inter_700Bold' }}>🏁 last</Text>
      </Text>

      {/* Grid */}
      <Animated.View
        style={[styles.grid, { transform: [{ translateX: shakeAnim }] }]}
      >
        {Array.from({ length: TOTAL }, (_, idx) => {
          const state = getCellState(idx);
          const { bg, border } = getCellBg(idx, state);
          const isPending = pendingGateCell === idx;
          return (
            <Pressable
              key={idx}
              style={[
                styles.cell,
                { backgroundColor: bg, borderColor: border, borderWidth: 1 },
                isPending && { opacity: 0.5 },
              ]}
              onPress={() => handleCellTap(idx)}
              testID={`grid-cell-${idx}`}
            >
              {getCellContent(idx, state)}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Error message */}
      {errorMsg !== '' && (
        <View style={[styles.errorBanner, { backgroundColor: C.error + '18', borderColor: C.error + '40' }]}>
          <Ionicons name="alert-circle-outline" size={14} color={C.error} />
          <Text style={[styles.errorText, { color: C.error }]}>{errorMsg}</Text>
        </View>
      )}

      {/* Completed overlay */}
      {completed && (
        <View style={styles.completedOverlay}>
          <Text style={[styles.completedText, { color: C.text }]}>Thread Complete! ✨</Text>
        </View>
      )}

      {/* Bottom padding */}
      <View style={{ height: botInset + 16 }} />

      {/* Gate Modal */}
      {gateModal && gateQ && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: C.card, borderColor: C.gold + '60' }]}>
            <LinearGradient colors={[C.gold + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={[styles.modalBadge, { backgroundColor: C.gold + '20' }]}>
              <Ionicons name="diamond" size={12} color={C.gold} />
              <Text style={[styles.modalBadgeText, { color: C.gold }]}>Gate Question</Text>
            </View>
            <Text style={[styles.modalQ, { color: C.text }]}>{gateQ.q}</Text>
            {gateQ.opts.map((opt, i) => {
              const isSel = gateSelected === i;
              const isRight = gateAnswered && i === gateQ.correct;
              const isBad = gateAnswered && isSel && !isRight;
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.modalOpt,
                    {
                      backgroundColor: isRight
                        ? C.sage + '18'
                        : isBad
                        ? C.error + '18'
                        : C.bg,
                      borderColor: isRight
                        ? C.sage
                        : isBad
                        ? C.error
                        : C.border,
                    },
                  ]}
                  onPress={() => handleGateAnswer(i)}
                  disabled={gateAnswered}
                >
                  <View style={[
                    styles.optLetterBox,
                    { backgroundColor: isRight ? C.sage + '30' : isBad ? C.error + '30' : C.border + '60' },
                  ]}>
                    <Text style={[styles.optLetter, { color: isRight ? C.sage : isBad ? C.error : C.textMuted }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[styles.modalOptText, { color: C.text }]}>{opt}</Text>
                  {isRight && <Ionicons name="checkmark-circle" size={16} color={C.sage} />}
                  {isBad && <Ionicons name="close-circle" size={16} color={C.error} />}
                </Pressable>
              );
            })}

            {/* Explanation always shown after answering */}
            {gateAnswered && (
              <View style={[styles.explainBox, { backgroundColor: isGateCorrect ? C.sage + '12' : C.error + '12', borderColor: isGateCorrect ? C.sage + '40' : C.error + '40' }]}>
                <Text style={[styles.explainLabel, { color: isGateCorrect ? C.sage : C.error }]}>
                  {isGateCorrect ? gateQ.right : gateQ.wrong}
                </Text>
                <Text style={[styles.explainText, { color: C.textSub }]}>{gateQ.explain}</Text>
              </View>
            )}

            {gateAnswered && (
              <Pressable
                style={({ pressed }) => [
                  styles.continueBtn,
                  { backgroundColor: C.gold, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleGateContinue}
              >
                <Text style={[styles.continueBtnText, { color: C.bg }]}>Continue threading</Text>
                <Ionicons name="arrow-forward" size={16} color={C.bg} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 0,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phaseLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  phaseSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  headerActions: { flexDirection: 'row', gap: 2 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 3, marginTop: 10 },
  progressFill: { height: 3 },
  hud: {
    flexDirection: 'row', paddingHorizontal: 20,
    paddingVertical: 12, gap: 0,
  },
  hudItem: { flex: 1, alignItems: 'center', gap: 2 },
  hudValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  hudLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  instructions: {
    paddingHorizontal: 20, fontSize: 13, fontFamily: 'Inter_400Regular',
    lineHeight: 20, marginBottom: 12,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: GRID_GAP,
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  currentDot: { width: 10, height: 10, borderRadius: 5 },
  pathDot: { width: 6, height: 6, borderRadius: 3 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 10, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  completedOverlay: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    alignItems: 'center',
  },
  completedText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    width: '100%', borderRadius: 22, borderWidth: 1,
    padding: 20, gap: 10, overflow: 'hidden',
  },
  modalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100,
  },
  modalBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  modalQ: { fontSize: 16, fontFamily: 'Inter_700Bold', lineHeight: 24 },
  modalOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 11,
  },
  optLetterBox: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  optLetter: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  modalOptText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },
  explainBox: {
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 6,
  },
  explainLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  explainText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 2,
  },
  continueBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
