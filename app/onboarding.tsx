import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors, type Colors } from '@/constants/colors';

// ─── Flashcards (unchanged) ──────────────────────────────────────────────────

function getFlashcards(C: Colors) { return [
  {
    title: 'Sharpen Your Mind',
    subtitle: 'Brain training games and cognitive workouts designed to build focus, memory, and mental clarity.',
    accent: C.lavender,
    gradient: [C.lavender + '30', C.lavender + '18', C.bg] as [string, string, string],
    icon: 'flash' as const,
    iconSet: 'Ionicons' as const,
  },
  {
    title: 'Find Your Calm',
    subtitle: 'Guided breathwork, sleep soundscapes, and curated music — your toolkit for stillness.',
    accent: C.sage,
    gradient: [C.sage + '30', C.sage + '18', C.bg] as [string, string, string],
    icon: 'leaf' as const,
    iconSet: 'Ionicons' as const,
  },
  {
    title: 'Know Yourself',
    subtitle: 'Daily prompts, mood tracking, and AI-powered reflections to help you grow from within.',
    accent: C.gold,
    gradient: [C.gold + '30', C.gold + '18', C.bg] as [string, string, string],
    icon: 'journal' as const,
    iconSet: 'Ionicons' as const,
  },
]; }

// ─── Quiz steps ──────────────────────────────────────────────────────────────

