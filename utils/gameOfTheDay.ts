import GAMES from '@/constants/games';

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getGameOfTheDay(): string {
  const dateStr = getTodayDateString();
  const hash = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % GAMES.length;
  return GAMES[index].id;
}
