import React, { useState, useRef, useMemo } from 'react';
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
const GATE_CELLS = [2, 22];
const START_CELL = 0;
const END_CELL = 24;

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

type CellState = 'idle' | 'path' | 'current' | 'anchor-unvisited' | 'anchor-visited' | 'gate-unvisited' | 'gate-visited' | 'start' | 'end';

export default function ThreadScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, setThreadResult } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [path, setPath] = useState<number[]>([START_CELL]);
  const [visitedAnchors, setVisitedAnchors] = useState<Set<number>>(new Set());
  const [visitedGates, setVisitedGates] = useState<Set<number>>(new Set());
  const [gateModal, setGateModal] = useState<{ cellIdx: number; qIdx: number } | null>(null);
  const [gateSelected, setGateSelected] = useState<number | null>(null);
  const [gateAnswered, setGateAnswered] = useState(false);
  const [gateScore, setGateScore] = useState(0);
  const [errorCell, setErrorCell] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const questions = topic.questions;
  const gateQuestionMap: Record<number, number> = {
    [GATE_CELLS[0]]: 0,
    [GATE_CELLS[1]]: 3,
  };

  const current = path[path.length - 1];
  const nextAnchor = ANCHOR_CELLS.find(a => !visitedAnchors.has(a));

  function getCellState(idx: number): CellState {
    if (idx === START_CELL) return 'start';
    if (idx === END_CELL) return 'end';
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
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleCellTap(idx: number) {
    if (completed || gateModal) return;
    if (path.includes(idx)) {
      const truncIdx = path.indexOf(idx);
      const newPath = path.slice(0, truncIdx + 1);
      setPath(newPath);
      const newVisitedAnchors = new Set<number>();
      const newVisitedGates = new Set<number>();
      for (const c of newPath) {
        if (ANCHOR_CELLS.includes(c)) newVisitedAnchors.add(c);
        if (GATE_CELLS.includes(c)) newVisitedGates.add(c);
      }
      setVisitedAnchors(newVisitedAnchors);
      setVisitedGates(newVisitedGates);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    if (!isAdjacent(current, idx)) {
      setErrorCell(idx);
      setTimeout(() => setErrorCell(null), 600);
      shake();
      return;
    }
    if (ANCHOR_CELLS.includes(idx) && nextAnchor !== idx) {
      setErrorCell(idx);
      setTimeout(() => setErrorCell(null), 600);
      shake();
      return;
    }
    if (GATE_CELLS.includes(idx) && !visitedGates.has(idx)) {
      const qIdx = gateQuestionMap[idx] ?? 0;
      setGateModal({ cellIdx: idx, qIdx });
      setGateSelected(null);
      setGateAnswered(false);
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
    if (idx === END_CELL) {
      setCompleted(true);
      setThreadResult(gateScore, GATE_CELLS.length);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function handleGateAnswer(idx: number) {
    if (gateAnswered || !gateModal) return;
    setGateSelected(idx);
    setGateAnswered(true);
    const q = questions[gateModal.qIdx];
    if (idx === q.correct) {
      setGateScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleGateContinue() {
    if (!gateModal) return;
    const cellIdx = gateModal.cellIdx;
    setVisitedGates(prev => new Set([...prev, cellIdx]));
    setGateModal(null);
    const newPath = [...path, cellIdx];
    setPath(newPath);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleReset() {
    setPath([START_CELL]);
    setVisitedAnchors(new Set());
    setVisitedGates(new Set());
    setGateScore(0);
    setCompleted(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function getCellStyle(idx: number, state: CellState) {
    const base: any = {
      backgroundColor: C.card,
      borderColor: C.border,
      borderWidth: 1,
    };
    switch (state) {
      case 'start':
        return { ...base, backgroundColor: C.lavender + '30', borderColor: C.lavender };
      case 'end':
        return { ...base, backgroundColor: C.gold + '25', borderColor: C.gold };
      case 'current':
        return { ...base, backgroundColor: C.lavender + '40', borderColor: C.lavender };
      case 'path':
        return { ...base, backgroundColor: C.lavender + '18', borderColor: C.lavender + '50' };
      case 'anchor-unvisited':
        return { ...base, backgroundColor: C.rose + '20', borderColor: C.rose + '80' };
      case 'anchor-visited':
        return { ...base, backgroundColor: C.success + '25', borderColor: C.success };
      case 'gate-unvisited':
        return { ...base, backgroundColor: C.gold + '18', borderColor: C.gold + '80' };
      case 'gate-visited':
        return { ...base, backgroundColor: C.success + '18', borderColor: C.success + '60' };
      case 'idle':
        return errorCell === idx
          ? { ...base, backgroundColor: C.error + '25', borderColor: C.error }
          : base;
    }
    return base;
  }

  function getCellContent(idx: number, state: CellState) {
    if (idx === START_CELL) return <Ionicons name="radio-button-on" size={16} color={C.lavender} />;
    if (idx === END_CELL) return <Ionicons name="flag" size={16} color={C.gold} />;
    if (state === 'anchor-unvisited' || state === 'anchor-visited') {
      const n = ANCHOR_CELLS.indexOf(idx) + 1;
      return (
        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: state === 'anchor-visited' ? C.success : C.rose }}>
          {n}
        </Text>
      );
    }
    if (state === 'gate-unvisited') return <Ionicons name="lock-closed" size={14} color={C.gold} />;
    if (state === 'gate-visited') return <Ionicons name="lock-open" size={14} color={C.success} />;
    if (state === 'current') return <View style={[styles.currentDot, { backgroundColor: C.lavender }]} />;
    if (state === 'path') return <View style={[styles.pathDot, { backgroundColor: C.lavender + '80' }]} />;
    return null;
  }

  const gateQ = gateModal ? questions[gateModal.qIdx] : null;

  if (completed) {
    const pct = GATE_CELLS.length > 0 ? Math.round((gateScore / GATE_CELLS.length) * 100) : 100;
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <View style={[styles.doneCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <LinearGradient colors={[C.gold + '20', C.bg + '00']} style={StyleSheet.absoluteFill} />
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={[styles.doneTitle, { color: C.text }]}>Thread Complete!</Text>
          <Text style={[styles.doneScore, { color: C.gold }]}>{gateScore}/{GATE_CELLS.length} gates passed</Text>
          <Text style={[styles.doneMsg, { color: C.textSub }]}>
            You navigated the knowledge maze and connected all the threads.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, { backgroundColor: C.gold, borderColor: 'transparent' }, pressed && { opacity: 0.85 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/deep-dive/results'); }}
          >
            <Text style={[styles.nextBtnText, { color: C.bg }]}>See Results</Text>
            <Ionicons name="trophy-outline" size={16} color={C.bg} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.phasePill}>
            <Text style={[styles.phaseNum, { color: C.gold }]}>Phase 3</Text>
            <Text style={[styles.phaseLabel, { color: C.textMuted }]}>Thread Puzzle</Text>
          </View>
        </View>
        <Pressable style={styles.resetBtn} onPress={handleReset} hitSlop={12}>
          <Ionicons name="refresh" size={18} color={C.textMuted} />
        </Pressable>
      </View>

      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend} contentContainerStyle={styles.legendContent}>
        {[
          { color: C.lavender, label: 'Path', dot: true },
          { color: C.rose, label: 'Waypoint', dot: true },
          { color: C.gold, label: 'Gate', dot: true },
          { color: C.success, label: 'Visited', dot: true },
        ].map(l => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color + '50', borderColor: l.color }]} />
            <Text style={[styles.legendText, { color: C.textMuted }]}>{l.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Instructions */}
      <Text style={[styles.instructions, { color: C.textSub }]}>
        Trace from <Text style={{ color: C.lavender, fontFamily: 'Inter_700Bold' }}>Start</Text> → waypoints (①②③) in order → gates → <Text style={{ color: C.gold, fontFamily: 'Inter_700Bold' }}>Finish</Text>
      </Text>

      {/* Grid */}
      <Animated.View style={[styles.grid, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: TOTAL }, (_, idx) => {
          const state = getCellState(idx);
          return (
            <Pressable
              key={idx}
              style={[styles.cell, getCellStyle(idx, state)]}
              onPress={() => handleCellTap(idx)}
            >
              {getCellContent(idx, state)}
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Status */}
      <View style={[styles.statusBar, { paddingBottom: botInset + 12 }]}>
        <Text style={[styles.statusText, { color: C.textSub }]}>
          {nextAnchor !== undefined
            ? `Next: waypoint ${ANCHOR_CELLS.indexOf(nextAnchor) + 1}`
            : path.length > 1
            ? 'All waypoints visited — reach the flag!'
            : 'Tap an adjacent cell to begin'}
        </Text>
        <Text style={[styles.statusSteps, { color: C.textMuted }]}>{path.length - 1} steps</Text>
      </View>

      {/* Gate Modal */}
      {gateModal && gateQ && (
        <View style={[styles.modalOverlay]}>
          <View style={[styles.modal, { backgroundColor: C.card, borderColor: C.gold + '60' }]}>
            <LinearGradient colors={[C.gold + '18', C.bg + '00']} style={StyleSheet.absoluteFill} />
            <View style={[styles.modalBadge, { backgroundColor: C.gold + '20' }]}>
              <Ionicons name="lock-closed" size={14} color={C.gold} />
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
                      backgroundColor: isRight ? C.success + '18' : isBad ? C.error + '18' : C.bg,
                      borderColor: isRight ? C.success : isBad ? C.error : C.border,
                    },
                  ]}
                  onPress={() => handleGateAnswer(i)}
                  disabled={gateAnswered}
                >
                  <Text style={[styles.modalOptText, { color: C.text }]}>{opt}</Text>
                  {isRight && <Ionicons name="checkmark-circle" size={16} color={C.success} />}
                  {isBad && <Ionicons name="close-circle" size={16} color={C.error} />}
                </Pressable>
              );
            })}
            {gateAnswered && (
              <Pressable
                style={[styles.nextBtn, { backgroundColor: C.gold, borderColor: 'transparent', marginTop: 4 }]}
                onPress={handleGateContinue}
              >
                <Text style={[styles.nextBtnText, { color: C.bg }]}>Continue</Text>
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
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  resetBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  legend: { flexGrow: 0 },
  legendContent: { paddingHorizontal: 20, gap: 16, paddingVertical: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  instructions: {
    paddingHorizontal: 20, fontSize: 13, fontFamily: 'Inter_400Regular',
    lineHeight: 20, marginBottom: 12,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: GRID_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentDot: { width: 10, height: 10, borderRadius: 5 },
  pathDot: { width: 6, height: 6, borderRadius: 3 },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16,
  },
  statusText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  statusSteps: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, borderRadius: 12, borderWidth: 1, padding: 12,
  },
  modalOptText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 20 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
  },
  nextBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  doneCard: {
    borderRadius: 24, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 12, overflow: 'hidden', width: '100%',
  },
  doneTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  doneScore: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  doneMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
});
