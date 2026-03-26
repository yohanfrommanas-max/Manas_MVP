import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SupabaseMoodLog {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  logged_at: string;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useMoodLogs() {
  const [logs, setLogs] = useState<SupabaseMoodLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (!error && data) setLogs(data as SupabaseMoodLog[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logMood = useCallback(async (mood: number): Promise<boolean> => {
    if (!userId) return false;
    const today = getTodayStr();
    const { data, error } = await supabase
      .from('mood_logs')
      .upsert(
        {
          user_id: userId,
          date: today,
          mood,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' },
      )
      .select();
    if (!error && data?.[0]) {
      const updated = data[0] as SupabaseMoodLog;
      setLogs(prev => {
        const filtered = prev.filter(l => l.date !== today);
        return [updated, ...filtered];
      });
      return true;
    }
    return false;
  }, [userId]);

  const todaysMood = logs.find(l => l.date === getTodayStr())?.mood ?? null;

  return { logs, loading, logMood, todaysMood, refetch: fetchLogs };
}
