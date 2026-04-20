/**
 * Replaces all dash characters in topic-derived text:
 * - Em dash (—) and en dash (–) are replaced with a space.
 * - Hyphen-minus (-) between two alphabetic characters (compound words)
 *   is replaced with a space.
 * Regular hyphens used in other contexts (e.g. negative numbers) are kept.
 */
export function sanitizeDashes(text: string): string {
  return text
    .replace(/\u2014/g, ' ')
    .replace(/\u2013/g, ' ')
    .replace(/([a-zA-Z])-([a-zA-Z])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Deep-sanitize all user-visible string fields of a topic object. */
export function sanitizeTopic<T extends Record<string, unknown>>(topic: T): T {
  const sd = sanitizeDashes;

  function sanitizeValue(v: unknown): unknown {
    if (typeof v === 'string') return sd(v);
    if (Array.isArray(v)) return v.map(sanitizeValue);
    if (v !== null && typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = sanitizeValue(val);
      }
      return out;
    }
    return v;
  }

  return sanitizeValue(topic) as T;
}
