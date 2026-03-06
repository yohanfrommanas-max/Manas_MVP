import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  TextInput, FlatList, Image,
} from 'react-native';
const LOGO = require('@/assets/logo.png');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import C from '@/constants/colors';
import GAMES from '@/constants/games';

const BREATHE_SESSIONS = [
  { id: 'box', name: 'Box Breathing', desc: '4-4-4-4 pattern for stress relief', icon: 'square-outline', color: C.sage, duration: '5 min' },
  { id: '478', name: '4-7-8 Technique', desc: 'Calm your nervous system quickly', icon: 'moon', color: '#818CF8', duration: '4 min' },
  { id: 'deep', name: 'Deep Calm', desc: 'Slow, elongated breaths for deep relaxation', icon: 'leaf', color: C.sage, duration: '10 min' },
  { id: 'energize', name: 'Energize', desc: 'Quick breath cycles to boost energy', icon: 'flash', color: C.gold, duration: '3 min' },
  { id: 'sigh', name: 'Physiological Sigh', desc: 'Double inhale for instant calm', icon: 'sync', color: C.mauve, duration: '2 min' },
];

const SLEEP_SOUNDS = [
  { id: 'rain', name: 'Rain', icon: 'rainy', color: '#7DD3FC' },
  { id: 'ocean', name: 'Ocean', icon: 'water', color: '#38BDF8' },
  { id: 'white-noise', name: 'White Noise', icon: 'radio', color: C.textSub },
  { id: 'forest', name: 'Forest', icon: 'leaf', color: C.sage },
  { id: 'brown-noise', name: 'Brown Noise', icon: 'volume-high', color: '#A16207' },
  { id: 'bowls', name: 'Tibetan Bowls', icon: 'musical-notes', color: C.mauve },
];

const PLAYLISTS = [
  { id: 'focus', name: 'Focus Flow', desc: 'Deep concentration', icon: 'headset', color: C.lavender },
  { id: 'morning', name: 'Morning Rise', desc: 'Gentle start to your day', icon: 'sunny', color: C.gold },
  { id: 'rest', name: 'Deep Rest', desc: 'Unwind and release', icon: 'moon', color: '#818CF8' },
  { id: 'anxiety', name: 'Anxiety Relief', desc: 'Soothing tones to calm', icon: 'heart', color: C.sage },
  { id: 'creative', name: 'Creative Mode', desc: 'Fuel your inspiration', icon: 'color-palette', color: C.rose },
  { id: 'golden', name: 'Golden Hour', desc: 'Warm, reflective vibes', icon: 'sparkles', color: C.gold },
];

interface RecommendationItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
  params?: Record<string, string>;
}

const GOAL_RECOMMENDATIONS: Record<string, RecommendationItem[]> = {
  Sleep: [
    { id: 'rain', title: 'Rain Sounds', subtitle: 'Sleep · Ambient', icon: 'rainy', color: '#7DD3FC', route: '/sleep' },
    { id: 'rest', title: 'Deep Rest', subtitle: 'Music · Playlist', icon: 'moon', color: '#818CF8', route: '/music' },
    { id: 'box', title: 'Box Breathing', subtitle: 'Breathe · 5 min', icon: 'square-outline', color: C.sage, route: '/breathe/[id]', params: { id: 'box' } },
  ],
  Stress: [
    { id: 'ocean', title: 'Ocean Waves', subtitle: 'Sleep · Ambient', icon: 'water', color: '#38BDF8', route: '/sleep' },
    { id: '478', title: '4-7-8 Breathing', subtitle: 'Breathe · 4 min', icon: 'moon', color: '#818CF8', route: '/breathe/[id]', params: { id: '478' } },
    { id: 'focus-anchor', title: 'Focus Anchor', subtitle: 'Game · Focus', icon: 'locate', color: C.lavender, route: '/game/[id]', params: { id: 'focus-anchor' } },
  ],
  Focus: [
    { id: 'focus', title: 'Focus Flow', subtitle: 'Music · Playlist', icon: 'headset', color: C.lavender, route: '/music' },
    { id: 'signal-spotter', title: 'Signal Spotter', subtitle: 'Game · Focus', icon: 'radio', color: '#818CF8', route: '/game/[id]', params: { id: 'signal-spotter' } },
    { id: 'time-lock', title: 'Time Lock', subtitle: 'Game · Speed', icon: 'time', color: C.gold, route: '/game/[id]', params: { id: 'time-lock' } },
  ],
  Anxiety: [
    { id: 'anxiety', title: 'Anxiety Relief', subtitle: 'Music · Playlist', icon: 'heart', color: C.sage, route: '/music' },
    { id: 'sigh', title: 'Physiological Sigh', subtitle: 'Breathe · 2 min', icon: 'sync', color: C.mauve, route: '/breathe/[id]', params: { id: 'sigh' } },
    { id: 'bowls', title: 'Tibetan Bowls', subtitle: 'Sleep · Ambient', icon: 'musical-notes', color: C.mauve, route: '/sleep' },
  ],
  'Self-Growth': [
    { id: 'story-recall', title: 'Story Recall', subtitle: 'Game · Memory', icon: 'book', color: C.lavender, route: '/game/[id]', params: { id: 'story-recall' } },
    { id: 'code-cracker', title: 'Code Cracker', subtitle: 'Game · Logic', icon: 'key', color: C.sage, route: '/game/[id]', params: { id: 'code-cracker' } },
    { id: 'journal-fw', title: 'Free Write', subtitle: 'Journal · Reflect', icon: 'journal', color: C.rose, route: '/journal' },
  ],
  Creativity: [
    { id: 'creative', title: 'Creative Mode', subtitle: 'Music · Playlist', icon: 'color-palette', color: C.rose, route: '/music' },
    { id: 'detectives-notebook', title: "Detective's Notebook", subtitle: 'Game · Logic', icon: 'search', color: C.lavender, route: '/game/[id]', params: { id: 'detectives-notebook' } },
    { id: 'beat-recall', title: 'Beat Recall', subtitle: 'Game · Memory', icon: 'musical-note', color: C.gold, route: '/game/[id]', params: { id: 'beat-recall' } },
  ],
};

