import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, FlatList, Image, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
const LOGO = require('@/assets/logo.png');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';
import GAMES from '@/constants/games';
import MilestoneCelebration from '@/components/MilestoneCelebration';

const MOODS = [
  { icon: 'thunderstorm', value: 1, color: '#94A3B8' },
  { icon: 'cloudy', value: 2, color: '#7DD3FC' },
  { icon: 'partly-sunny', value: 3, color: '#FDE68A' },
  { icon: 'sunny', value: 4, color: '#FCD34D' },
  { icon: 'happy', value: 5, color: C.gold },
];

const QUOTES = [
  "The mind is like water. When it's turbulent, it's difficult to see. When it's calm, everything becomes clear.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.",
  "The present moment is the only moment available to us, and it is the door to all moments.",
  "Breathe. You're going to be okay. You have always survived your hardest days.",
];

const CALM_TOOLS = [
  { id: 'breathe', title: 'Breathe', subtitle: 'Guided breathwork', icon: 'leaf', color: C.sage, bg: '#0D2A1F', route: '/breathe/box' as const },
  { id: 'sleep', title: 'Sleep', subtitle: 'Sounds for deep rest', icon: 'moon', color: '#818CF8', bg: '#1A1B4B', route: '/sleep' as const },
  { id: 'music', title: 'Music', subtitle: 'Curated for your mood', icon: 'musical-notes', color: C.gold, bg: '#2A1A00', route: '/music' as const },
  { id: 'journal', title: 'Journal', subtitle: 'Reflect, release, grow', icon: 'journal', color: C.rose, bg: '#2A0D1A', route: '/journal' as const },
];

const STREAK_MILESTONES = [3, 7, 14, 30];

