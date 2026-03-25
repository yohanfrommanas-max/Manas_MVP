import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/lib/supabase';

type MoodLog = Database['public']['Tables']['mood_logs']['Row'];

export function useMoodLogs() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<MoodLog[]>({
    queryKey: ['/supabase/mood_logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MoodLog[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function useInsertMoodLog() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ mood, date }: { mood: number; date: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('mood_logs')
        .upsert(
          { user_id: user.id, logged_date: date, mood },
          { onConflict: 'user_id,logged_date' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/supabase/mood_logs', user?.id] });
    },
  });
}
