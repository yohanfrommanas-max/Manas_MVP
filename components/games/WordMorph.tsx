import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── LIGHT THEME (matches HTML exactly) ──────────────────────────────────────
const BG          = '#f5f3ee';
const SURFACE     = '#ffffff';
const SURFACE2    = '#f0ede6';
const BORDER      = '#ddd9d0';
const BORDER2     = '#ccc8be';
const TEXT        = '#1a1814';
const TEXT2       = '#6b6760';
const TEXT3       = '#a8a49e';
const ACCENT      = '#5b4fcf';
const ACCENT_DIM  = '#edeafc';
const ACCENT_BDR  = '#c4bef5';
const GOLD        = '#9a7a28';
const GOLD_DIM    = '#fdf6e3';
const GOLD_BDR    = '#e4d09a';
const GREEN       = '#2e7d5e';
const GREEN_DIM   = '#e8f5ee';
const GREEN_BDR   = '#9dd4bc';
const RED         = '#c0392b';

// ─── WORD LISTS ───────────────────────────────────────────────────────────────
const W4 = new Set('cold,cord,word,ward,warm,bold,bolt,mold,mild,wild,wile,head,heal,teal,tell,tall,tail,dark,dare,fare,fire,hate,have,cave,lave,love,sick,silk,sill,sell,well,back,pack,rack,race,lace,lane,mane,mine,dine,wine,vine,pine,fine,line,link,sink,rink,ring,sing,king,kind,bind,find,mind,mint,hint,hilt,gilt,gild,wind,wink,wing,beat,bead,dead,deal,dear,fear,feat,heat,meal,meat,meet,feet,feel,fell,bell,belt,melt,felt,help,heap,reap,real,reel,reed,feed,hire,here,hare,bare,bark,park,lark,lock,rock,sock,luck,duck,puck,bile,bike,like,time,tide,side,site,size,sire,hive,dive,late,gate,gale,tale,tile,file,fill,hill,will,bill,pill,mill,kill,hull,bull,full,pull,pall,fall,hall,ball,call,wall,mall,cell,yell,fold,gold,hold,sold,told,lord,ford,horn,born,torn,worn,corn,sort,port,fort,form,harm,hard,herd,hero,zero,worm,wore,more,mare,care,core,bore,fore,lore,lure,cure,pure,sure,rude,dune,done,bone,cone,tone,lone,gone,note,nose,rose,rode,code,mode,made,fade,hide,ride,wide,word,work,fork,wire,wise,rise,rice,dice,dike,bite,mite,mile,pile,milt,wold'.split(','));
const W3 = new Set('cat,bat,hat,hot,hop,top,tap,nap,map,cap,cup,cut,but,bad,bag,bit,big,bug,bus,can,cob,cod,cop,cot,cow,dot,dog,log,leg,peg,pet,pit,pot,lot,dug,ear,eat,egg,end,fan,far,fat,fit,fog,fox,fun,gap,gas,got,gum,gun,gut,ham,hay,hen,hit,hoe,hog,hub,hug,hum,hut,jam,jar,jaw,jet,jig,job,jog,jug,key,kid,kit,lab,lad,lag,lap,law,lay,led,lid,lip,lit,lop,low,lug,mad,man,mat,mob,mop,mud,mug,nun,nut,odd,oil,old,one,ore,pad,pal,pan,pat,paw,pay,pea,pen,pig,pin,pod,pop,pub,pun,pup,put,rag,ram,ran,rat,raw,ray,red,rid,rig,rim,rip,rob,rod,rot,row,rub,rug,rum,run,rut,sag,sap,sat,saw,say,sea,set,sip,sir,sit,sob,son,sow,sub,sue,sum,sun,tab,tag,tan,tar,tax,tea,ten,tie,tin,tip,toe,ton,too,toy,tub,tug,van,vat,vow,wag,war,was,wax,way,web,wed,wet,wig,win,wit,woe,wok,won,woo,yam,yap,yaw,yes,yew,zip,zoo,doe,dew,hew,new,pew'.split(','));

function isW(w: string): boolean { return w.length === 4 ? W4.has(w) : W3.has(w); }
function oneAway(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d === 1;
}

// ─── PUZZLES ──────────────────────────────────────────────────────────────────
type Difficulty = 'Easy' | 'Medium' | 'Hard';
interface Puzzle { id: number; start: string; end: string; optimal: string[]; diff: Difficulty; isToday?: boolean; date: Date; }

function daysAgo(n: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - n);
}

