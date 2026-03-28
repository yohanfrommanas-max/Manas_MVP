import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Pressable, TextInput,
  ScrollView, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useColors, type Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

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

function getAllQuizSteps(C: Colors) { return [
  {
    id: 'mood',
    question: 'How are you feeling lately?',
    accent: C.lavender,
    type: 'mood',
    options: [
      { label: 'Awful', icon: 'emoticon-cry-outline', value: 1 },
      { label: 'Down', icon: 'emoticon-sad-outline', value: 2 },
      { label: 'Okay', icon: 'emoticon-neutral-outline', value: 3 },
      { label: 'Good', icon: 'emoticon-happy-outline', value: 4 },
      { label: 'Great', icon: 'emoticon-excited-outline', value: 5 },
    ],
  },
  {
    id: 'goals',
    question: 'What brings you to Manas?',
    accent: C.sage,
    type: 'multi',
    options: [
      { label: 'Sleep', value: 'Sleep' },
      { label: 'Stress', value: 'Stress' },
      { label: 'Focus', value: 'Focus' },
      { label: 'Anxiety', value: 'Anxiety' },
      { label: 'Self-Growth', value: 'Self-Growth' },
      { label: 'Creativity', value: 'Creativity' },
    ],
  },
  {
    id: 'time',
    question: 'When do you usually practise wellness?',
    accent: C.gold,
    type: 'single',
    options: [
      { label: 'Early morning', icon: 'sunny', value: 'Morning' },
      { label: 'Midday break', icon: 'partly-sunny', value: 'Midday' },
      { label: 'Evening wind-down', icon: 'moon', value: 'Evening' },
      { label: 'Right before bed', icon: 'bed', value: 'Night' },
      { label: 'Whenever I can', icon: 'time', value: 'Flexible' },
    ],
  },
  {
    id: 'experience',
    question: 'Your experience with meditation?',
    accent: C.lavender,
    type: 'single',
    options: [
      { label: 'Completely new', icon: 'leaf', value: 'New' },
      { label: 'Tried it a few times', icon: 'sparkles', value: 'Beginner' },
      { label: 'Occasional practice', icon: 'fitness', value: 'Occasional' },
      { label: 'Regular practice', icon: 'star', value: 'Regular' },
      { label: 'Daily habit', icon: 'trophy', value: 'Experienced' },
    ],
  },
  {
    id: 'name',
    question: "What's your name?",
    accent: C.sage,
    type: 'text',
  },
]; }

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
  // forceQuiz (phase=quiz param) or retakes → quiz; unauthenticated intro → cards
  const [phase, setPhase] = useState<'cards' | 'quiz'>((isRetake || forceQuiz) ? 'quiz' : 'cards');
  const [cardIndex, setCardIndex] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    mood: null,
    goals: [] as string[],
    time: '',
    experience: '',
    name: '',
  });
  const [nameInput, setNameInput] = useState('');
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  const cardAnim = useSharedValue(0);
  const quizAnim = useSharedValue(0);
  const welcomeOpacity = useSharedValue(0);
  const welcomeScale = useSharedValue(0.8);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const goToNextCard = () => {
    if (cardIndex < FLASHCARDS.length - 1) {
      setCardIndex(i => i + 1);
    } else {
      // Flashcards are the pre-auth intro — go to Create Account
      router.replace('/welcome');
    }
  };

  const goToPrevCard = () => {
    if (cardIndex > 0) setCardIndex(i => i - 1);
  };

  const handleQuizAnswer = (key: string, value: any) => {
    setAnswers(prev => {
      if (key === 'goals') {
        const goals = prev.goals as string[];
        if (goals.includes(value)) {
          return { ...prev, goals: goals.filter(g => g !== value) };
        } else {
          return { ...prev, goals: [...goals, value] };
        }
      }
      return { ...prev, [key]: value };
    });
  };

  const canAdvanceQuiz = () => {
    const step = QUIZ_STEPS[quizStep];
    if (step.type === 'mood') return answers.mood !== null;
    if (step.type === 'multi') return (answers.goals as string[]).length > 0;
    if (step.type === 'single') return !!answers[step.id];
    if (step.type === 'text') return nameInput.trim().length > 0;
    return false;
  };

  const handleQuizNext = () => {
    if (!canAdvanceQuiz()) return;
    if (quizStep < QUIZ_STEPS.length - 1) {
      setQuizStep(q => q + 1);
    } else {
      if (!isFreshOnboarding) {
        updateUser({
          mood: answers.mood,
          goals: answers.goals,
          time: answers.time,
          experience: answers.experience,
        });
        router.canGoBack() ? router.back() : router.replace('/(tabs)');
      } else {
        const finalName = nameInput.trim() || answers.name;
        setWelcomeVisible(true);
        welcomeOpacity.value = withTiming(1, { duration: 600 });
        welcomeScale.value = withSpring(1);
        // Save profile to Supabase, then transition to feature flashcards
        setTimeout(() => {
          setUser({
            name: finalName,
            mood: answers.mood,
            goals: answers.goals,
            time: answers.time,
            experience: answers.experience,
            onboardingComplete: true,
            plan: 'free',
          });
          updateProfile({
            name: finalName,
            initial_mood: answers.mood,
            goals: answers.goals,
            preferred_time: answers.time,
            experience: answers.experience,
            onboarding_complete: true,
          });
          setWelcomeVisible(false);
          router.replace('/(tabs)');
        }, 2200);
      }
    }
  };

  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ scale: welcomeScale.value }],
  }));

  const step = QUIZ_STEPS[quizStep];
  const card = FLASHCARDS[cardIndex];

  if (welcomeVisible) {
    return (
      <View style={[styles.welcome, { paddingTop: topInset }]}>
        <LinearGradient colors={[C.bg, C.lavender + '20', C.bg]} style={StyleSheet.absoluteFill} />
        <Reanimated.View style={[styles.welcomeContent, welcomeStyle]}>
          <View style={[styles.welcomeOrb, { backgroundColor: C.lavender + '30' }]}>
            <Ionicons name="heart" size={48} color={C.lavender} />
          </View>
          <Text style={styles.welcomeTitle}>
            Welcome to Manas,
          </Text>
          <Text style={[styles.welcomeName, { color: C.lavender }]}>
            {nameInput.trim() || answers.name}
          </Text>
          <Text style={styles.welcomeSub}>Your journey to a clearer mind begins now.</Text>
        </Reanimated.View>
      </View>
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
        <View style={styles.progressBarTrack}>
          <Reanimated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: step.accent, width: `${((quizStep + 1) / QUIZ_STEPS.length) * 100}%` },
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

        {step.type === 'mood' && (
          <View style={styles.moodRow}>
            {step.options!.map(opt => (
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
          <Text style={styles.multiHint}>Select all that apply</Text>
        )}

        {step.type === 'multi' && (
          <View style={styles.pillsGrid}>
            {step.options!.map(opt => {
              const selected = (answers.goals as string[]).includes(opt.value as string);
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.pill,
                    selected && { backgroundColor: step.accent + '25', borderColor: step.accent },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleQuizAnswer('goals', opt.value)}
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
            {step.options!.map(opt => {
              const selected = answers[step.id] === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={({ pressed }) => [
                    styles.singleOption,
                    selected && { backgroundColor: step.accent + '20', borderColor: step.accent },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => handleQuizAnswer(step.id, opt.value)}
                >
                  <Ionicons
                    name={(opt as any).icon as any}
                    size={24}
                    color={selected ? step.accent : C.textSub}
                  />
                  <Text style={[styles.singleOptionText, { color: selected ? C.text : C.textSub }]}>
                    {opt.label}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={step.accent} style={{ marginLeft: 'auto' }} />
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

      <View style={[styles.quizFooter, { paddingBottom: insets.bottom + 24 }]}>
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
            { backgroundColor: canAdvanceQuiz() ? step.accent : step.accent + '40', flex: 1 },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleQuizNext}
        >
          <Text style={[styles.continueText, { color: canAdvanceQuiz() ? C.bg : C.bg + '80' }]}>
            {quizStep === QUIZ_STEPS.length - 1
              ? (!isFreshOnboarding ? 'Save Changes' : 'Enter Manas')
              : 'Continue'}
          </Text>
          <Ionicons
            name={quizStep === QUIZ_STEPS.length - 1
              ? (!isFreshOnboarding ? 'checkmark' : 'heart')
              : 'arrow-forward'}
            size={18}
            color={canAdvanceQuiz() ? C.bg : C.bg + '80'}
          />
        </Pressable>
      </View>
    </View>
  );
}

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
  quizHeader: { paddingHorizontal: 24, paddingBottom: 8, gap: 10, position: 'relative' },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: -4 },
  progressBarTrack: {
    height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: { height: 3, borderRadius: 2 },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
  quizScroll: { flex: 1 },
  quizScrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, gap: 24 },
  quizQuestion: {
    fontSize: 30, fontFamily: 'Inter_700Bold', color: C.text,
    letterSpacing: -0.5, lineHeight: 40,
  },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  moodItem: {
    flex: 1, alignItems: 'center', gap: 8, paddingVertical: 20,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card,
  },
  moodLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  multiHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: -12 },
  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 18, borderRadius: 100,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  pillText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  singleOptions: { gap: 12 },
  singleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 18, paddingHorizontal: 20, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  singleOptionText: { fontSize: 16, fontFamily: 'Inter_500Medium', flex: 1 },
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
  welcome: {
    flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center',
  },
  welcomeContent: { alignItems: 'center', gap: 20, paddingHorizontal: 32 },
  welcomeOrb: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeTitle: { fontSize: 28, fontFamily: 'Inter_400Regular', color: C.text, textAlign: 'center' },
  welcomeName: { fontSize: 36, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: -0.5 },
  welcomeSub: { fontSize: 16, fontFamily: 'Inter_400Regular', color: C.textSub, textAlign: 'center', lineHeight: 26 },
});
}
