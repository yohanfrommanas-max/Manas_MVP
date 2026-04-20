import GAMES from '@/constants/games';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Mulberry32 — fast deterministic seeded PRNG
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface LightUserProfile {
  plan?: 'free' | 'premium';
  goals?: string[];
  sharpness?: string | null;
  endOfDay?: string | null;
}

interface LightGameStat {
  gameId: string;
  lastPlayed?: string;
}

/**
 * Compute today's recommended game using a seeded weighted algorithm.
 *
 * The seed is deterministic per day (same result for all calls on the same day)
 * so the result is stable. Personalization signals shift the weights without
 * breaking the day-level stability guarantee.
 */
export function computeSmartGOTD(
  user?: LightUserProfile | null,
  gameStats?: LightGameStat[],
): string {
  const today = getTodayDateString();
  const dateSeed = today.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = mulberry32(dateSeed);

  const isPremium = user?.plan === 'premium';
  const eligible = GAMES.filter(g => (!g.premium || isPremium) && !g.customRoute);

  const goals = (user?.goals ?? []).map(g => g.toLowerCase());
  const sharpness = user?.sharpness ?? null;
  const endOfDay = user?.endOfDay ?? null;

  const goalCategoryMap: Record<string, string[]> = {
    focus:       ['Focus'],
    attention:   ['Focus'],
    anxiety:     ['Focus'],
    sleep:       ['Memory', 'Focus'],
    memory:      ['Memory'],
    logic:       ['Logic'],
    productivity:['Logic', 'Speed'],
    clarity:     ['Memory', 'Logic'],
    speed:       ['Speed'],
  };

  const weights = eligible.map(g => {
    let w = 10;

    // ── Goal alignment ───────────────────────────────────────────────────
    for (const goal of goals) {
      for (const [keyword, cats] of Object.entries(goalCategoryMap)) {
        if (goal.includes(keyword) && cats.includes(g.category)) {
          w += 4;
        }
      }
    }

    // ── Sharpness alignment ──────────────────────────────────────────────
    if (sharpness === 'lost' || sharpness === 'never') {
      if (g.difficulty === 'Easy')   w += 4;
      if (g.difficulty === 'Hard')   w -= 4;
    } else if (sharpness === 'fading') {
      if (g.difficulty === 'Easy')   w += 2;
      if (g.difficulty === 'Hard')   w -= 2;
    } else if (sharpness === 'recent') {
      if (g.difficulty === 'Hard')   w += 3;
      if (g.difficulty === 'Easy')   w -= 1;
    }

    // ── End-of-day state ─────────────────────────────────────────────────
    if (endOfDay === 'depleted' || endOfDay === 'numb') {
      if (g.difficulty === 'Easy')   w += 3;
      if (g.difficulty === 'Hard')   w -= 3;
    } else if (endOfDay === 'wired') {
      if (g.category === 'Focus')    w += 3;
    } else if (endOfDay === 'scattered') {
      if (g.category === 'Focus')    w += 2;
    }

    // ── Recency penalty — avoid games played in the last 7 days ─────────
    const stat = gameStats?.find(s => s.gameId === g.id);
    if (stat?.lastPlayed) {
      const msAgo = new Date(today).getTime() - new Date(stat.lastPlayed).getTime();
      const daysAgo = msAgo / 86400000;
      if (daysAgo < 1)  w -= 9; // played today → strongly avoid
      if (daysAgo < 2)  w -= 5; // yesterday → avoid
      if (daysAgo < 4)  w -= 2; // recent
    }

    return { id: g.id, w: Math.max(1, w) };
  });

  // Weighted pick with seeded RNG
  const total = weights.reduce((s, x) => s + x.w, 0);
  let pick = rand() * total;
  for (const { id, w } of weights) {
    pick -= w;
    if (pick <= 0) return id;
  }
  return weights[weights.length - 1].id;
}

/** Simple date-hash fallback (used only when no user data is available yet). */
export function getGameOfTheDay(): string {
  const dateStr = getTodayDateString();
  const hash = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pool = GAMES.filter(g => !g.customRoute);
  return pool[hash % pool.length].id;
}