function MoodButton({ mood, selected, onPress }: {
  mood: typeof MOODS[0]; selected: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    scale.value = withSpring(0.85, {}, () => { scale.value = withSpring(1); });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  return (
    <Pressable style={{ flex: 1 }} onPress={handlePress}>
      <Reanimated.View style={[styles.moodBtn, selected && { backgroundColor: mood.color + '25', borderColor: mood.color }, style]}>
        <Ionicons name={mood.icon as any} size={26} color={selected ? mood.color : C.textSub} />
      </Reanimated.View>
    </Pressable>
  );
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const { toggleFavourite, isFavourite } = useApp();
  const fav = isFavourite(game.id);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Reanimated.View style={[styles.gameCard, style]}>
        <LinearGradient
          colors={[game.color + '25', game.color + '10', C.card]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.gameCardTop}>
          <View style={[styles.gameIconWrap, { backgroundColor: game.color + '20' }]}>
            <Ionicons name={game.icon as any} size={22} color={game.color} />
          </View>
          <Pressable
            onPress={() => { toggleFavourite({ id: game.id, type: 'game', title: game.name, category: game.category, color: game.color, icon: game.icon }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={8}
          >
            <Ionicons name={fav ? 'bookmark' : 'bookmark-outline'} size={18} color={fav ? C.gold : C.textMuted} />
          </Pressable>
        </View>
        {game.premium && (
          <View style={styles.crownBadge}>
            <Ionicons name="star" size={8} color={C.gold} />
          </View>
        )}
        <Text style={styles.gameName}>{game.name}</Text>
        <View style={styles.gameTagRow}>
          <View style={[styles.categoryTag, { backgroundColor: game.color + '20' }]}>
            <Text style={[styles.categoryTagText, { color: game.color }]}>{game.category}</Text>
          </View>
          <Text style={styles.gameDiff}>{game.difficulty}</Text>
        </View>
        <Pressable
          style={[styles.playBtn, { backgroundColor: game.color }]}
          onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
        >
          <Text style={styles.playBtnText}>Play</Text>
          <Ionicons name="play" size={12} color={C.bg} />
        </Pressable>
      </Reanimated.View>
    </Pressable>
  );
}

function NotificationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={notifStyles.overlay} onPress={onClose}>
        <View style={[notifStyles.sheet, { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}>
          <LinearGradient colors={['#1A1035', C.bg2]} style={StyleSheet.absoluteFill} />
          <View style={notifStyles.handle} />
          <View style={notifStyles.headerRow}>
            <Text style={notifStyles.title}>Notifications</Text>
            <Pressable style={notifStyles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={C.textSub} />
            </Pressable>
          </View>
          <View style={notifStyles.emptyState}>
            <View style={notifStyles.emptyOrb}>
              <Ionicons name="notifications-outline" size={32} color={C.lavender} />
            </View>
            <Text style={notifStyles.emptyTitle}>You're all caught up</Text>
            <Text style={notifStyles.emptySub}>Daily reminders help build lasting habits. Set one in your profile.</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    user, todaysMood, logMood, streak, moodLogs, favourites,
    toggleFavourite, isFavourite, celebratedMilestones, addCelebratedMilestone,
    journalEntries, gameStats, wellnessMinutes,
  } = useApp();
  const [notifVisible, setNotifVisible] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const prevStreakRef = useRef(streak);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const quoteIdx = new Date().getDay() % QUOTES.length;
  const todayStr = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!streak) return;
    const milestoneId = `streak-${streak}`;
    if (
      STREAK_MILESTONES.includes(streak) &&
      !celebratedMilestones.includes(milestoneId) &&
      prevStreakRef.current !== streak
    ) {
      setActiveMilestone(milestoneId);
    }
    prevStreakRef.current = streak;
  }, [streak]);

  useEffect(() => {
    const totalGamesPlayed = gameStats.reduce((a, s) => a + s.plays, 0);
    const badgeChecks = [
      { id: 'first-game', condition: totalGamesPlayed > 0 },
      { id: 'journal-3', condition: journalEntries.length >= 3 },
      { id: 'mindful', condition: wellnessMinutes > 0 },
    ];
    for (const { id, condition } of badgeChecks) {
      if (condition && !celebratedMilestones.includes(id)) {
        setActiveMilestone(id);
        break;
      }
    }
  }, [gameStats, journalEntries, wellnessMinutes]);

  const handleMilestoneDismiss = () => {
    if (activeMilestone) addCelebratedMilestone(activeMilestone);
    setActiveMilestone(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.hero, { paddingTop: topInset + 12 }]}>
          <LinearGradient
            colors={[C.wisteria + '38', C.mauve + '18', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
          />

          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <View style={styles.logoRow}>
              <Image source={LOGO} style={styles.logoImg} />
              <Text style={styles.logoText}>manas</Text>
            </View>
            <Pressable
              style={styles.notifBtn}
              onPress={() => { setNotifVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Ionicons name="notifications-outline" size={22} color={C.textSub} />
            </Pressable>
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>{greeting}{user?.name ? ',' : ''}</Text>
          {user?.name ? <Text style={styles.greetingName}>{user.name}</Text> : null}

          {/* Meta row */}
          <View style={styles.heroMeta}>
            <View style={styles.streakPill}>
              <Ionicons name="flame" size={13} color={C.gold} />
              <Text style={styles.streakPillText}>{streak} day{streak !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.streakDots}>
              {weekDays.map(d => {
                const hasLog = moodLogs.some(l => l.date === d);
                const isToday = d === new Date().toISOString().split('T')[0];
                return <View key={d} style={[styles.streakDot, hasLog && styles.streakDotLogged, isToday && styles.streakDotToday]} />;
              })}
            </View>
            <Text style={styles.dateText}>{todayStr}</Text>
          </View>

          {/* Mood check-in */}
          <View style={styles.moodBlock}>
            <View style={styles.moodLabelRow}>
              <Text style={styles.moodCaption}>
                {todaysMood ? 'Feeling logged' : 'How are you feeling?'}
              </Text>
              {todaysMood && (
                <View style={[styles.loggedBadge, { backgroundColor: C.sage + '20' }]}>
                  <Text style={[styles.loggedText, { color: C.sage }]}>Logged</Text>
                </View>
              )}
            </View>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <MoodButton key={m.value} mood={m} selected={todaysMood === m.value} onPress={() => logMood(m.value)} />
              ))}
            </View>
          </View>
        </View>

        {/* Daily Intention */}
        <View style={styles.intentionCard}>
          <View style={[styles.intentionBar, { backgroundColor: C.lavender }]} />
          <Text style={styles.intentionText}>{QUOTES[quoteIdx]}</Text>
        </View>

        {/* Brain Training */}
        <View style={[styles.section, styles.brainSection]}>
          <LinearGradient
            colors={[C.gamePurple, C.gamePurple2, '#1E1533']}
            style={styles.sectionGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: C.lavender }]} />
              <Text style={styles.sectionTitle}>Brain Training</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Your daily mental workout</Text>
            <FlatList
              data={GAMES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={g => g.id}
              renderItem={({ item }) => <GameCard game={item} />}
              contentContainerStyle={styles.gamesList}
              scrollEnabled={!!GAMES.length}
            />
          </View>
        </View>

        {/* Calm Tools */}
        <View style={styles.section}>
          <View style={styles.sectionInner}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: C.sage }]} />
              <Text style={styles.sectionTitle}>Calm Tools</Text>
            </View>
            <View style={styles.calmGrid}>
              {CALM_TOOLS.map(tool => {
                const fav = isFavourite(tool.id);
                return (
                  <Pressable
                    key={tool.id}
                    style={({ pressed }) => [styles.calmCard, pressed && { opacity: 0.85 }]}
                    onPress={() => router.push(tool.route as any)}
                  >
                    <LinearGradient colors={[tool.bg, tool.bg + '80', C.card]} style={StyleSheet.absoluteFill} />
                    <Pressable
                      onPress={() => toggleFavourite({ id: tool.id, type: tool.id as any, title: tool.title, color: tool.color, icon: tool.icon })}
                      style={styles.calmFav}
                      hitSlop={8}
                    >
                      <Ionicons name={fav ? 'bookmark' : 'bookmark-outline'} size={16} color={fav ? C.gold : C.textMuted} />
                    </Pressable>
                    <View style={[styles.calmIconWrap, { backgroundColor: tool.color + '20' }]}>
                      <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                    </View>
                    <Text style={styles.calmTitle}>{tool.title}</Text>
                    <Text style={styles.calmSub}>{tool.subtitle}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <NotificationModal visible={notifVisible} onClose={() => setNotifVisible(false)} />
      <MilestoneCelebration milestone={activeMilestone} onDismiss={handleMilestoneDismiss} />
    </View>
  );
}

const notifStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, gap: 20, overflow: 'hidden',
    borderTopWidth: 1, borderColor: C.lavender + '30', backgroundColor: C.bg2,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.lavender + '15', borderWidth: 1, borderColor: C.lavender + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { gap: 16, paddingHorizontal: 0 },

  hero: {
    paddingHorizontal: 20, paddingBottom: 22, gap: 0,
    overflow: 'hidden',
  },
  heroTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 28, height: 28, borderRadius: 10 },
  logoText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.5 },
  notifBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },

  greeting: { fontSize: 28, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 34 },
  greetingName: { fontSize: 32, fontFamily: 'Inter_700Bold', color: C.text, letterSpacing: -0.5, marginBottom: 14 },

  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.gold + '18', borderWidth: 1, borderColor: C.gold + '35',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  streakPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.gold },
  streakDots: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center' },
  streakDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  streakDotLogged: { backgroundColor: C.gold + 'AA' },
  streakDotToday: { backgroundColor: C.gold },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },

  moodBlock: { gap: 10 },
  moodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodCaption: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textSub },
  loggedBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  loggedText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border,
  },

  intentionCard: {
    marginHorizontal: 16, flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', paddingVertical: 16, paddingRight: 18,
  },
  intentionBar: { width: 3, borderRadius: 2, marginRight: 14, marginLeft: 16 },
  intentionText: {
    flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub,
    lineHeight: 23, fontStyle: 'italic',
  },

  section: {
    marginHorizontal: 16, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  brainSection: { marginHorizontal: 0, borderRadius: 0, borderLeftWidth: 0, borderRightWidth: 0 },
  sectionGrad: { ...StyleSheet.absoluteFillObject },
  sectionInner: { padding: 18, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.text, flex: 1 },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub, marginTop: -8 },

  gamesList: { gap: 12, paddingRight: 18, paddingLeft: 2, paddingBottom: 4, paddingTop: 4 },
  gameCard: {
    width: 160, borderRadius: 18, padding: 16, gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  gameCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  crownBadge: {
    position: 'absolute', top: 12, right: 36,
    backgroundColor: C.gold + '30', borderRadius: 6, padding: 3,
  },
  gameName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: C.text, lineHeight: 20 },
  gameTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryTagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  gameDiff: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
  },
  playBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.bg },

  calmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  calmCard: {
    width: '47%', padding: 16, borderRadius: 18, gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  calmFav: { alignSelf: 'flex-end' },
  calmIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calmTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: C.text },
  calmSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 18 },
});
