import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';
import { TOPICS, getDailyTopic } from '@/data/deep_dive_topics';

export default function TopicsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { startSession } = useDeepDive();
  const daily = getDailyTopic();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  function handleSelect(topic: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startSession(topic);
    router.push('/deep-dive/read');
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.title, { color: C.text }]}>All Topics</Text>
        <View style={{ width: 38 }} />
      </View>
      <FlatList
        data={TOPICS}
        keyExtractor={t => t.name}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: topic, index }) => {
          const isDaily = topic.name === daily.name;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: C.card, borderColor: isDaily ? C.lavender + '60' : C.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => handleSelect(topic)}
            >
              <View style={[styles.num, { backgroundColor: isDaily ? C.lavender + '20' : C.border + '40' }]}>
                <Text style={[styles.numText, { color: isDaily ? C.lavender : C.textMuted }]}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>
              <Text style={styles.icon}>{topic.icon}</Text>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={[styles.name, { color: C.text }]}>{topic.name}</Text>
                  {isDaily && (
                    <View style={[styles.todayBadge, { backgroundColor: C.gold + '20' }]}>
                      <Text style={[styles.todayText, { color: C.gold }]}>Today</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.domain, { color: C.textSub }]}>{topic.domain}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  num: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  domain: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  todayBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100,
  },
  todayText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
