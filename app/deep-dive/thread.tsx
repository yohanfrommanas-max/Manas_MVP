import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useDeepDive } from '@/context/DeepDiveContext';

const BG = '#0B0D12';
const SURFACE = '#13151C';
const SURFACE2 = '#1A1D27';
const LAV = '#A78BFA';
const LAV_D = '#7C5FD4';
const SAGE = '#6EE7B7';
const GOLD = '#F59E0B';
const ROSE = '#F87171';
const TEXT = '#E8E4DC';
const SUB = '#7A8099';
const MUTED = '#4A5068';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER2 = 'rgba(255,255,255,0.12)';

// ── Puzzle constants ──────────────────────────────────────────────────
const SOLUTION_PATH = [0,5,10,15,20,21,16,11,6,1,2,3,4,9,8,7,12,17,22,23,24,19,14,13,18];
const ANCHOR_IDX: Record<number, number> = { 0:1, 4:2, 8:3, 12:4, 16:5, 18:6, 20:7, 22:8, 24:9 };
const ANCHOR_CELLS: Record<number, number> = {};
Object.entries(ANCHOR_IDX).forEach(([pi, an]) => {
  ANCHOR_CELLS[SOLUTION_PATH[Number(pi)]] = an;
});
const GATE_PATH_INDICES = [6, 10, 14, 20];
const GATE_CELLS = new Set(GATE_PATH_INDICES.map(i => SOLUTION_PATH[i]));
const CELL_SIZE = 56;
const CELL_GAP = 4;

