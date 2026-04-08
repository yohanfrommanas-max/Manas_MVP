import { supabase } from '@/lib/supabase';
import type { JournalEntry, FavouriteItem, MoodLog, JournalMood } from '@/context/AppContext';

// ─── helpers ──────────────────────────────────────────────────────────────

function log(tag: string, err: any) {
  if (__DEV__) console.warn(`[supabaseData:${tag}]`, err?.message ?? err);
}

// ─── Mood Logs ────────────────────────────────────────────────────────────

export async function fetchMoodLogs(userId: string): Promise<MoodLog[]> {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('date, mood, logged_at')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { log('fetchMoodLogs', error); return []; }
  return (data ?? []).map((r: any) => ({
    date: r.date as string,
    mood: r.mood as number,
    timestamp: new Date(r.logged_at ?? r.date).getTime(),
  }));
}

export async function upsertMoodLog(userId: string, date: string, mood: number): Promise<void> {
  const { error } = await supabase.from('mood_logs').upsert(
    { user_id: userId, date, mood, logged_at: new Date().toISOString() },
    { onConflict: 'user_id,date' },
  );
  if (error) log('upsertMoodLog', error);
}

// ─── Journal Entries ──────────────────────────────────────────────────────

const VALID_MOODS = new Set<string>(['calm', 'focused', 'anxious', 'tired', 'energized']);

function toJournalMood(raw: string): JournalMood {
  return VALID_MOODS.has(raw) ? (raw as JournalMood) : 'focused';
}

function dbRowToEntry(row: any): JournalEntry {
  return {
    id: row.id as string,
    date: row.date as string,
    prompt: row.prompt ?? '',
    promptCategory: row.prompt_category ?? '',
    text: row.text ?? '',
    mood: toJournalMood(row.mood ?? ''),
    timestamp: new Date(row.created_at ?? row.date).getTime(),
    starred: row.starred ?? false,
    title: row.title ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

export async function fetchJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { log('fetchJournalEntries', error); return []; }
  return (data ?? []).map(dbRowToEntry);
}

export async function insertJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  const payload = {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    title: entry.title ?? '',
    text: entry.text,
    prompt: entry.prompt ?? '',
    prompt_category: entry.promptCategory ?? '',
    mood: entry.mood,
    tags: entry.tags ?? [],
    starred: entry.starred ?? false,
  };
  console.log('[Journal] saving entry:', {
    user_id: userId, date: entry.date, mood: entry.mood, id: entry.id,
  });
  const { error } = await supabase.from('journal_entries').insert(payload);
  if (error) {
    log('insertJournalEntry', error);
  } else {
    console.log('[Journal] insert OK for id:', entry.id);
  }
}

