import React, { createContext, useContext, useState } from 'react';
import { TOPICS } from '@/data/deep_dive_topics';

export type Topic = typeof TOPICS[0];

interface DeepDiveCtx {
  topic: Topic | null;
  setTopic: (t: Topic) => void;
  threadScore: number;
  threadTotal: number;
  elapsed: number;
  setResult: (score: number, total: number, elapsed: number) => void;
  resetSession: () => void;
}

const Ctx = createContext<DeepDiveCtx>({
  topic: null,
  setTopic: () => {},
  threadScore: 0,
  threadTotal: 0,
  elapsed: 0,
  setResult: () => {},
  resetSession: () => {},
});

export function DeepDiveProvider({ children }: { children: React.ReactNode }) {
  const [topic, setTopicState] = useState<Topic | null>(null);
  const [threadScore, setThreadScore] = useState(0);
  const [threadTotal, setThreadTotal] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const setTopic = (t: Topic) => setTopicState(t);
  const setResult = (score: number, total: number, el: number) => {
    setThreadScore(score);
    setThreadTotal(total);
    setElapsed(el);
  };
  const resetSession = () => {
    setTopicState(null);
    setThreadScore(0);
    setThreadTotal(0);
    setElapsed(0);
  };

  return (
    <Ctx.Provider value={{ topic, setTopic, threadScore, threadTotal, elapsed, setResult, resetSession }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDeepDive() { return useContext(Ctx); }