const PUZZLES: Puzzle[] = [
  { id: 0, start: 'cold', end: 'warm', optimal: ['cold','cord','word','ward','warm'], diff: 'Medium', isToday: true, date: daysAgo(0) },
  { id: 1, start: 'dark', end: 'fire', optimal: ['dark','dare','fare','fire'],         diff: 'Hard',   date: daysAgo(1) },
  { id: 2, start: 'head', end: 'tail', optimal: ['head','heal','teal','tell','tall','tail'], diff: 'Hard', date: daysAgo(2) },
  { id: 3, start: 'bold', end: 'mild', optimal: ['bold','mold','mild'],                diff: 'Easy',   date: daysAgo(3) },
  { id: 4, start: 'sick', end: 'well', optimal: ['sick','silk','sill','sell','well'],  diff: 'Medium', date: daysAgo(4) },
  { id: 5, start: 'hate', end: 'love', optimal: ['hate','have','cave','lave','love'],  diff: 'Hard',   date: daysAgo(5) },
];

const MAX_ATT = 6;
const KB_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['undo','z','x','c','v','b','n','m','⌫','enter'],
];

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── HELPER: DIFFICULTY PILL ──────────────────────────────────────────────────
function DiffPill({ diff, small }: { diff: Difficulty; small?: boolean }) {
  const bg     = diff === 'Easy' ? GREEN_DIM  : diff === 'Medium' ? GOLD_DIM  : '#fdeaea';
  const color  = diff === 'Easy' ? GREEN      : diff === 'Medium' ? GOLD      : RED;
  const border = diff === 'Easy' ? GREEN_BDR  : diff === 'Medium' ? GOLD_BDR  : '#f5c0bc';
  return (
    <View style={{ backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: small ? 1 : 3 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: small ? 10 : 11, color }}>{diff}</Text>
    </View>
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type WMView = 'home' | 'bank' | 'game' | 'results';
type MsgType = 'err' | 'ok' | '';
interface GState { puzzle: Puzzle; chain: string[]; current: string; selIdx: number | null; hintsLeft: number; hintsUsed: number; attUsed: number; }
interface ResultData { won: boolean; steps: number; opt: number; attUsed: number; chain: string[]; puzzle: Puzzle; }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PlayWordMorph({ difficulty, onFinish }: { difficulty: Difficulty; onFinish: (score: number) => void }) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [wmView, setWmView]   = useState<WMView>('home');
  const [showHowTo, setShowHowTo] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [g, setG] = useState<GState>({ puzzle: PUZZLES[0], chain: [PUZZLES[0].start], current: PUZZLES[0].start, selIdx: null, hintsLeft: 3, hintsUsed: 0, attUsed: 0 });
  const [msg, setMsg]         = useState<{ text: string; type: MsgType }>({ text: '', type: '' });
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const pathRef = useRef<ScrollView>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const playPuzzle = useCallback((idx: number) => {
    const p = PUZZLES[idx];
    setG({ puzzle: p, chain: [p.start], current: p.start, selIdx: null, hintsLeft: 3, hintsUsed: 0, attUsed: 0 });
    setMsg({ text: '', type: '' });
    setWmView('game');
  }, []);

  const finishGame = useCallback((chain: string[], puzzle: Puzzle, attUsed: number) => {
    const won = chain[chain.length - 1] === puzzle.end;
    const steps = chain.length - 1;
    const opt   = puzzle.optimal.length - 1;
    setCompleted(prev => new Set([...prev, puzzle.id]));
    setResultData({ won, steps, opt, attUsed, chain, puzzle });
    setWmView('results');
    const score = won ? Math.max(10, 100 - (steps - opt) * 10 - (attUsed - steps) * 5) : 0;
    onFinish(score);
  }, [onFinish]);

  const selLetter = useCallback((i: number) => {
    setG(prev => {
      const { current, chain } = prev;
      const last = chain[chain.length - 1];
      const changed = current.split('').reduce<number[]>((acc, ch, j) => { if (ch !== last[j]) acc.push(j); return acc; }, []);
      if (changed.length > 0 && current[i] === last[i]) {
        setMsg({ text: 'Undo first to change a different letter', type: 'err' });
        return prev;
      }
      setMsg({ text: '', type: '' });
      return { ...prev, selIdx: prev.selIdx === i ? null : i };
    });
  }, []);

  const pressKey = useCallback((ch: string) => {
    setG(prev => {
      if (prev.selIdx === null) { setMsg({ text: 'Tap a letter tile first', type: 'err' }); return prev; }
      const arr = prev.current.split('');
      arr[prev.selIdx] = ch;
      setMsg({ text: '', type: '' });
      return { ...prev, current: arr.join(''), selIdx: null };
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const pressUndo = useCallback(() => {
    setG(prev => {
      if (prev.current !== prev.chain[prev.chain.length - 1]) {
        return { ...prev, current: prev.chain[prev.chain.length - 1], selIdx: null };
      }
      if (prev.chain.length > 1) {
        const nc = prev.chain.slice(0, -1);
        return { ...prev, chain: nc, current: nc[nc.length - 1], selIdx: null };
      }
      return prev;
    });
    setMsg({ text: '', type: '' });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const pressClear = useCallback(() => {
    setG(prev => {
      if (prev.selIdx !== null) return { ...prev, selIdx: null };
      if (prev.current !== prev.chain[prev.chain.length - 1]) return { ...prev, current: prev.chain[prev.chain.length - 1], selIdx: null };
      return prev;
    });
  }, []);

  const pressSubmit = useCallback(() => {
    setG(prev => {
      const { current, chain, puzzle, attUsed } = prev;
      const last = chain[chain.length - 1];
      if (current === last)          { setMsg({ text: 'Change at least one letter', type: 'err' });              return prev; }
      if (!oneAway(current, last))   { setMsg({ text: 'Only one letter can change per step', type: 'err' });    return prev; }
      if (!isW(current))             { setMsg({ text: `"${current.toUpperCase()}" isn't a valid word`, type: 'err' }); return prev; }
      if (chain.includes(current))   { setMsg({ text: 'You already used that word', type: 'err' });             return prev; }
      if (attUsed >= MAX_ATT)        { setMsg({ text: 'No attempts remaining', type: 'err' });                  return prev; }
      const newChain = [...chain, current];
      const newAtt   = attUsed + 1;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMsg({ text: '', type: '' });
      setTimeout(() => pathRef.current?.scrollToEnd({ animated: true }), 80);
      if (current === puzzle.end || newAtt >= MAX_ATT) {
        setTimeout(() => finishGame(newChain, puzzle, newAtt), 350);
      }
      return { ...prev, chain: newChain, current, selIdx: null, attUsed: newAtt };
    });
  }, [finishGame]);

  const useHint = useCallback(() => {
    setG(prev => {
      const { hintsLeft, puzzle, chain, attUsed } = prev;
      if (hintsLeft <= 0) { setMsg({ text: 'No hints remaining', type: 'err' }); return prev; }
      const cl = chain.length;
      if (cl < puzzle.optimal.length) {
        const next     = puzzle.optimal[cl];
        const newChain = [...chain, next];
        const newAtt   = attUsed + 1;
        setMsg({ text: `Hint: ${next.toUpperCase()}`, type: 'ok' });
        setTimeout(() => pathRef.current?.scrollToEnd({ animated: true }), 80);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (next === puzzle.end || newAtt >= MAX_ATT) {
          setTimeout(() => finishGame(newChain, puzzle, newAtt), 400);
        }
        return { ...prev, hintsLeft: prev.hintsLeft - 1, hintsUsed: prev.hintsUsed + 1, chain: newChain, current: next, selIdx: null, attUsed: newAtt };
      }
      setMsg({ text: "You're off the optimal path — keep going!", type: 'ok' });
      return prev;
    });
  }, [finishGame]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (wmView === 'home') {
    const p = PUZZLES[0];
    const todayDone = completed.has(0);

    return (
      <View style={{ flex: 1, backgroundColor: BG }}>

        {/* ── How to play modal ─────────────────────────────────────────── */}
        <Modal visible={showHowTo} transparent animationType="slide" onRequestClose={() => setShowHowTo(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} onPress={() => setShowHowTo(false)}>
            <View style={{ backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: botPad + 28 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER2, alignSelf: 'center', marginBottom: 22 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: TEXT3, marginBottom: 16 }}>HOW IT WORKS</Text>

              {/* Word chain tiles */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['CAT', '→', 'COT', '→', 'DOT', '→', 'DOG'].map((item, i) => {
                  if (item === '→') return <Text key={i} style={{ fontSize: 14, color: TEXT3 }}>{item}</Text>;
                  const isFirst = item === 'CAT', isLast = item === 'DOG';
                  return (
                    <View key={i} style={{ backgroundColor: isFirst ? ACCENT_DIM : isLast ? GOLD_DIM : SURFACE2, borderWidth: 1.5, borderColor: isFirst ? ACCENT_BDR : isLast ? GOLD_BDR : BORDER, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                      <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 16, letterSpacing: 2, color: isFirst ? ACCENT : isLast ? GOLD : TEXT2 }}>{item}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Explanation block */}
              <View style={{ backgroundColor: SURFACE2, borderLeftWidth: 2, borderLeftColor: ACCENT, borderRadius: 8, padding: 14, marginBottom: 18 }}>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: TEXT2, lineHeight: 22 }}>
                  {'Change '}<Text style={{ fontFamily: 'Inter_600SemiBold', color: TEXT }}>one letter</Text>
                  {' per step. Your path doesn\'t have to match the optimal — '}
                  <Text style={{ fontFamily: 'Inter_700Bold', color: TEXT }}>as long as each word is real, your attempt counts.</Text>
                  {' Shorter paths score better.'}
                </Text>
              </View>

              {/* 6 attempts strip */}
              <View style={{ backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {[...Array(6)].map((_, i) => <View key={i} style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: ACCENT }} />)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: TEXT, marginBottom: 2 }}>6 attempts per puzzle</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: TEXT3 }}>Each submitted word uses one attempt</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowHowTo(false)}
                style={({ pressed }) => ({ backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6, opacity: pressed ? 0.86 : 1 })}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' }}>Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* ── Top nav ───────────────────────────────────────────────────── */}
        <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => onFinish(0)}
            style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="chevron-back" size={22} color={TEXT2} />
          </Pressable>
          <Pressable
            onPress={() => setWmView('bank')}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="albums-outline" size={13} color={TEXT2} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: TEXT2 }}>Puzzle bank</Text>
          </Pressable>
        </View>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: botPad + 28 }} showsVerticalScrollIndicator={false}>

          {/* Eyebrow tag */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.5, color: TEXT3, textTransform: 'uppercase', marginTop: 20, marginBottom: 18 }}>
            MANAS · COGNITIVE
          </Text>

          {/* Title */}
          <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 44, color: TEXT, letterSpacing: -1, lineHeight: 50, marginBottom: 10 }}>
            {'Word'}<Text style={{ color: ACCENT }}>{'Morph'}</Text>
          </Text>

          {/* Category pill */}
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <View style={{ backgroundColor: ACCENT_DIM, borderWidth: 1, borderColor: ACCENT_BDR, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: ACCENT, letterSpacing: 0.5 }}>VERBAL FLEXIBILITY</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: TEXT2, lineHeight: 22, marginBottom: 30 }}>
            Change one letter at a time. Every step must be a real word. Reach the target in 6 attempts.
          </Text>

          {/* Today's puzzle card */}
          <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: ACCENT_BDR, borderRadius: 16, padding: 18, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: TEXT }}>Today's puzzle</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT }} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 0.7, textTransform: 'uppercase', color: ACCENT }}>Live</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, letterSpacing: 4, color: ACCENT }}>{p.start.toUpperCase()}</Text>
              <Text style={{ fontSize: 18, color: TEXT3 }}>→</Text>
              <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, letterSpacing: 4, color: GOLD }}>{p.end.toUpperCase()}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <DiffPill diff={p.diff} />
              <View style={{ backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: TEXT2 }}>{p.optimal.length - 1} steps min</Text>
              </View>
            </View>
          </View>

          {/* Play button */}
          {todayDone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN_DIM, borderWidth: 1, borderColor: GREEN_BDR, borderRadius: 14, paddingVertical: 16, marginBottom: 14 }}>
              <Ionicons name="checkmark-circle" size={18} color={GREEN} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: GREEN }}>Completed today</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => playPuzzle(0)}
              style={({ pressed }) => ({ backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 14, opacity: pressed ? 0.88 : 1 })}
              testID="play-today"
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff', letterSpacing: 0.2 }}>Play today's puzzle</Text>
            </Pressable>
          )}

          {/* How to play link */}
          <Pressable onPress={() => setShowHowTo(true)} style={{ paddingVertical: 6 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: TEXT3, textAlign: 'center' }}>How to play?</Text>
          </Pressable>

        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BANK SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (wmView === 'bank') {
    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ paddingTop: topPad, paddingHorizontal: 22, paddingBottom: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE }}>
          <Pressable onPress={() => setWmView('home')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={TEXT2} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: TEXT }}>Puzzle bank</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 22, paddingBottom: botPad + 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: TEXT3, marginBottom: 8 }}>Past puzzles</Text>
          {PUZZLES.filter(p => !p.isToday).map(p => {
            const done = completed.has(p.id);
            return (
              <Pressable key={p.id} onPress={() => playPuzzle(p.id)} style={({ pressed }) => ({ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, opacity: pressed ? 0.8 : 1 })}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 16, letterSpacing: 2, color: TEXT, marginBottom: 4 }}>{p.start.toUpperCase()} → {p.end.toUpperCase()}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: TEXT3 }}>{fmtDate(p.date)}</Text>
                    <DiffPill diff={p.diff} small />
                  </View>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: done ? GREEN : BORDER2, backgroundColor: done ? GREEN : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (wmView === 'game') {
    const { puzzle, chain, current, selIdx, hintsLeft, attUsed } = g;
    const prev    = chain[chain.length - 1];
    const attLeft = MAX_ATT - attUsed;
    const changedPos: number[] = [];
    for (let j = 0; j < current.length; j++) if (current[j] !== prev[j]) changedPos.push(j);

    const tileLabel = selIdx !== null
      ? 'Now tap a key below'
      : changedPos.length > 0 ? 'Tap Enter to submit or undo'
      : 'Tap a letter to change it';

    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        {/* Nav */}
        <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE }}>
          <Pressable onPress={() => setWmView('home')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={TEXT2} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: TEXT }}>{puzzle.isToday ? "Today's puzzle" : fmtDate(puzzle.date)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={useHint} style={{ backgroundColor: hintsLeft > 0 ? ACCENT_DIM : SURFACE2, borderWidth: 1, borderColor: hintsLeft > 0 ? ACCENT_BDR : BORDER, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: hintsLeft > 0 ? ACCENT : TEXT3 }}>{hintsLeft > 0 ? `Hint (${hintsLeft})` : 'No hints'}</Text>
            </Pressable>
            <View style={{ backgroundColor: attLeft <= 2 ? '#fdeaea' : attLeft <= 3 ? GOLD_DIM : SURFACE2, borderWidth: 1, borderColor: attLeft <= 2 ? '#f5c0bc' : attLeft <= 3 ? GOLD_BDR : BORDER, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: attLeft <= 2 ? RED : attLeft <= 3 ? GOLD : TEXT2 }}>{attLeft} left</Text>
            </View>
          </View>
        </View>

        {/* Start / End */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: TEXT3, marginBottom: 4 }}>Start</Text>
            <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, letterSpacing: 4, color: ACCENT }}>{puzzle.start.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: TEXT3, marginBottom: 4 }}>Target</Text>
            <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, letterSpacing: 4, color: GOLD }}>{puzzle.end.toUpperCase()}</Text>
          </View>
        </View>

        {/* Path */}
        <ScrollView ref={pathRef} style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          {chain.map((w, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: TEXT3, width: 14, textAlign: 'right' }}>{i === 0 ? '' : String(i)}</Text>
              <View style={{ flex: 1, backgroundColor: i === 0 ? ACCENT_DIM : SURFACE, borderWidth: 1, borderColor: i === 0 ? ACCENT_BDR : BORDER2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 18, letterSpacing: 3, color: TEXT }}>{w.toUpperCase()}</Text>
                <View style={{ marginLeft: 'auto', backgroundColor: i === 0 ? ACCENT_DIM : GREEN_DIM, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: i === 0 ? ACCENT : GREEN }}>{i === 0 ? 'start' : '✓'}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Message bar */}
        <View style={{ minHeight: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 2, backgroundColor: BG }}>
          {!!msg.text && <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: msg.type === 'err' ? RED : GREEN }}>{msg.text}</Text>}
        </View>

        {/* Keyboard area */}
        <View style={{ backgroundColor: SURFACE, borderTopWidth: 1, borderTopColor: BORDER, paddingHorizontal: 8, paddingTop: 8, paddingBottom: botPad + 10 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: TEXT3, textAlign: 'center', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{tileLabel}</Text>

          {/* Word tiles */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            {current.split('').map((ch, i) => {
              const isChanged = current[i] !== prev[i];
              const isSel     = selIdx === i;
              const isLocked  = changedPos.length > 0 && !isChanged && selIdx === null;
              const active    = isSel || isChanged;
              return (
                <Pressable
                  key={i}
                  onPress={() => { if (isLocked) setMsg({ text: 'Undo first to change a different letter', type: 'err' }); else selLetter(i); }}
                  style={{ width: 52, height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: active ? ACCENT : BORDER2, backgroundColor: active ? ACCENT : SURFACE, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 22, color: active ? '#fff' : TEXT }}>{ch.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Keyboard rows */}
          {KB_ROWS.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
              {row.map(k => {
                const isAction = k === 'undo' || k === '⌫';
                const isEnter  = k === 'enter';
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      if (k === 'undo')  pressUndo();
                      else if (k === '⌫')    pressClear();
                      else if (k === 'enter') pressSubmit();
                      else                    pressKey(k);
                    }}
                    style={({ pressed }) => ({
                      height: 46, minWidth: isAction || isEnter ? 54 : 28, flex: 1, maxWidth: isAction || isEnter ? 58 : 38,
                      borderRadius: 10, borderWidth: 1,
                      borderColor: isEnter ? ACCENT_BDR : BORDER,
                      backgroundColor: isEnter ? ACCENT : isAction ? SURFACE2 : SURFACE,
                      alignItems: 'center', justifyContent: 'center',
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontFamily: isAction || isEnter ? 'Inter_700Bold' : 'Inter_600SemiBold', fontSize: isAction || isEnter ? 12 : 16, color: isEnter ? '#fff' : isAction ? TEXT2 : TEXT }}>
                      {k === 'undo' ? 'Undo' : k === 'enter' ? 'Enter' : k.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (wmView === 'results' && resultData) {
    const { won, steps, opt, attUsed, chain: rChain, puzzle: rPuzzle } = resultData;
    const diff   = steps - opt;
    const grade  = !won ? 'ok' : diff === 0 ? 'perfect' : diff <= 1 ? 'good' : 'ok';
    const title  = !won ? 'Out of attempts' : diff === 0 ? 'Perfect path!' : diff <= 1 ? 'Well done!' : 'Path found!';
    const sub    = !won
      ? `You used all ${MAX_ATT} attempts. The target was ${rPuzzle.end.toUpperCase()}.`
      : diff === 0 ? 'You found the shortest possible route. Exceptional.'
      : diff <= 1  ? 'Just one step longer than optimal — sharp and mindful.'
      : `You reached the target in ${steps} steps. Optimal was ${opt}.`;

    const iconBg  = grade === 'perfect' ? GREEN_DIM  : grade === 'good' ? ACCENT_DIM  : SURFACE2;
    const iconBdr = grade === 'perfect' ? GREEN_BDR  : grade === 'good' ? ACCENT_BDR  : BORDER2;
    const iconClr = grade === 'perfect' ? GREEN      : grade === 'good' ? ACCENT      : TEXT3;

    return (
      <View style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: SURFACE }}>
          <Pressable onPress={() => setWmView('home')} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={18} color={TEXT2} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: TEXT }}>Results</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 22, paddingBottom: botPad + 32 }}>
          {/* Hero */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: iconBg, borderWidth: 1, borderColor: iconBdr, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name={won ? 'checkmark' : 'alert-circle'} size={28} color={iconClr} />
            </View>
            <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, color: TEXT, marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: TEXT2, lineHeight: 22, textAlign: 'center' }}>{sub}</Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[
              { val: String(steps), label: 'Your steps', color: ACCENT },
              { val: String(opt),   label: 'Optimal',    color: GREEN  },
              { val: String(attUsed), label: 'Attempts used', color: TEXT },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Lora_700Bold', fontSize: 26, color: s.color }}>{s.val}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: TEXT3, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Path comparison */}
          <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: TEXT3, marginBottom: 14 }}>Path comparison</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: SURFACE2, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: TEXT2 }}>Your path</Text>
                </View>
                {rChain.map((w, i) => (
                  <Text key={i} style={{ fontFamily: 'Lora_400Regular', fontSize: 14, letterSpacing: 2, textAlign: 'center', paddingVertical: 3, color: i === 0 ? ACCENT : (i === rChain.length - 1 && won) ? GOLD : TEXT2 }}>{w.toUpperCase()}</Text>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: GREEN_DIM, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: GREEN }}>Optimal</Text>
                </View>
                {rPuzzle.optimal.map((w, i) => (
                  <Text key={i} style={{ fontFamily: 'Lora_400Regular', fontSize: 14, letterSpacing: 2, textAlign: 'center', paddingVertical: 3, color: i === 0 ? ACCENT : i === rPuzzle.optimal.length - 1 ? GOLD : TEXT2 }}>{w.toUpperCase()}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setWmView('home')} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: TEXT2 }}>Home</Text>
            </Pressable>
            <Pressable onPress={() => setWmView('bank')} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' }}>Puzzle bank</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}