export async function updateJournalEntryDB(entryId: string, partial: Partial<JournalEntry>): Promise<void> {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (partial.title !== undefined) updates.title = partial.title;
  if (partial.text !== undefined) updates.text = partial.text;
  if (partial.mood !== undefined) updates.mood = partial.mood;
  if (partial.tags !== undefined) updates.tags = partial.tags;
  if (partial.starred !== undefined) updates.starred = partial.starred;
  if (partial.prompt !== undefined) updates.prompt = partial.prompt;
  if (partial.promptCategory !== undefined) updates.prompt_category = partial.promptCategory;
  const { error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', entryId);
  if (error) log('updateJournalEntry', error);
}

export async function deleteJournalEntryDB(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', entryId);
  if (error) log('deleteJournalEntry', error);
}

// ─── Favourites ───────────────────────────────────────────────────────────

function dbRowToFavourite(row: any): FavouriteItem {
  return {
    id: row.content_id as string,
    type: row.type as FavouriteItem['type'],
    title: row.title as string,
    subtitle: row.subtitle ?? undefined,
    category: row.category ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    iconSet: row.icon_set ?? undefined,
  };
}

export async function fetchFavourites(userId: string): Promise<FavouriteItem[]> {
  const { data, error } = await supabase
    .from('favourites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { log('fetchFavourites', error); return []; }
  return (data ?? []).map(dbRowToFavourite);
}

export async function upsertFavouriteDB(userId: string, item: FavouriteItem): Promise<void> {
  const { error } = await supabase.from('favourites').upsert(
    {
      user_id: userId,
      content_id: item.id,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle ?? null,
      category: item.category ?? null,
      color: item.color ?? null,
      icon: item.icon ?? null,
      icon_set: item.iconSet ?? null,
    },
    { onConflict: 'user_id,type,content_id' },
  );
  if (error) log('upsertFavourite', error);
}

export async function deleteFavouriteDB(userId: string, type: string, contentId: string): Promise<void> {
  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)
    .eq('content_id', contentId);
  if (error) log('deleteFavourite', error);
}

// ─── Game Plays ───────────────────────────────────────────────────────────

export async function insertGamePlay(
  userId: string,
  gameId: string,
  score: number,
  difficulty: string,
  durationSeconds = 0,
  meta: Record<string, any> = {},
): Promise<void> {
  const resolvedDifficulty = difficulty || 'medium';
  const payload = {
    user_id: userId,
    game_id: gameId,
    score,
    difficulty: resolvedDifficulty,
    duration_seconds: durationSeconds,
    metadata: meta,
  };
  console.log('[GamePlay] saving to Supabase:', payload);
  const { error } = await supabase.from('game_plays').insert(payload);
  if (error) log('insertGamePlay', error);
}

// ─── Wellness Sessions ────────────────────────────────────────────────────

export async function insertWellnessSession(
  userId: string,
  sessionType: string,
  contentId: string,
  contentTitle: string,
  durationSeconds: number,
): Promise<void> {
  const { error } = await supabase.from('wellness_sessions').insert({
    user_id: userId,
    session_type: sessionType,
    content_id: contentId,
    content_title: contentTitle,
    duration_seconds: durationSeconds,
  });
  if (error) log('insertWellnessSession', error);
}

// ─── Celebrated Milestones ────────────────────────────────────────────────

export async function fetchCelebratedMilestones(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('celebrated_milestones')
    .select('milestone_id')
    .eq('user_id', userId);
  if (error) { log('fetchMilestones', error); return []; }
  return (data ?? []).map((r: any) => r.milestone_id as string);
}

export async function insertMilestone(userId: string, milestoneId: string): Promise<void> {
  const { error } = await supabase.from('celebrated_milestones').upsert(
    { user_id: userId, milestone_id: milestoneId },
    { onConflict: 'user_id,milestone_id' },
  );
  if (error) log('insertMilestone', error);
}

// ─── Activity Logs ────────────────────────────────────────────────────────

export async function fetchActivityLogs(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { log('fetchActivityLogs', error); return []; }
  return (data ?? []).map((r: any) => r.date as string);
}

export async function upsertActivityLog(userId: string, date: string): Promise<void> {
  const { error } = await supabase.from('activity_logs').upsert(
    { user_id: userId, date },
    { onConflict: 'user_id,date' },
  );
  if (error) log('upsertActivityLog', error);
}

// ─── User Playlists ───────────────────────────────────────────────────────

export interface PlaylistRow {
  id: string;
  name: string;
  track_ids: string[];
}

export async function fetchPlaylists(userId: string): Promise<PlaylistRow[]> {
  const { data, error } = await supabase
    .from('user_playlists')
    .select('id, name, track_ids')
    .eq('user_id', userId)
    .order('id');
  if (error) { log('fetchPlaylists', error); return []; }
  return (data ?? []) as PlaylistRow[];
}

export async function upsertPlaylist(userId: string, id: string, name: string, trackIds: string[]): Promise<void> {
  const { error } = await supabase.from('user_playlists').upsert(
    { id, user_id: userId, name, track_ids: trackIds },
    { onConflict: 'id' },
  );
  if (error) log('upsertPlaylist', error);
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const { error } = await supabase.from('user_playlists').delete().eq('id', playlistId);
  if (error) log('deletePlaylist', error);
}