function getAllQuizSteps(C: Colors) { return [
  {
    id: 'sharpness',
    tag: 'COGNITIVE BASELINE',
    question: 'When did you last feel completely sharp?',
    sub: 'Not calm. Not happy. Sharp — thinking clearly, remembering easily, deciding without friction.',
    accent: C.lavender,
    type: 'single' as const,
    autoAdvance: true,
    options: [
      { label: 'Today, actually', desc: 'Mind feels clear right now', icon: 'sunny-outline', value: 'recent' },
      { label: 'A few days ago', desc: 'Had it recently, feeling it slip', icon: 'partly-sunny-outline', value: 'fading' },
      { label: "Can't really remember", desc: 'Fog has been the baseline', icon: 'cloud-outline', value: 'lost' },
      { label: 'Never felt that way', desc: 'Clarity feels out of reach', icon: 'moon-outline', value: 'never' },
    ],
  },
  {
    id: 'thieves',
    tag: 'YOUR CHALLENGES',
    question: "What's been stealing your focus?",
    sub: 'Select all that feel true. This shapes what Manas surfaces for you.',
    accent: C.rose,
    type: 'multi' as const,
    autoAdvance: false,
    options: [
      { label: '📱 My phone, constantly', value: 'phone' },
      { label: '😰 Anxious thoughts', value: 'anxiety' },
      { label: '😴 Poor sleep', value: 'sleep' },
      { label: '🧠 Mental fatigue', value: 'fatigue' },
      { label: '🔥 Stress and pressure', value: 'stress' },
      { label: '🌀 Can\'t focus at all', value: 'focus' },
      { label: '💭 Forgetting things', value: 'memory' },
      { label: '✨ Lost creativity', value: 'creativity' },
    ],
  },
  {
    id: 'endOfDay',
    tag: 'DAILY PATTERN',
    question: 'How does your mind feel by end of day?',
    sub: 'Not how you wish it felt — how it actually feels.',
    accent: C.gold,
    type: 'single' as const,
    autoAdvance: true,
    options: [
      { label: 'Completely fried', desc: "Depleted, can't think straight", icon: 'battery-dead-outline', value: 'depleted' },
      { label: 'Scattered', desc: "Lots of thoughts, can't land on any", icon: 'git-network-outline', value: 'scattered' },
      { label: 'Switched off', desc: 'Just want to scroll and not think', icon: 'tv-outline', value: 'numb' },
      { label: 'Wired but tired', desc: "Exhausted but can't switch off", icon: 'flash-outline', value: 'wired' },
      { label: 'Reasonably okay', desc: 'Not great, but managing', icon: 'leaf-outline', value: 'okay' },
    ],
  },
  {
    id: 'preferredTime',
    tag: 'YOUR PEAK WINDOW',
    question: 'When does your mind get its best window?',
    sub: 'Everyone has a cognitive peak. Even if yours feels short right now.',
    accent: C.sage,
    type: 'single' as const,
    autoAdvance: true,
    options: [
      { label: 'Early morning (6–9am)', desc: 'Before the world gets in', icon: 'sunny-outline', value: 'Morning' },
      { label: 'Mid-morning (9–12pm)', desc: "Once I'm warmed up", icon: 'partly-sunny-outline', value: 'MidMorning' },
      { label: 'Afternoon (12–5pm)', desc: 'Second wind territory', icon: 'cloudy-outline', value: 'Afternoon' },
      { label: 'Evening (5–9pm)', desc: 'When things quiet down', icon: 'moon-outline', value: 'Evening' },
      { label: 'Night (9pm+)', desc: 'When everyone else is asleep', icon: 'star-outline', value: 'Night' },
    ],
  },
  {
    id: 'mood',
    tag: 'YOUR STARTING POINT',
    question: 'Where is your mind right now?',
    sub: "This becomes your baseline. You'll watch it shift.",
    accent: C.lavender,
    type: 'mood' as const,
    autoAdvance: false,
    options: [
      { label: 'Foggy', icon: 'emoticon-cry-outline', value: 1 },
      { label: 'Sluggish', icon: 'emoticon-sad-outline', value: 2 },
      { label: 'Getting there', icon: 'emoticon-neutral-outline', value: 3 },
      { label: 'Switched on', icon: 'emoticon-happy-outline', value: 4 },
      { label: 'Firing', icon: 'emoticon-excited-outline', value: 5 },
    ],
  },
  {
    id: 'sessionLength',
    tag: 'YOUR COMMITMENT',
    question: 'How much time can you realistically give this?',
    sub: 'Manas works in 5 minutes. Small sessions compound into real change.',
    accent: C.lightSky,
    type: 'single' as const,
    autoAdvance: true,
    options: [
      { label: "5 minutes — that's all I have", desc: "One game. That's enough.", icon: 'flash-outline', value: 'micro' },
      { label: '10 minutes — a proper break', desc: 'Game + breathe session', icon: 'cafe-outline', value: 'short' },
      { label: '15–20 minutes — I\'m committed', desc: 'Train, calm, and reflect', icon: 'ribbon-outline', value: 'medium' },
      { label: 'As long as it takes', desc: 'Show me everything', icon: 'infinite-outline', value: 'open' },
    ],
  },
  {
    id: 'name',
    tag: 'ALMOST THERE',
    question: 'Last thing — what should we call you?',
    sub: '',
    accent: C.lavender,
    type: 'text' as const,
    autoAdvance: false,
    options: [],
  },
]; }

// ─── Reveal helpers ──────────────────────────────────────────────────────────

type AnswersShape = {
  sharpness: string | null;
  thieves: string[];
  endOfDay: string | null;
  preferredTime: string | null;
  mood: number;
  sessionLength: string | null;
  name: string;
};

function getPersonalisedMessage(answers: AnswersShape) {
  if (answers.sharpness === 'lost' || answers.sharpness === 'never')
    return "You're about to find out what your mind is designed to do.";
  if (answers.endOfDay === 'numb' || answers.endOfDay === 'depleted')
    return 'Rest. Train. Recover. Your mind deserves the same attention as your body.';
  if (answers.endOfDay === 'wired')
    return "Let's start with calm. Then we'll train. You're in the right place.";
  if (answers.thieves.includes('phone'))
    return 'Your attention is worth protecting. Let\'s start doing that.';
  return 'Your journey to a clearer mind begins now.';
}

