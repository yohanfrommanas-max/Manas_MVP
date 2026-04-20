import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
  TextInput, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TOPICS } from '@/data/deep_dive_topics';
import { useDeepDive } from '@/context/DeepDiveContext';
import { supabase } from '@/lib/supabase';

const BG    = '#0B0D12';
const SURF  = '#13151C';
const LAV   = '#A78BFA';
const CYAN  = '#22D3EE';
const AMBER = '#F59E0B';
const TEXT  = '#E8E4DC';
const SUB   = '#7A8099';
const MUTED = '#4A5068';
const BORD  = 'rgba(255,255,255,0.06)';

const ACCENTS = [
  {
    grad: ['rgba(167,139,250,0.20)', 'rgba(167,139,250,0.03)'] as const,
    chip: 'rgba(167,139,250,0.16)', chipTxt: LAV,
    cta: LAV,
  },
  {
    grad: ['rgba(34,211,238,0.17)', 'rgba(34,211,238,0.03)'] as const,
    chip: 'rgba(34,211,238,0.14)', chipTxt: CYAN,
    cta: CYAN,
  },
  {
    grad: ['rgba(245,158,11,0.17)', 'rgba(245,158,11,0.03)'] as const,
    chip: 'rgba(245,158,11,0.14)', chipTxt: AMBER,
    cta: AMBER,
  },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function primaryCat(domain: string) {
  return domain.split('·')[0].trim();
}

function subCat(domain: string) {
  return (domain.split('·')[1] ?? '').trim();
}

function getDailyTopics(topics: typeof TOPICS): typeof TOPICS {
  const d = new Date();
  let seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rng = () => {
    seed = ((seed * 1664525 + 1013904223) & 0x7fffffff);
    return seed / 0x7fffffff;
  };

  const byCat: Record<string, number[]> = {};
  topics.forEach((t, i) => {
    const cat = primaryCat(t.domain);
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(i);
  });

  const cats = Object.keys(byCat).sort(() => rng() - 0.5);
  const result: typeof TOPICS = [];
  for (const cat of cats) {
    if (result.length >= 3) break;
    const pool = byCat[cat];
    result.push(topics[pool[Math.floor(rng() * pool.length)]]);
  }
  return result;
}

export default function TopicsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const { setTopic } = useDeepDive();

  const daily = useMemo(() => getDailyTopics(TOPICS), []);

  const [expanded, setExpanded] = useState(false);
  const [input, setInput]       = useState('');
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);

  function pick(t: typeof TOPICS[0]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopic(t);
    router.push('/deep-dive/read');
  }

  async function submit() {
    const val = input.trim();
    if (!val || sending) return;
    Keyboard.dismiss();
    setSending(true);
    try {
      await supabase.from('topic_suggestions').insert({
        topic: val,
        created_at: new Date().toISOString(),
      });
    } catch (_) {}
    setSending(false);
    setSent(true);
    setInput('');
  }

  return (
    <View style={[S.root, { paddingTop: topPad }]}>
      <View style={S.nav}>
        <Pressable style={S.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={S.backArrow}>←</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={S.header}>
          <Text style={S.title}>Choose a topic</Text>
        </View>

        {daily.map((t, pos) => {
          const acc     = ACCENTS[pos];
          const preview = stripHtml(t.body).slice(0, 115) + '…';
          const cat     = primaryCat(t.domain);
          const sub     = subCat(t.domain);
          return (
            <Pressable
              key={`${t.name}-${pos}`}
              style={({ pressed }) => [S.card, pressed && S.cardPressed]}
              onPress={() => pick(t)}
            >
              <LinearGradient
                colors={[...acc.grad] as [string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={S.cardTop}>
                <Text style={S.cardEmoji}>{t.icon}</Text>
                <View style={[S.chip, { backgroundColor: acc.chip }]}>
                  <Text style={[S.chipTxt, { color: acc.chipTxt }]}>
                    {cat.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={S.cardMid}>
                <Text style={S.cardName}>{t.name}</Text>
                {sub ? <Text style={S.cardSub}>{sub}</Text> : null}
                <Text style={S.cardPreview} numberOfLines={3}>{preview}</Text>
              </View>
              <View style={S.cardFoot}>
                <Text style={[S.cardCta, { color: acc.cta }]}>Begin reading →</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Suggestion pill */}
        <View style={S.suggestWrap}>
          {!expanded && !sent && (
            <Pressable
              style={({ pressed }) => [S.suggestPill, pressed && { opacity: 0.75 }]}
              onPress={() => {
                setExpanded(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={S.suggestIco}>💡</Text>
              <Text style={S.suggestPillTxt}>Suggest a topic you'd like to learn</Text>
              <Text style={S.suggestArrow}>›</Text>
            </Pressable>
          )}

          {expanded && !sent && (
            <View style={S.suggestBox}>
              <Text style={S.suggestLabel}>What should we cover next?</Text>
              <TextInput
                style={S.suggestInput}
                placeholder="e.g. How black holes form…"
                placeholderTextColor={MUTED}
                value={input}
                onChangeText={setInput}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={submit}
                editable={!sending}
              />
              <Pressable
                style={[S.sendBtn, (!input.trim() || sending) && S.sendBtnOff]}
                onPress={submit}
                disabled={!input.trim() || sending}
              >
                <Text style={S.sendBtnTxt}>{sending ? 'Sending…' : 'Send'}</Text>
              </Pressable>
            </View>
          )}

          {sent && (
            <View style={S.sentRow}>
              <Text style={S.sentIco}>✓</Text>
              <Text style={S.sentTxt}>Thanks — we'll add it to the queue.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  nav: { paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#1A1D27', borderWidth: 1, borderColor: BORD,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  backArrow: { fontSize: 15, color: TEXT },

  scroll: { paddingHorizontal: 16, gap: 12 },

  header: { paddingBottom: 4 },
  title: {
    fontFamily: 'Lora_400Regular', fontSize: 30, color: TEXT,
    letterSpacing: -0.8, lineHeight: 34,
  },

  card: {
    backgroundColor: SURF, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, overflow: 'hidden',
    padding: 20, gap: 14,
  },
  cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },

  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: { fontSize: 36 },
  chip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.3 },

  cardMid: { gap: 5 },
  cardName: {
    fontFamily: 'Lora_400Regular', fontSize: 22, color: TEXT,
    lineHeight: 28, letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 11, color: SUB, fontFamily: 'Inter_500Medium', letterSpacing: 0.3,
  },
  cardPreview: { fontSize: 12, color: SUB, lineHeight: 18, marginTop: 2 },

  cardFoot: { alignItems: 'flex-end' },
  cardCta: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4 },

  suggestWrap: { marginTop: 4 },
  suggestPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: SURF, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.18)',
    borderRadius: 18, paddingHorizontal: 20, paddingVertical: 18,
  },
  suggestIco: { fontSize: 18 },
  suggestPillTxt: {
    fontSize: 14, color: TEXT, fontFamily: 'Inter_500Medium', flex: 1,
  },
  suggestArrow: { fontSize: 20, color: MUTED },

  suggestBox: {
    backgroundColor: SURF, borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.22)',
    borderRadius: 16, padding: 16, gap: 12,
  },
  suggestLabel: {
    fontSize: 11, color: LAV, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.4,
  },
  suggestInput: {
    color: TEXT, fontSize: 14, fontFamily: 'Inter_400Regular',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
  },
  sendBtn: {
    alignSelf: 'flex-end', backgroundColor: LAV,
    borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8,
  },
  sendBtnOff: { opacity: 0.35 },
  sendBtnTxt: { fontSize: 12, color: BG, fontFamily: 'Inter_700Bold' },

  sentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(110,231,183,0.08)',
    borderWidth: 1, borderColor: 'rgba(110,231,183,0.2)',
    borderRadius: 30, paddingHorizontal: 16, paddingVertical: 13,
  },
  sentIco: { fontSize: 14, color: '#6EE7B7' },
  sentTxt: { fontSize: 12, color: '#6EE7B7', fontFamily: 'Inter_500Medium' },
});