const GAME_CATEGORIES = ['All', 'Memory', 'Focus', 'Speed', 'Logic'] as const;
type GCat = typeof GAME_CATEGORIES[number];

function ForYouSection({ goals }: { goals: string[] }) {
  if (!goals || goals.length === 0) {
    return (
      <Pressable
        style={forYouStyles.emptyCard}
        onPress={() => router.push('/(tabs)/profile' as any)}
      >
        <LinearGradient colors={[C.lavender + '18', C.wisteria + '10']} style={StyleSheet.absoluteFill} />
        <View style={forYouStyles.emptyIcon}>
          <Ionicons name="person-circle-outline" size={22} color={C.lavender} />
        </View>
        <View style={forYouStyles.emptyText}>
          <Text style={forYouStyles.emptyTitle}>Personalise your feed</Text>
          <Text style={forYouStyles.emptySub}>Finish your profile to get tailored picks</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </Pressable>
    );
  }

  const recs: RecommendationItem[] = [];
  const seen = new Set<string>();
  for (const goal of goals) {
    const items = GOAL_RECOMMENDATIONS[goal] ?? [];
    for (const item of items) {
      if (!seen.has(item.id) && recs.length < 6) {
        seen.add(item.id);
        recs.push(item);
      }
    }
  }

  return (
    <FlatList
      data={recs}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={r => r.id}
      contentContainerStyle={forYouStyles.list}
      scrollEnabled
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [forYouStyles.card, pressed && { opacity: 0.85 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (item.params) {
              router.push({ pathname: item.route as any, params: item.params });
            } else {
              router.push(item.route as any);
            }
          }}
        >
          <LinearGradient
            colors={[item.color + '22', item.color + '0A', C.card]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[forYouStyles.cardIcon, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon as any} size={22} color={item.color} />
          </View>
          <Text style={forYouStyles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={forYouStyles.cardSub}>{item.subtitle}</Text>
        </Pressable>
      )}
    />
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { toggleFavourite, isFavourite, user } = useApp();
  const [search, setSearch] = useState('');
  const [gameCat, setGameCat] = useState<GCat>('All');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const filteredGames = GAMES.filter(g =>
    (gameCat === 'All' || g.category === gameCat) &&
    (search === '' || g.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 8, paddingBottom: botInset + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image source={LOGO} style={styles.logoGrad} />
          <Text style={styles.screenTitle}>Explore</Text>
        </View>
      </View>

      {/* For You */}
      <View style={styles.sectionHeader}>
        <Ionicons name="sparkles" size={16} color={C.wisteria} />
        <Text style={styles.sectionTitle}>For You</Text>
      </View>
      <ForYouSection goals={user?.goals ?? []} />

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search games, sounds, prompts..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          selectionColor={C.lavender}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Featured Today */}
      <View style={styles.featuredCard}>
        <LinearGradient colors={[C.gamePurple, C.gamePurple2]} style={StyleSheet.absoluteFill} />
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={C.gold} />
            <Text style={styles.featuredBadgeText}>Featured Today</Text>
          </View>
          <Text style={styles.featuredTitle}>Code Cracker</Text>
          <Text style={styles.featuredDesc}>Exercise your deductive reasoning with this cerebral challenge</Text>
          <Pressable style={styles.featuredBtn} onPress={() => router.push({ pathname: '/game/[id]', params: { id: 'code-cracker' } })}>
            <Text style={styles.featuredBtnText}>Play Now</Text>
            <Ionicons name="arrow-forward" size={14} color={C.bg} />
          </Pressable>
        </View>
      </View>

      {/* Brain Training Games */}
      <View style={styles.sectionHeader}>
        <Ionicons name="flash" size={16} color={C.lavender} />
        <Text style={styles.sectionTitle}>Brain Training Games</Text>
      </View>
      <FlatList
        data={GAME_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
        renderItem={({ item: c }) => (
          <Pressable
            style={[styles.catPill, gameCat === c && { backgroundColor: C.lavender + '25', borderColor: C.lavender }]}
            onPress={() => setGameCat(c)}
          >
            <Text style={[styles.catText, { color: gameCat === c ? C.lavender : C.textSub }]}>{c}</Text>
          </Pressable>
        )}
        scrollEnabled
      />
      {filteredGames.map(g => (
        <Pressable
          key={g.id}
          style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.8 }]}
          onPress={() => router.push({ pathname: '/game/[id]', params: { id: g.id } })}
        >
          <View style={[styles.rowIcon, { backgroundColor: g.color + '20' }]}>
            <Ionicons name={g.icon as any} size={20} color={g.color} />
          </View>
          <View style={styles.rowInfo}>
            <View style={styles.rowTitleRow}>
              <Text style={styles.rowTitle}>{g.name}</Text>
              {g.premium && <Ionicons name="star" size={12} color={C.gold} />}
            </View>
            <Text style={styles.rowSub}>{g.cognitiveArea} · {g.duration}</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => { toggleFavourite({ id: g.id, type: 'game', title: g.name, color: g.color, icon: g.icon, category: g.category }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name={isFavourite(g.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={isFavourite(g.id) ? C.gold : C.textMuted} />
          </Pressable>
        </Pressable>
      ))}

      {/* Breathe Sessions */}
      <View style={styles.sectionHeader}>
        <Ionicons name="leaf" size={16} color={C.sage} />
        <Text style={styles.sectionTitle}>Breathe Sessions</Text>
      </View>
      {BREATHE_SESSIONS.map(s => (
        <Pressable
          key={s.id}
          style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.8 }]}
          onPress={() => router.push({ pathname: '/breathe/[id]', params: { id: s.id } })}
        >
          <View style={[styles.rowIcon, { backgroundColor: s.color + '20' }]}>
            <Ionicons name={s.icon as any} size={20} color={s.color} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{s.name}</Text>
            <Text style={styles.rowSub}>{s.desc} · {s.duration}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => { toggleFavourite({ id: s.id, type: 'breathe', title: s.name, color: s.color, icon: s.icon }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Ionicons name={isFavourite(s.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={isFavourite(s.id) ? C.gold : C.textMuted} />
          </Pressable>
        </Pressable>
      ))}

      {/* Sleep Library */}
      <View style={styles.sectionHeader}>
        <Ionicons name="moon" size={16} color={'#818CF8'} />
        <Text style={styles.sectionTitle}>Sleep Library</Text>
      </View>
      <FlatList
        data={SLEEP_SOUNDS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item: s }) => (
          <Pressable style={[styles.soundChip, { borderColor: s.color + '40' }]} onPress={() => router.push('/sleep' as any)}>
            <Ionicons name={s.icon as any} size={18} color={s.color} />
            <Text style={[styles.soundChipText, { color: s.color }]}>{s.name}</Text>
          </Pressable>
        )}
        scrollEnabled
      />

      {/* Music Playlists */}
      <View style={styles.sectionHeader}>
        <Ionicons name="musical-notes" size={16} color={C.gold} />
        <Text style={styles.sectionTitle}>Music Playlists</Text>
      </View>
      {PLAYLISTS.map(pl => (
        <Pressable
          key={pl.id}
          style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/music' as any)}
        >
          <View style={[styles.rowIcon, { backgroundColor: pl.color + '20' }]}>
            <Ionicons name={pl.icon as any} size={20} color={pl.color} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{pl.name}</Text>
            <Text style={styles.rowSub}>{pl.desc}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => { toggleFavourite({ id: pl.id, type: 'music', title: pl.name, color: pl.color, icon: pl.icon }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Ionicons name={isFavourite(pl.id) ? 'bookmark' : 'bookmark-outline'} size={18} color={isFavourite(pl.id) ? C.gold : C.textMuted} />
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const forYouStyles = StyleSheet.create({
  list: { gap: 12, paddingBottom: 16, paddingHorizontal: 0 },
  card: {
    width: 130, borderRadius: 18, padding: 14, gap: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.text, lineHeight: 18 },
  cardSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  emptyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.lavender + '30', overflow: 'hidden',
    marginBottom: 16,
  },
  emptyIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.lavender + '15', alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { flex: 1, gap: 3 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.text },
  emptySub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { gap: 4, paddingHorizontal: 20 },
  header: { paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: { width: 28, height: 28, borderRadius: 10, overflow: 'hidden' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text },
  featuredCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  featuredContent: { padding: 20, gap: 10 },
  featuredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: C.gold + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  featuredBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.gold },
  featuredTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: C.text },
  featuredDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, lineHeight: 22 },
  featuredBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: C.lavender, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginTop: 4,
  },
  featuredBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.bg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.text },
  catScroll: { flexGrow: 0, marginBottom: 12 },
  catContent: { gap: 8 },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  catText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: 3 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  rowSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textSub },
  chipRow: { gap: 10, paddingBottom: 16 },
  soundChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100,
    borderWidth: 1, backgroundColor: C.card,
  },
  soundChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