function getRevealCards(answers: AnswersShape, C: Colors) {
  const FACTS = [
    {
      trigger: (a: AnswersShape) => a.sharpness === 'lost' || a.sharpness === 'never',
      stat: '67%', statColor: C.lavender,
      context: 'of people report difficulty recalling the last time they felt genuinely cognitively sharp — not just rested, but truly clear.',
      manas: 'Manas is designed to help rebuild that clarity, one session at a time.',
      source: 'Cognitive Aging Research · Nature Reviews Neuroscience',
    },
    {
      trigger: (a: AnswersShape) => a.thieves.includes('phone'),
      stat: '96×', statColor: C.rose,
      context: 'The average person checks their phone 96 times a day. Each interruption is associated with a focus recovery window of up to 23 minutes.',
      manas: 'Manas is designed to give your attention somewhere worthwhile to go.',
      source: 'Asurion Research, 2024',
    },
    {
      trigger: (a: AnswersShape) => a.thieves.includes('anxiety') || a.endOfDay === 'wired',
      stat: '40%', statColor: C.rose,
      context: 'Chronic anxiety is associated with working memory reductions of up to 40% — the cognitive resource behind focus, reasoning, and decision-making.',
      manas: 'Manas is designed to support both the cognitive load and the nervous system beneath it.',
      source: 'Journal of Experimental Psychology, 2023',
    },
    {
      trigger: (a: AnswersShape) => a.thieves.includes('sleep') || a.endOfDay === 'depleted',
      stat: '30%', statColor: C.gold,
      context: 'Even one night of poor sleep is associated with a 30% reduction in next-day cognitive performance. Three consecutive nights compounds this significantly.',
      manas: 'The Sleep section in Manas was built with this in mind.',
      source: 'Sleep Research Society, 2024',
    },
    {
      trigger: (a: AnswersShape) => a.endOfDay === 'scattered' || a.thieves.includes('focus'),
      stat: '47%', statColor: C.lavender,
      context: "Research suggests the mind wanders nearly half the time — not from poor willpower, but because scattered attention has become the brain's default state.",
      manas: 'Focus is a trainable skill. Manas is designed to support building it.',
      source: 'Killingsworth & Gilbert, Harvard, 2010',
    },
    {
      trigger: (a: AnswersShape) => a.endOfDay === 'numb',
      stat: '6hrs', statColor: C.gold,
      context: 'Passive content consumption is associated with motivational fatigue lasting several hours — contributing to the flat, unmotivated feeling at the end of the day.',
      manas: 'Manas is designed to give your brain something real to engage with.',
      source: 'Frontiers in Neuroscience, 2023',
    },
    {
      trigger: (a: AnswersShape) => a.thieves.includes('stress'),
      stat: '10%', statColor: C.rose,
      context: "Chronic stress is associated with structural changes in the hippocampus — the brain's memory centre — including volume reductions of up to 10% in some studies.",
      manas: "Manas's breathwork and games are designed to support recovery from stress.",
      source: 'Biological Psychiatry, 2023',
    },
    {
      trigger: (a: AnswersShape) => a.thieves.includes('memory'),
      stat: '70%', statColor: C.sage,
      context: 'Working memory capacity determines how much information you can hold in mind while performing tasks. Training it measurably improves everyday cognitive function.',
      manas: 'Every game in Manas is designed to train a specific cognitive circuit.',
      source: 'Psychological Science, 2022',
    },
    {
      trigger: (a: AnswersShape) => a.sessionLength === 'micro',
      stat: '5min', statColor: C.sage,
      context: 'Research suggests that even brief daily cognitive training sessions — as short as 5 minutes — can produce measurable attention improvements over 4 weeks.',
      manas: "You don't need an hour. Consistency is what matters.",
      source: 'Psychological Science, 2023',
    },
    {
      trigger: () => true,
      stat: answers.name || 'Ready',
      statColor: C.sage,
      context: 'Your cognitive profile is set. Manas is calibrated for you.',
      manas: getPersonalisedMessage(answers),
      source: '',
    },
  ];

  const universal = FACTS[FACTS.length - 1];
  const specific = FACTS.slice(0, -1).filter(f => f.trigger(answers));
  const card1 = specific[0] || FACTS[0];
  const card2 = specific[1] || specific[0] || FACTS[4];
  return [card1, card2, universal];
}

