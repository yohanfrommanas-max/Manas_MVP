import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Image,
} from 'react-native';
const LOGO = require('@/assets/logo.png');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';
import GAMES from '@/constants/games';

const MOOD_COLORS: Record<number, string> = {
  1: '#94A3B8', 2: '#7DD3FC', 3: '#FDE68A', 4: '#FCD34D', 5: C.gold,
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Stormy', 2: 'Cloudy', 3: 'Neutral', 4: 'Breezy', 5: 'Sunny',
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { streak, longestStreak, moodLogs, gameStats, wellnessMinutes, journalEntries } = useApp();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const log = moodLogs.find(l => l.date === dateStr);
    return { date: dateStr, mood: log?.mood ?? 0, day: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1) };
  });

  const totalGamesPlayed = gameStats.reduce((a, s) => a + s.plays, 0);
  const topGame = [...gameStats].sort((a, b) => b.bestScore - a.bestScore)[0];
  const topGameName = GAMES.find(g => g.id === topGame?.gameId)?.name ?? '—';

  const weeklyMoodAvg = last7.filter(d => d.mood > 0).reduce((a, d, _, arr) => a + d.mood / arr.length, 0);
  const avgLabel = weeklyMoodAvg === 0 ? 'No data' : MOOD_LABELS[Math.round(weeklyMoodAvg)] ?? '—';

  const totalMins = wellnessMinutes + totalGamesPlayed * 3 + journalEntries.length * 5;
  const minsBreakdown = [
    { label: 'Brain Training', mins: totalGamesPlayed * 3, color: C.lavender },
    { label: 'Breathing', mins: Math.floor(wellnessMinutes * 0.4), color: C.sage },
    { label: 'Journaling', mins: journalEntries.length * 5, color: C.gold },
  ];

  const BADGES = [
    { id: 'first-login', icon: 'star', label: 'First Step', desc: 'Opened Manas', unlocked: true },
    { id: '3-streak', icon: 'flame', label: '3-Day Streak', desc: 'Log mood 3 days in a row', unlocked: streak >= 3 },
    { id: '7-streak', icon: 'trophy', label: 'Week Strong', desc: '7-day streak', unlocked: streak >= 7 },
    { id: 'first-game', icon: 'game-controller', label: 'Game On', desc: 'Play your first brain game', unlocked: totalGamesPlayed > 0 },
    { id: 'journal-3', icon: 'journal', label: 'Reflector', desc: '3 journal entries', unlocked: journalEntries.length >= 3 },
    { id: 'mindful', icon: 'leaf', label: 'Mindful', desc: 'Complete a breathe session', unlocked: wellnessMinutes > 0 },
  ];

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: botInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image source={LOGO} style={styles.logoGrad} />
          <Text style={styles.screenTitle}>Progress</Text>
        </View>
      </View>

      {/* Streak stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: C.gold + '40' }]}>
          <LinearGradient colors={[C.gold + '15', C.card]} style={StyleSheet.absoluteFill} />
          <Ionicons name="flame" size={28} color={C.gold} />
          <Text style={styles.statNum}>{streak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { borderColor: C.lavender + '40' }]}>
          <LinearGradient colors={[C.lavender + '15', C.card]} style={StyleSheet.absoluteFill} />
          <Ionicons name="trophy" size={28} color={C.lavender} />
          <Text style={styles.statNum}>{longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={[styles.statCard, { borderColor: C.sage + '40' }]}>
          <LinearGradient colors={[C.sage + '15', C.card]} style={StyleSheet.absoluteFill} />
          <Ionicons name="time" size={28} color={C.sage} />
          <Text style={styles.statNum}>{totalMins}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
      </View>

      {/* Mood graph */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="heart" size={16} color={C.sage} />
          <Text style={styles.cardTitle}>Weekly Mood</Text>
          <View style={[styles.moodAvgBadge, { backgroundColor: C.sage + '20' }]}>
            <Text style={[styles.moodAvgText, { color: C.sage }]}>{avgLabel}</Text>
          </View>
        </View>
        <View style={styles.moodGraph}>
          {last7.map((d) => {
            const color = d.mood > 0 ? MOOD_COLORS[d.mood] : C.border;
            const height = d.mood > 0 ? (d.mood / 5) * 80 : 8;
            return (
              <View key={d.date} style={styles.moodBar}>
                <View style={styles.moodBarTrack}>
                  <View style={[styles.moodBarFill, { height, backgroundColor: color }]} />
                </View>
                <Text style={styles.moodBarDay}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Wellness minutes breakdown */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time" size={16} color={C.lavender} />
          <Text style={styles.cardTitle}>Wellness Minutes</Text>
          <Text style={[styles.moodAvgText, { color: C.lavender }]}>{totalMins}m total</Text>
        </View>
        {minsBreakdown.map(b => (
          <View key={b.label} style={styles.minsRow}>
            <Text style={[styles.minsLabel, { color: b.color }]}>{b.label}</Text>
            <View style={styles.minsBarTrack}>
              <View style={[styles.minsBarFill, { width: `${Math.min((b.mins / Math.max(totalMins, 1)) * 100, 100)}%`, backgroundColor: b.color }]} />
            </View>
            <Text style={styles.minsNum}>{b.mins}m</Text>
          </View>
        ))}
      </View>

      {/* Brain Training stats */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flash" size={16} color={C.lavender} />
          <Text style={styles.cardTitle}>Brain Training</Text>
        </View>
        <View style={styles.brainStatsRow}>
          <View style={styles.brainStat}>
            <Text style={styles.brainStatNum}>{totalGamesPlayed}</Text>
            <Text style={styles.brainStatLabel}>Games Played</Text>
          </View>
          <View style={styles.brainStatDivider} />
          <View style={styles.brainStat}>
            <Text style={styles.brainStatNum}>{topGame?.bestScore ?? 0}</Text>
            <Text style={styles.brainStatLabel}>Best Score</Text>
          </View>
          <View style={styles.brainStatDivider} />
          <View style={styles.brainStat}>
            <Text style={styles.brainStatNum} numberOfLines={1}>{topGameName.length > 8 ? topGameName.slice(0, 8) + '…' : topGameName}</Text>
            <Text style={styles.brainStatLabel}>Top Game</Text>
          </View>
        </View>
      </View>

      {/* Weekly insight */}
      <View style={[styles.card, styles.insightCard]}>
        <LinearGradient colors={[C.lavender + '20', C.mauve + '10']} style={StyleSheet.absoluteFill} />
        <Ionicons name="bulb" size={20} color={C.lavender} />
        <Text style={styles.insightText}>
          {journalEntries.length > 0
            ? `You've journaled ${journalEntries.length}x — reflection leads to growth.`
            : streak > 0
              ? `${streak}-day streak! Consistency is the foundation of a healthier mind.`
              : 'Begin your wellness journey today. Every step matters.'}
        </Text>
      </View>

      {/* Achievements */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trophy" size={16} color={C.gold} />
          <Text style={styles.cardTitle}>Achievements</Text>
          <View style={[styles.moodAvgBadge, { backgroundColor: C.gold + '20' }]}>
            <Text style={[styles.moodAvgText, { color: C.gold }]}>{unlockedCount} of {BADGES.length}</Text>
          </View>
        </View>
        <View style={styles.badgesGrid}>
          {BADGES.map(b => (
            <View key={b.id} style={[styles.badge, !b.unlocked && styles.badgeLocked]}>
              <View style={[styles.badgeIcon, { backgroundColor: b.unlocked ? C.gold + '25' : C.border }]}>
                <Ionicons name={b.icon as any} size={20} color={b.unlocked ? C.gold : C.textMuted} />
              </View>
              <Text style={[styles.badgeLabel, { color: b.unlocked ? C.text : C.textMuted }]}>{b.label}</Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { gap: 14, paddingHorizontal: 20 },
  header: { paddingBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: { width: 28, height: 28, borderRadius: 10, overflow: 'hidden' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, backgroundColor: C.card, overflow: 'hidden',
  },
  statNum: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textSub, textAlign: 'center' },
  card: {
    backgroundColor: C.card, borderRadius: 20, padding: 18, gap: 14,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, flex: 1 },
  moodAvgBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  moodAvgText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  moodGraph: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
  moodBar: { flex: 1, alignItems: 'center', gap: 6 },
  moodBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  moodBarFill: { width: '100%', borderRadius: 4, minHeight: 4 },
  moodBarDay: { fontSize: 11, fontFamily: 'Inter_500Medium', color: C.textSub },
  minsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  minsLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 100 },
  minsBarTrack: { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  minsBarFill: { height: 6, borderRadius: 3 },
  minsNum: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.textSub, width: 30, textAlign: 'right' },
  brainStatsRow: { flexDirection: 'row', alignItems: 'center' },
  brainStat: { flex: 1, alignItems: 'center', gap: 4 },
  brainStatDivider: { width: 1, height: 40, backgroundColor: C.border },
  brainStatNum: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  brainStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textSub },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  insightText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22, fontStyle: 'italic' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badge: { alignItems: 'center', gap: 4, width: '30%' },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  badgeDesc: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center', lineHeight: 14 },
});
