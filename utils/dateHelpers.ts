export function formatEntryDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEntryDateShort(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function toDateStr(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function formatNewEntryDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function readingTime(text: string): string {
  const wpm = 200;
  const words = wordCount(text);
  if (words < wpm) return 'under 1 min';
  const mins = Math.round(words / wpm);
  return `${mins} min read`;
}
