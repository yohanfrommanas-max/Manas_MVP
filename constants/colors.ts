import { useApp } from '@/context/AppContext';

const DARK = {
  bg: '#0D0F14',
  bg2: '#12151C',
  card: '#1A1D26',
  cardAlt: '#1E2130',
  border: '#252836',
  lavender: '#A78BFA',
  lavenderDim: '#7C6BC4',
  sage: '#6EE7B7',
  gold: '#F59E0B',
  wisteria: '#969EFF',
  mauve: '#D6AEFF',
  blueFrost: '#C6F2FE',
  lightSky: '#6BCDEF',
  indigo: '#4338CA',
  rose: '#F9A8D4',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  success: '#34D399',
  error: '#F87171',
  gamePurple: '#1E1533',
  gamePurple2: '#2D1F5E',
};

const LIGHT = {
  bg: '#F5F3FF',
  bg2: '#EDE9FE',
  card: '#FFFFFF',
  cardAlt: '#F8F7FF',
  border: '#E5E2F0',
  lavender: '#7C3AED',
  lavenderDim: '#6D28D9',
  sage: '#059669',
  gold: '#D97706',
  wisteria: '#6366F1',
  mauve: '#A855F7',
  blueFrost: '#0EA5E9',
  lightSky: '#0284C7',
  indigo: '#4338CA',
  rose: '#EC4899',
  text: '#1E1B4B',
  textSub: 'rgba(30,27,75,0.6)',
  textMuted: 'rgba(30,27,75,0.35)',
  success: '#059669',
  error: '#DC2626',
  gamePurple: '#EDE9FE',
  gamePurple2: '#DDD6FE',
};

export { DARK, LIGHT };

export function useColors() {
  try {
    const { theme } = useApp();
    return theme === 'light' ? LIGHT : DARK;
  } catch {
    return DARK;
  }
}

const C = DARK;
export default C;
