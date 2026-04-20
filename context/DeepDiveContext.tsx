import React, { createContext, useContext, useState, useCallback } from 'react';
import { TOPICS } from '@/data/deep_dive_topics';
import { sanitizeTopic } from '@/utils/sanitize';

export type Topic = typeof TOPICS[0];

export interface SessionResult {
  topicIndex: number;
  threadScore: number;
  threadTotal: number;
  startTime: Date;
  completedAt: Date;
  gatesAnswered: number[];
  playerPath: number[];
}

interface DeepDiveState {
  topic: Topic | null;
  topicIndex: number;
  threadScore: number;
  threadTotal: number;
  startTime: Date | null;
  gatesAnswered: number[];
  playerPath: number[];
}

interface DeepDiveContextType extends DeepDiveState {
  startSession: (topic: Topic) => void;
  setThreadResult: (score: number, total: number, gatesAnswered: number[], playerPath: number[]) => void;
  clearSession: () => void;
  getSessionResult: () => SessionResult | null;
}

const DeepDiveContext = createContext<DeepDiveContextType | null>(null);

const DEFAULT_STATE: DeepDiveState = {
  topic: null,
  topicIndex: -1,
  threadScore: 0,
  threadTotal: 0,
  startTime: null,
  gatesAnswered: [],
  playerPath: [],
};

export function DeepDiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeepDiveState>(DEFAULT_STATE);

  const startSession = useCallback((rawTopic: Topic) => {
    const topic = sanitizeTopic(rawTopic) as Topic;
    const idx = TOPICS.findIndex(t => t.name === rawTopic.name);
    setState({
      topic,
      topicIndex: idx,
      threadScore: 0,
      threadTotal: 0,
      startTime: new Date(),
      gatesAnswered: [],
      playerPath: [],
    });
  }, []);

  const setThreadResult = useCallback(
    (score: number, total: number, gatesAnswered: number[], playerPath: number[]) => {
      setState(prev => ({ ...prev, threadScore: score, threadTotal: total, gatesAnswered, playerPath }));
    },
    []
  );

  const clearSession = useCallback(() => setState(DEFAULT_STATE), []);

  const getSessionResult = useCallback((): SessionResult | null => {
    if (!state.topic || !state.startTime) return null;
    return {
      topicIndex: state.topicIndex,
      threadScore: state.threadScore,
      threadTotal: state.threadTotal,
      startTime: state.startTime,
      completedAt: new Date(),
      gatesAnswered: state.gatesAnswered,
      playerPath: state.playerPath,
    };
  }, [state]);

  return (
    <DeepDiveContext.Provider
      value={{
        ...state,
        startSession,
        setThreadResult,
        clearSession,
        getSessionResult,
      }}
    >
      {children}
    </DeepDiveContext.Provider>
  );
}

export function useDeepDive() {
  const ctx = useContext(DeepDiveContext);
  if (!ctx) throw new Error('useDeepDive must be used within DeepDiveProvider');
  return ctx;
}
