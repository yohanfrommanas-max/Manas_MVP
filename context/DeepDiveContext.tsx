import React, { createContext, useContext, useState, useCallback } from 'react';
import { TOPICS } from '@/data/deep_dive_topics';

export type Topic = typeof TOPICS[0];

export interface SessionResult {
  topicIndex: number;
  flashcardsScore: number;
  flashcardsTotal: number;
  threadScore: number;
  threadTotal: number;
  completedAt: string;
}

interface DeepDiveState {
  topic: Topic | null;
  topicIndex: number;
  flashcardsScore: number;
  flashcardsTotal: number;
  threadScore: number;
  threadTotal: number;
}

interface DeepDiveContextType extends DeepDiveState {
  startSession: (topic: Topic) => void;
  setFlashcardsResult: (score: number, total: number) => void;
  setThreadResult: (score: number, total: number) => void;
  clearSession: () => void;
  getSessionResult: () => SessionResult | null;
}

const DeepDiveContext = createContext<DeepDiveContextType | null>(null);

const DEFAULT_STATE: DeepDiveState = {
  topic: null,
  topicIndex: -1,
  flashcardsScore: 0,
  flashcardsTotal: 0,
  threadScore: 0,
  threadTotal: 0,
};

export function DeepDiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeepDiveState>(DEFAULT_STATE);

  const startSession = useCallback((topic: Topic) => {
    const idx = TOPICS.findIndex(t => t.name === topic.name);
    setState({
      topic,
      topicIndex: idx,
      flashcardsScore: 0,
      flashcardsTotal: 0,
      threadScore: 0,
      threadTotal: 0,
    });
  }, []);

  const setFlashcardsResult = useCallback((score: number, total: number) => {
    setState(prev => ({ ...prev, flashcardsScore: score, flashcardsTotal: total }));
  }, []);

  const setThreadResult = useCallback((score: number, total: number) => {
    setState(prev => ({ ...prev, threadScore: score, threadTotal: total }));
  }, []);

  const clearSession = useCallback(() => setState(DEFAULT_STATE), []);

  const getSessionResult = useCallback((): SessionResult | null => {
    if (!state.topic) return null;
    return {
      topicIndex: state.topicIndex,
      flashcardsScore: state.flashcardsScore,
      flashcardsTotal: state.flashcardsTotal,
      threadScore: state.threadScore,
      threadTotal: state.threadTotal,
      completedAt: new Date().toISOString(),
    };
  }, [state]);

  return (
    <DeepDiveContext.Provider value={{
      ...state,
      startSession,
      setFlashcardsResult,
      setThreadResult,
      clearSession,
      getSessionResult,
    }}>
      {children}
    </DeepDiveContext.Provider>
  );
}

export function useDeepDive() {
  const ctx = useContext(DeepDiveContext);
  if (!ctx) throw new Error('useDeepDive must be used within DeepDiveProvider');
  return ctx;
}
