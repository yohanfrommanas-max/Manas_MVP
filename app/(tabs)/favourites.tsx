import { Image } from 'react-native';
const LOGO = require('@/assets/logo.png');
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useApp, FavouriteItem } from '@/context/AppContext';
import C from '@/constants/colors';

const FILTERS = ['All', 'Games', 'Breathe', 'Sleep', 'Music', 'Journal'] as const;
type Filter = typeof FILTERS[number];

const TYPE_MAP: Record<Filter, string | null> = {
  All: null,
  Games: 'game',
  Breathe: 'breathe',
  Sleep: 'sleep',
  Music: 'music',
  Journal: 'journal',
};

const ROUTE_MAP: Record<string, (item: FavouriteItem) => void> = {
  game: (item) => router.push({ pathname: '/game/[id]', params: { id: item.id } }),
  breathe: (item) => router.push({ pathname: '/breathe/[id]', params: { id: item.id } }),
  sleep: () => router.push('/sleep' as any),
  music: () => router.push('/music' as any),
  journal: () => router.push('/journal' as any),
};

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const { favourites, toggleFavourite } = useApp();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = activeFilter === 'All'
    ? favourites
    : favourites.filter(f => f.type === TYPE_MAP[activeFilter]);

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { game: 'Game', breathe: 'Breathe', sleep: 'Sleep', music: 'Music', journal: 'Journal' };
    return map[type] || type;
  };

  const renderItem = ({ item }: { item: FavouriteItem }) => (
    <Pressable
      style={({ pressed }) => [styles.favCard, pressed && { opacity: 0.8 }]}
      onPress={() => ROUTE_MAP[item.type]?.(item)}
    >
      <View style={[styles.favIconWrap, { backgroundColor: (item.color || C.lavender) + '20' }]}>
        <Ionicons name={(item.icon as any) || 'star'} size={22} color={item.color || C.lavender} />
      </View>
      <View style={styles.favInfo}>
        <Text style={styles.favTitle}>{item.title}</Text>
        <View style={[styles.favTag, { backgroundColor: (item.color || C.lavender) + '20' }]}>
          <Text style={[styles.favTagText, { color: item.color || C.lavender }]}>{getTypeLabel(item.type)}</Text>
        </View>
      </View>
      <View style={styles.favActions}>
        <Pressable
          style={styles.removeBtn}
          onPress={() => { toggleFavourite(item); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          hitSlop={8}
        >
          <Ionicons name="bookmark" size={18} color={C.gold} />
        </Pressable>
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Image source={LOGO} style={styles.logoGrad} />
          <Text style={styles.screenTitle}>Favourites</Text>
        </View>
        <Text style={styles.countText}>{filtered.length} saved</Text>
      </View>

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
        keyExtractor={f => f}
        renderItem={({ item: f }) => (
          <Pressable
            style={[styles.filterPill, activeFilter === f && { backgroundColor: C.gold + '25', borderColor: C.gold }]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, { color: activeFilter === f ? C.gold : C.textSub }]}>{f}</Text>
          </Pressable>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id + item.type}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: botInset + 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyOrb}>
              <Ionicons name="star-outline" size={40} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Save what moves you</Text>
            <Text style={styles.emptySub}>Bookmark games, sounds, and journal prompts from anywhere in the app</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoGrad: { width: 28, height: 28, borderRadius: 10, overflow: 'hidden' },
  screenTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text },
  countText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textSub },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },
  favCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  favIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  favInfo: { flex: 1, gap: 6 },
  favTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  favTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  favTagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  favActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: { padding: 4 },
  separator: { height: 10 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 80, paddingHorizontal: 32 },
  emptyOrb: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: C.text },
  emptySub: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 22 },
});