export default function ThreadScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { topic, setResult } = useDeepDive();

  // Game state (refs for stale-closure-safe reads in completion handler)
  const [playerPath, setPlayerPath] = useState<number[]>([SOLUTION_PATH[0]]);
  const [gatesDone, setGatesDone] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [gatesAnswered, setGatesAnswered] = useState(0);
  const gatesAnsweredRef = useRef(0);
  const [instr, setInstrText] = useState<{ text: string; bold: boolean }>({
    text: 'Tap adjacent cells to trace the path from 1 → 9. Fill every cell. Hit a ◆ gate for a question.',
    bold: false,
  });
  const startTime = useRef(Date.now());

  // Question overlay state
  const [gateCell, setGateCell] = useState<number | null>(null);
  const [currentGatePathIdx, setCurrentGatePathIdx] = useState<number | null>(null);
  const [qAnswered, setQAnswered] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(400)).current;
  const gateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startTime.current = Date.now();
    Animated.loop(
      Animated.sequence([
        Animated.timing(gateAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(gateAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const gateIconOpacity = gateAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  if (!topic) { router.replace('/deep-dive/topics'); return null; }

  function shakeGrid() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -3, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function setTempInstr(text: string) {
    setInstrText({ text, bold: false });
    setTimeout(() => setInstrText({
      text: 'Tap adjacent cells to trace the path from 1 → 9. Fill every cell. Hit a ◆ gate for a question.',
      bold: false,
    }), 2200);
  }

  function openQuestion(gpi: number) {
    setCurrentGatePathIdx(gpi);
    setQAnswered(false);
    setSelectedOpt(null);
    setGateCell(SOLUTION_PATH[gpi]);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, tension: 100, friction: 12, useNativeDriver: true }),
    ]).start();
  }

  function closeQuestion() {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 400, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setGateCell(null);
      setCurrentGatePathIdx(null);
    });
  }

  function answerQ(optIdx: number) {
    if (qAnswered || currentGatePathIdx === null) return;
    const qIdx = GATE_PATH_INDICES.indexOf(currentGatePathIdx);
    const q = topic.questions[qIdx];
    const correct = optIdx === q.correct;

    setQAnswered(true);
    setSelectedOpt(optIdx);
    Haptics.notificationAsync(correct
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error);

    setGatesDone(prev => ({ ...prev, [currentGatePathIdx]: correct }));
    setGatesAnswered(prev => { const v = prev + 1; gatesAnsweredRef.current = v; return v; });
    if (correct) setScore(prev => { const v = prev + 1; scoreRef.current = v; return v; });
  }

  function tryMove(cell: number) {
    if (gateCell !== null) return; // question overlay open — block moves
    const path = playerPath;
    const head = path[path.length - 1];
    const hR = Math.floor(head / 5), hC = head % 5;
    const nR = Math.floor(cell / 5), nC = cell % 5;
    const dist = Math.abs(hR - nR) + Math.abs(hC - nC);

    if (dist !== 1) {
      shakeGrid();
      setTempInstr('Tap a cell next to your current position.');
      return;
    }
    if (path.includes(cell)) {
      shakeGrid();
      setTempInstr("You've already traced that cell.");
      return;
    }
    if (ANCHOR_CELLS[cell] !== undefined) {
      const lastAnchorNum = Math.max(0, ...path
        .filter(c => ANCHOR_CELLS[c] !== undefined)
        .map(c => ANCHOR_CELLS[c]));
      if (ANCHOR_CELLS[cell] !== lastAnchorNum + 1) {
        shakeGrid();
        setTempInstr(`Reach anchor ${lastAnchorNum + 1} before ${ANCHOR_CELLS[cell]}.`);
        return;
      }
    }

    Haptics.selectionAsync();
    const newPath = [...path, cell];
    setPlayerPath(newPath);

    if (newPath.length === 25) {
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      setResult(scoreRef.current, gatesAnsweredRef.current, elapsed);
      setTimeout(() => router.push('/deep-dive/results'), 700);
      return;
    }

    const gpi = GATE_PATH_INDICES.find(gi => SOLUTION_PATH[gi] === cell);
    if (gpi !== undefined && gatesDone[gpi] === undefined) {
      setTimeout(() => openQuestion(gpi), 280);
    }
  }

  function handleUndo() {
    if (playerPath.length <= 1) return;
    const head = playerPath[playerPath.length - 1];
    const gpi = GATE_PATH_INDICES.find(gi => SOLUTION_PATH[gi] === head);
    if (gpi !== undefined && gatesDone[gpi] !== undefined) {
      setTempInstr("Can't undo past a completed gate.");
      return;
    }
    Haptics.selectionAsync();
    setPlayerPath(prev => prev.slice(0, -1));
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlayerPath([SOLUTION_PATH[0]]);
    setGatesDone({});
    setScore(0); scoreRef.current = 0;
    setGatesAnswered(0); gatesAnsweredRef.current = 0;
    startTime.current = Date.now();
    setTempInstr('Path reset. Start again from 1.');
  }

  const visitedSet = new Set(playerPath);
  const head = playerPath[playerPath.length - 1];

  const currentQIdx = currentGatePathIdx !== null
    ? GATE_PATH_INDICES.indexOf(currentGatePathIdx)
    : 0;
  const q = currentGatePathIdx !== null ? topic.questions[currentQIdx] : null;

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      {/* Nav */}
      <View style={S.nav}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={S.backArrow}>←</Text>
        </Pressable>
        <View style={S.navInfo}>
          <Text style={S.navPhase}>Phase 3 of 3 · Thread</Text>
          <Text style={S.navTitle} numberOfLines={1}>{topic.name}</Text>
        </View>
      </View>
      <View style={S.phaseBar}><View style={S.phaseFull} /></View>

      {/* HUD */}
      <View style={S.hud}>
        <Text style={S.hudLabel}>Thread</Text>
        <View style={S.hudStats}>
          <View style={S.hudFilled}>
            <Text style={S.hudFilledText}>{playerPath.length} / 25</Text>
          </View>
          <View style={S.hudScore}>
            <Text style={S.hudScoreText}>{score} / {gatesAnswered || '0'}</Text>
          </View>
        </View>
      </View>

      {/* Grid */}
      <View style={S.gridWrap}>
        <Animated.View style={[S.grid, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: 25 }, (_, cell) => {
            const isAnchor = ANCHOR_CELLS[cell] !== undefined;
            const isGate = GATE_CELLS.has(cell);
            const isVisited = visitedSet.has(cell);
            const isHead = cell === head;
            const gpi = GATE_PATH_INDICES.find(gi => SOLUTION_PATH[gi] === cell);

            let cellStyle = S.cellEmpty;
            let textStyle = S.cellTextEmpty;
            let label: string | null = null;
            let isGateUnvisited = false;

            if (isHead) {
              cellStyle = S.cellHead;
              textStyle = S.cellTextHead;
              label = String(playerPath.length);
            } else if (isVisited) {
              if (isAnchor) {
                cellStyle = S.cellAnchor;
                textStyle = S.cellTextAnchor;
                label = String(ANCHOR_CELLS[cell]);
              } else if (isGate && gpi !== undefined) {
                if (gatesDone[gpi] === true) {
                  cellStyle = S.cellGateDone;
                  textStyle = S.cellTextGateDone;
                  label = '✓';
                } else if (gatesDone[gpi] === false) {
                  cellStyle = S.cellGateWrong;
                  textStyle = S.cellTextGateWrong;
                  label = '✗';
                } else {
                  cellStyle = S.cellFilled;
                  textStyle = S.cellTextFilled;
                  label = String(playerPath.indexOf(cell) + 1);
                }
              } else {
                cellStyle = S.cellFilled;
                textStyle = S.cellTextFilled;
                label = String(playerPath.indexOf(cell) + 1);
              }
            } else {
              if (isAnchor) {
                cellStyle = S.cellAnchor;
                textStyle = S.cellTextAnchor;
                label = String(ANCHOR_CELLS[cell]);
              } else if (isGate) {
                isGateUnvisited = true;
              }
            }

            return (
              <Pressable
                key={cell}
                style={({ pressed }) => [
                  S.cell,
                  cellStyle,
                  pressed && !isHead && !isAnchor && { transform: [{ scale: 0.94 }], opacity: 0.8 },
                ]}
                onPress={() => !isHead && tryMove(cell)}
                disabled={isHead}
              >
                {isGateUnvisited ? (
                  <Animated.Text style={[S.gateIcon, { opacity: gateIconOpacity }]}>◆</Animated.Text>
                ) : (
                  <Text style={textStyle}>{label}</Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      {/* Instructions */}
      <Text style={S.instr}>{instr.text}</Text>

      {/* Actions */}
      <View style={S.actions}>
        <Pressable
          style={({ pressed }) => [S.actionBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
          onPress={handleUndo}
        >
          <Text style={S.actionBtnText}>↩ Undo</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [S.actionBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
          onPress={handleReset}
        >
          <Text style={S.actionBtnText}>↺ Reset</Text>
        </Pressable>
      </View>

      {/* Question overlay */}
      {gateCell !== null && (
        <Animated.View style={[S.overlay, { opacity: overlayOpacity }]}>
          <Animated.View style={[S.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={S.sheetInner}>
              <View style={S.handle} />
              <View style={S.qBadge}>
                <Text style={S.qBadgeText}>Gate {currentQIdx + 1} of 4</Text>
              </View>
              {q && (
                <>
                  <Text style={S.qText}>{q.q}</Text>
                  <View style={S.qOpts}>
                    {['A','B','C','D'].map((ltr, i) => {
                      const isSelected = selectedOpt === i;
                      const isCorrect = i === q.correct;
                      let optStyle = S.qOpt;
                      if (qAnswered) {
                        if (isCorrect) optStyle = S.qOptCorrect;
                        else if (isSelected && !isCorrect) optStyle = S.qOptWrong;
                      }
                      return (
                        <Pressable
                          key={i}
                          style={({ pressed }) => [
                            S.qOpt, optStyle,
                            qAnswered && { opacity: 1 },
                            pressed && !qAnswered && { transform: [{ scale: 0.98 }] },
                          ]}
                          onPress={() => answerQ(i)}
                          disabled={qAnswered}
                        >
                          <View style={[
                            S.qLetter,
                            qAnswered && isCorrect && S.qLetterCorrect,
                            qAnswered && isSelected && !isCorrect && S.qLetterWrong,
                          ]}>
                            <Text style={[S.qLetterText,
                              qAnswered && (isCorrect || (isSelected && !isCorrect)) && { color: '#0B0D12' }
                            ]}>{ltr}</Text>
                          </View>
                          <Text style={S.qOptText}>{q.opts[i]}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {qAnswered && (
                    <>
                      <View style={[S.qExp, selectedOpt === q.correct ? S.qExpRight : S.qExpWrong]}>
                        <Text style={[S.qExpTitle, { color: selectedOpt === q.correct ? SAGE : ROSE }]}>
                          {selectedOpt === q.correct ? `✓  ${q.right}` : `✗  ${q.wrong}`}
                        </Text>
                        <Text style={S.qExpBody}>{q.explain}</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [S.continueBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                        onPress={closeQuestion}
                      >
                        <LinearGradient
                          colors={[LAV, LAV_D]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                        <Text style={S.continueBtnText}>Continue threading →</Text>
                      </Pressable>
                    </>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  nav: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(11,13,18,0.96)',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 15, color: TEXT },
  navInfo: { flex: 1 },
  navPhase: { fontSize: 9, color: LAV, letterSpacing: 1.2, fontFamily: 'Inter_500Medium', marginBottom: 1 },
  navTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT },
  phaseBar: { height: 2, backgroundColor: SURFACE2 },
  phaseFull: { height: 2, flex: 1, backgroundColor: LAV },

  hud: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6,
  },
  hudLabel: { fontSize: 10, color: LAV, fontFamily: 'Inter_500Medium', letterSpacing: 1 },
  hudStats: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hudFilled: {
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3,
  },
  hudFilledText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: SUB },
  hudScore: {
    backgroundColor: 'rgba(110,231,183,0.08)', borderWidth: 1,
    borderColor: 'rgba(110,231,183,0.15)', borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  hudScoreText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: SAGE },

  gridWrap: { alignItems: 'center', paddingVertical: 8 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    width: 5 * CELL_SIZE + 4 * CELL_GAP,
    gap: CELL_GAP,
  },

  cell: {
    width: CELL_SIZE, height: CELL_SIZE, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  cellEmpty: { backgroundColor: SURFACE, borderColor: BORDER },
  cellAnchor: { backgroundColor: SURFACE2, borderColor: BORDER2 },
  cellFilled: { backgroundColor: 'rgba(167,139,250,0.14)', borderColor: 'rgba(167,139,250,0.45)' },
  cellHead: {
    backgroundColor: 'rgba(167,139,250,0.28)', borderColor: LAV, borderWidth: 2,
    shadowColor: LAV, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cellGateDone: { backgroundColor: 'rgba(110,231,183,0.1)', borderColor: 'rgba(110,231,183,0.4)' },
  cellGateWrong: { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)' },

  cellTextEmpty: { color: 'transparent' },
  cellTextAnchor: { fontSize: 15, fontFamily: 'Inter_500Medium', color: TEXT },
  cellTextFilled: { fontSize: 13, fontFamily: 'Inter_400Regular', color: LAV },
  cellTextHead: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: TEXT },
  cellTextGateDone: { fontSize: 13, fontFamily: 'Inter_500Medium', color: SAGE },
  cellTextGateWrong: { fontSize: 13, fontFamily: 'Inter_500Medium', color: ROSE },

  gateIcon: { fontSize: 16, color: GOLD },

  instr: {
    textAlign: 'center', fontSize: 12, color: SUB,
    paddingHorizontal: 22, paddingVertical: 4, lineHeight: 18, minHeight: 38,
  },

  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingBottom: 16 },
  actionBtn: {
    flex: 1, height: 44, borderRadius: 13,
    borderWidth: 1, borderColor: BORDER2, backgroundColor: SURFACE2,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: TEXT },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,13,18,0.88)',
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderColor: BORDER2,
  },
  sheetInner: { padding: 22, paddingBottom: 36 },
  handle: { width: 36, height: 4, backgroundColor: BORDER2, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },

  qBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14,
  },
  qBadgeText: { fontSize: 9, letterSpacing: 1, color: GOLD, fontFamily: 'Inter_500Medium' },
  qText: { fontFamily: 'Lora_400Regular', fontSize: 17, color: TEXT, lineHeight: 24, letterSpacing: -0.2, marginBottom: 16 },

  qOpts: { gap: 8, marginBottom: 12 },
  qOpt: {
    backgroundColor: SURFACE2, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  qOptCorrect: { borderColor: SAGE, backgroundColor: 'rgba(110,231,183,0.07)' },
  qOptWrong: { borderColor: ROSE, backgroundColor: 'rgba(248,113,113,0.07)' },
  qLetter: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  qLetterCorrect: { backgroundColor: SAGE, borderColor: SAGE },
  qLetterWrong: { backgroundColor: ROSE, borderColor: ROSE },
  qLetterText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: SUB },
  qOptText: { fontSize: 13, color: TEXT, lineHeight: 19, flex: 1 },

  qExp: { borderRadius: 13, padding: 12, marginBottom: 12 },
  qExpRight: { backgroundColor: 'rgba(110,231,183,0.07)', borderWidth: 1, borderColor: 'rgba(110,231,183,0.15)' },
  qExpWrong: { backgroundColor: 'rgba(248,113,113,0.07)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)' },
  qExpTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  qExpBody: { fontSize: 12, color: SUB, lineHeight: 19, fontFamily: 'Lora_400Regular' },

  continueBtn: {
    width: '100%', height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  continueBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#0B0D12' },
});