// ─── Reveal Phase Component ──────────────────────────────────────────────────

type RevealCard = {
  stat: string;
  statColor: string;
  context: string;
  manas: string;
  source: string;
};

function RevealPhase({ cards, onEnter, C, topInset, bottomInset }: {
  cards: RevealCard[];
  onEnter: () => void;
  C: Colors;
  topInset: number;
  bottomInset: number;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    setCardIdx(i => Math.min(i + 1, cards.length - 1));
  };

  useEffect(() => {
    if (cardIdx < cards.length - 1) {
      timerRef.current = setTimeout(() => setCardIdx(i => i + 1), 4000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cardIdx, cards.length]);

  const card = cards[cardIdx];
  const isLast = cardIdx === cards.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={[card.statColor + '18', C.bg, C.bg] as [string, string, string]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
      />

      <Pressable
        style={{ flex: 1 }}
        onPress={() => { if (!isLast) advance(); }}
      >
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 36, paddingTop: topInset + 24, paddingBottom: 20,
        }}>
          <Text style={{
            fontSize: 72, fontFamily: 'Lora_700Bold', color: card.statColor,
            letterSpacing: -2, textAlign: 'center', lineHeight: 80,
          }}>
            {card.stat}
          </Text>
          <Text style={{
            fontSize: 15, color: C.textSub, textAlign: 'center',
            lineHeight: 26, maxWidth: 300, marginTop: 28,
          }}>
            {card.context}
          </Text>
          <Text style={{
            fontSize: 13, color: C.text, textAlign: 'center',
            fontStyle: 'italic', opacity: 0.75, marginTop: 24, lineHeight: 22,
          }}>
            {card.manas}
          </Text>
          {!!card.source && (
            <Text style={{
              fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted,
              textAlign: 'center', marginTop: 8,
            }}>
              {card.source}
            </Text>
          )}
          <Text style={{
            fontSize: 9, fontFamily: 'Inter_400Regular', color: C.textMuted,
            textAlign: 'center', marginTop: 6,
          }}>
            Manas is a wellness app, not a medical device or treatment.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 20 }}>
          {cards.map((_, i) => (
            <View key={i} style={{
              height: 6,
              width: i === cardIdx ? 22 : 6,
              borderRadius: 3,
              backgroundColor: i === cardIdx ? C.lavender : C.border,
            }} />
          ))}
        </View>

        {isLast && (
          <Pressable
            style={({ pressed }) => ({
              marginHorizontal: 24,
              marginBottom: bottomInset + 24,
              backgroundColor: C.lavender,
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={(e) => {
              e.stopPropagation?.();
              onEnter();
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg }}>
              Enter Manas
            </Text>
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const FLASHCARDS = useMemo(() => getFlashcards(C), [C]);
  const ALL_QUIZ_STEPS = useMemo(() => getAllQuizSteps(C), [C]);
  const insets = useSafeAreaInsets();
  const { user, setUser, updateUser } = useApp();
  const { updateProfile } = useAuth();
  const { phase: phaseParam } = useLocalSearchParams<{ phase?: string }>();
  const isRetake = !!(user?.onboardingComplete);
  const forceQuiz = phaseParam === 'quiz';
  const QUIZ_STEPS = useMemo(
    () => (forceQuiz || !isRetake) ? ALL_QUIZ_STEPS : ALL_QUIZ_STEPS.filter(s => s.id !== 'name'),
    [forceQuiz, isRetake, ALL_QUIZ_STEPS],
  );
  const isFreshOnboarding = forceQuiz || !isRetake;

  const [phase, setPhase] = useState<'cards' | 'quiz'>((isRetake || forceQuiz) ? 'quiz' : 'cards');
  const [cardIndex, setCardIndex] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<AnswersShape>({
    sharpness: null,
    thieves: [],
    endOfDay: null,
    preferredTime: null,
    mood: 3,
    sessionLength: null,
    name: '',
  });
  const [nameInput, setNameInput] = useState('');
  const [revealVisible, setRevealVisible] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const goToNextCard = () => {
    if (cardIndex < FLASHCARDS.length - 1) {
      setCardIndex(i => i + 1);
    } else {
      router.replace('/welcome');
    }
  };

  const handleQuizAnswer = (key: string, value: any) => {
    setAnswers(prev => {
      if (key === 'thieves') {
        const arr = prev.thieves;
        if (arr.includes(value as string)) return { ...prev, thieves: arr.filter(v => v !== value) };
        return { ...prev, thieves: [...arr, value as string] };
      }
      return { ...prev, [key]: value };
    });
  };

  const canAdvanceQuiz = (localAnswers?: AnswersShape) => {
    const a = localAnswers ?? answers;
    const step = QUIZ_STEPS[quizStep];
    switch (step.id) {
      case 'sharpness': return !!a.sharpness;
      case 'thieves': return a.thieves.length > 0;
      case 'endOfDay': return !!a.endOfDay;
      case 'preferredTime': return !!a.preferredTime;
      case 'mood': return true;
      case 'sessionLength': return !!a.sessionLength;
      case 'name': return nameInput.trim().length > 0;
      default: return false;
    }
  };

  const handleQuizNext = () => {
    if (!canAdvanceQuiz()) return;
    if (quizStep < QUIZ_STEPS.length - 1) {
      setQuizStep(q => q + 1);
    } else {
      if (!isFreshOnboarding) {
        updateUser({
          mood: answers.mood,
          goals: mapThievesToGoals(answers.thieves),
          time: mapPreferredTime(answers.preferredTime),
          experience: 'Beginner',
          sharpness: answers.sharpness as any,
          thieves: answers.thieves,
          endOfDay: answers.endOfDay as any,
          preferredTime: answers.preferredTime as any,
          sessionLength: answers.sessionLength as any,
        });
        router.canGoBack() ? router.back() : router.replace('/(tabs)');
      } else {
        setRevealVisible(true);
      }
    }
  };

  const handleSingleSelect = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleEnterManas = () => {
    const finalName = nameInput.trim() || answers.name;
    const mappedGoals = mapThievesToGoals(answers.thieves);
    const mappedTime = mapPreferredTime(answers.preferredTime);
    setUser({
      name: finalName,
      mood: answers.mood,
      goals: mappedGoals,
      time: mappedTime,
      experience: 'Beginner',
      onboardingComplete: true,
      plan: 'free',
      sharpness: answers.sharpness as any,
      thieves: answers.thieves,
      endOfDay: answers.endOfDay as any,
      preferredTime: answers.preferredTime as any,
      sessionLength: answers.sessionLength as any,
    });
    console.log("Saving onboarding:", {
      sharpness: answers.sharpness,
      thieves: answers.thieves,
      end_of_day: answers.endOfDay,
      preferred_time: answers.preferredTime,
      session_length: answers.sessionLength,
    });
    updateProfile({
      name: finalName,
      initial_mood: answers.mood,
      goals: mappedGoals,
      preferred_time: answers.preferredTime ?? null,
      experience: 'Beginner',
      onboarding_complete: true,
      sharpness: answers.sharpness ?? null,
      thieves: answers.thieves ?? [],
      end_of_day: answers.endOfDay ?? null,
      session_length: answers.sessionLength ?? null,
    }).catch(() => {});
    router.replace('/(tabs)');
  };

  const revealCards = useMemo(
    () => getRevealCards({ ...answers, name: nameInput.trim() || answers.name }, C),
    [revealVisible, C],
  );

  const step = QUIZ_STEPS[quizStep];
  const card = FLASHCARDS[cardIndex];

  if (revealVisible) {
    return (
      <RevealPhase
        cards={revealCards}
        onEnter={handleEnterManas}
        C={C}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );
  }

  if (phase === 'cards') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={card.gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Pressable
          style={[styles.skipBtn, { top: topInset + 12 }]}
          onPress={() => router.replace('/welcome')}
        >
          <Text style={[styles.skipText, { color: card.accent + 'AA' }]}>Skip</Text>
        </Pressable>

        <View style={[styles.cardShell, { paddingTop: topInset + 20 }]}>
          <View style={styles.cardUpper}>
            <View style={[styles.iconContainer, { backgroundColor: card.accent + '20', borderColor: card.accent + '40' }]}>
              <Ionicons name={card.icon} size={64} color={card.accent} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: card.accent }]}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </View>
          </View>

          <View style={styles.cardLower}>
            <View style={styles.dotsRow}>
              {FLASHCARDS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === cardIndex ? card.accent : card.accent + '40', width: i === cardIndex ? 24 : 8 },
                  ]}
                />
              ))}
            </View>
            {cardIndex === FLASHCARDS.length - 1 ? (
              <Pressable
                style={({ pressed }) => [
                  styles.beginBtn,
                  { backgroundColor: card.accent, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={goToNextCard}
              >
                <Text style={styles.beginText}>Begin</Text>
                <Ionicons name="arrow-forward" size={20} color={C.bg} />
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.nextCardBtn,
                  { borderColor: card.accent + '60', opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={goToNextCard}
              >
                <Text style={[styles.nextCardText, { color: card.accent }]}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color={card.accent} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  const canContinue = canAdvanceQuiz();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[C.bg, C.bg2, C.bg]} style={StyleSheet.absoluteFill} />

      <View style={[styles.quizHeader, { paddingTop: topInset + 12 }]}>
        {!isFreshOnboarding && quizStep === 0 && (
          <Pressable
            style={styles.closeBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color={C.textSub} />
          </Pressable>
        )}
        <Text style={[styles.stepTag, { color: step.accent }]}>{step.tag}</Text>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: step.accent, width: `${((quizStep + 1) / QUIZ_STEPS.length) * 100}%` as any },
            ]}
          />
        </View>
        <Text style={styles.stepLabel}>{quizStep + 1} of {QUIZ_STEPS.length}</Text>
      </View>

      <ScrollView
        style={styles.quizScroll}
        contentContainerStyle={styles.quizScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.quizQuestion}>{step.question}</Text>
        {!!step.sub && <Text style={styles.quizSub}>{step.sub}</Text>}

        {step.type === 'mood' && (
          <View style={styles.moodRow}>
            {step.options.map(opt => (
              <Pressable
                key={opt.value}
                style={({ pressed }) => [
                  styles.moodItem,
                  answers.mood === opt.value && { backgroundColor: step.accent + '25', borderColor: step.accent },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleQuizAnswer('mood', opt.value)}
              >
                <MaterialCommunityIcons
                  name={(opt as any).icon as any}
                  size={34}
                  color={answers.mood === opt.value ? step.accent : C.textSub}
                />
                <Text style={[styles.moodLabel, { color: answers.mood === opt.value ? step.accent : C.textSub }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {step.type === 'multi' && (
          <View style={styles.pillsGrid}>
            {step.options.map(opt => {
              const selected = answers.thieves.includes(opt.value as string);
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.pill,
                    selected && { backgroundColor: step.accent + '25', borderColor: step.accent },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleQuizAnswer('thieves', opt.value)}
                >
                  {selected && <Ionicons name="checkmark" size={14} color={step.accent} style={{ marginRight: 4 }} />}
                  <Text style={[styles.pillText, { color: selected ? step.accent : C.textSub }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step.type === 'single' && (
          <View style={styles.singleOptions}>
            {step.options.map(opt => {
              const selected = answers[step.id as keyof AnswersShape] === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.singleOption,
                    selected && { backgroundColor: step.accent + '20', borderColor: step.accent },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => handleSingleSelect(step.id, opt.value as string)}
                >
                  {'icon' in opt && (
                    <Ionicons
                      name={(opt as any).icon as any}
                      size={22}
                      color={selected ? step.accent : C.textSub}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.singleOptionText, { color: selected ? C.text : C.textSub }]}>
                      {opt.label}
                    </Text>
                    {'desc' in opt && !!(opt as any).desc && (
                      <Text style={[styles.singleOptionDesc, { color: selected ? step.accent : C.textMuted }]}>
                        {(opt as any).desc}
                      </Text>
                    )}
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={step.accent} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {step.type === 'text' && (
          <View style={styles.nameInputContainer}>
            <TextInput
              style={[styles.nameInput, { borderColor: step.accent + '60' }]}
              placeholder="Enter your name..."
              placeholderTextColor={C.textMuted}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleQuizNext}
              selectionColor={step.accent}
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.quizFooter, { paddingBottom: bottomInset + 24 }]}>
        {quizStep > 0 && (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => setQuizStep(q => q - 1)}
          >
            <Ionicons name="arrow-back" size={20} color={C.textSub} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.continueBtn,
            { backgroundColor: canContinue ? step.accent : step.accent + '40', flex: 1 },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleQuizNext}
        >
          <Text style={[styles.continueText, { color: canContinue ? C.bg : C.bg + '80' }]}>
            {step.id === 'name' ? 'See your profile →' : step.type === 'multi' ? 'Continue' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Legacy mapping helpers ──────────────────────────────────────────────────

function mapThievesToGoals(thieves: string[]): string[] {
  const goals: string[] = [];
  if (thieves.includes('sleep')) goals.push('Sleep');
  if (thieves.includes('focus')) goals.push('Focus');
  if (thieves.includes('stress') || thieves.includes('anxiety')) goals.push('Stress');
  if (thieves.includes('memory') || thieves.includes('creativity')) goals.push('Self-Growth');
  return goals.length > 0 ? goals : ['Focus'];
}

function mapPreferredTime(preferredTime: string | null): string {
  switch (preferredTime) {
    case 'Morning': return 'Morning';
    case 'MidMorning': return 'Morning';
    case 'Afternoon': return 'Midday';
    case 'Evening': return 'Evening';
    case 'Night': return 'Night';
    default: return 'Flexible';
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function createStyles(C: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  skipBtn: { position: 'absolute', right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  cardShell: {
    flex: 1, paddingHorizontal: 32, paddingBottom: 60,
    justifyContent: 'center', gap: 56,
  },
  cardUpper: { alignItems: 'center', gap: 32 },
  cardLower: { alignItems: 'center', gap: 24 },
  iconContainer: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  cardTextContainer: { alignItems: 'center', gap: 16 },
  cardTitle: { fontSize: 30, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: -0.5 },
  cardSubtitle: {
    fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub,
    textAlign: 'center', lineHeight: 26,
  },
  dotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  beginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 40, borderRadius: 100,
  },
  beginText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.bg },
  nextCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: 100, borderWidth: 1,
  },
  nextCardText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  quizHeader: { paddingHorizontal: 24, paddingBottom: 8, gap: 8, position: 'relative' },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: -4 },
  stepTag: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.4 },
  progressBarTrack: {
    height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: { height: 3, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  quizScroll: { flex: 1 },
  quizScrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 20 },
  quizQuestion: {
    fontSize: 28, fontFamily: 'Inter_700Bold', color: C.text,
    letterSpacing: -0.5, lineHeight: 38,
  },
  quizSub: {
    fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textSub,
    lineHeight: 22, marginTop: -6,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  moodItem: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 20,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  moodLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  pillText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  singleOptions: { gap: 10 },
  singleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  singleOptionText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  singleOptionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  nameInputContainer: { gap: 16 },
  nameInput: {
    fontSize: 22, fontFamily: 'Inter_400Regular', color: C.text,
    borderBottomWidth: 2, paddingVertical: 12,
  },
  quizFooter: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16,
  },
  backBtn: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border,
  },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 52, borderRadius: 16,
  },
  continueText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
}
