import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDateStr } from '@/utils/dateHelpers';

const STORAGE_KEY = 'manas:cognitive:scores';

const SEED_SCORES_RAW = [72, 68, 81, 74, 66, 79, 83, 71, 69, 77, 80, 65, 73, 78];
const ZERO_GAME_INDICES = new Set([1, 4, 9]);

export interface CognitiveScore {
  date: string;
  score: number;
  gamesPlayed: number;
}

function seedScores(): CognitiveScore[] {
  const today = new Date();
  return SEED_SCORES_RAW.map((score, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const gamesPlayed = ZERO_GAME_INDICES.has(i) ? 0 : Math.floor(1 + Math.random() * 3);
    return {
      date: toDateStr(d),
      score: ZERO_GAME_INDICES.has(i) ? 0 : score,
      gamesPlayed,
    };
  });
}

export function useCognitiveScores() {
  const [scores, setScores] = useState<CognitiveScore[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setScores(JSON.parse(raw));
        } else {
          const seeded = seedScores();
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
          setScores(seeded);
        }
      } catch (_) {
        setScores(seedScores());
      }
    })();
  }, []);

  const getScoreForDate = useCallback((date: string): CognitiveScore | null => {
    return scores.find(s => s.date === date) ?? null;
  }, [scores]);

  const averageScore = scores.length
    ? scores.filter(s => s.gamesPlayed > 0).reduce((sum, s, _, arr) => sum + s.score / arr.length, 0)
    : 0;

  const scoreDeltaForDate = useCallback((date: string): number | null => {
    const entry = scores.find(s => s.date === date);
    if (!entry || entry.gamesPlayed === 0) return null;
    const idx = scores.findIndex(s => s.date === date);
    const window = scores.slice(Math.max(0, idx - 7), idx).filter(s => s.gamesPlayed > 0);
    if (!window.length) return null;
    const windowAvg = window.reduce((sum, s, _, arr) => sum + s.score / arr.length, 0);
    return Math.round(entry.score - windowAvg);
  }, [scores]);

  return { scores, getScoreForDate, averageScore, scoreDeltaForDate };
}
