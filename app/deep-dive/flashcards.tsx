import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/constants/colors';
import { useDeepDive } from '@/context/DeepDiveContext';

type Phase = 'cards' | 'quiz' | 'done';

export default function FlashcardsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { topic, setFlashcardsResult } = useDeepDive();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const botInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const [phase, setPhase] = useState<Phase>('cards');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipRef = useRef(false);

  if (!topic) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: C.textSub }}>No topic selected</Text>
      </View>
    );
  }

  const cards = topic.cards;
  const questions = topic.questions;
  const card = cards[cardIndex];
  const question = questions[quizIndex];

  function flipCard() {
    if (flipRef.current) {
      Animated.spring(flipAnim, { toValue: 0, useNativeDriver: true }).start();
      flipRef.current = false;
      setFlipped(false);
    } else {
      Animated.spring(flipAnim, { toValue: 1, useNativeDriver: true }).start();
      flipRef.current = true;
      setFlipped(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function nextCard() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flipAnim.setValue(0);
    flipRef.current = false;
    setFlipped(false);
    if (cardIndex < cards.length - 1) {
      setCardIndex(cardIndex + 1);
    } else {
      setPhase('quiz');
    }
  }

  function handleAnswer(idx: number) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const correct = idx === question.correct;
    if (correct) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAnswers(prev => [...prev, correct]);
  }

  function nextQuestion() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (quizIndex < questions.length - 1) {
      setQuizIndex(quizIndex + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const finalScore = score + (selected === question.correct ? 1 : 0);
      setFlashcardsResult(finalScore, questions.length);
      setPhase('done');
    }
  }

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (phase === 'cards') {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.phasePill}>
              <Text style={[styles.phaseNum, { color: C.sage }]}>Phase 2</Text>
              <Text style={[styles.phaseLabel, { color: C.textMuted }]}>Flashcards</Text>
            </View>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === cardIndex ? C.sage : i < cardIndex ? C.sage + '60' : C.border },
                i === cardIndex && { width: 20 },
              ]}
            />
          ))}
        </View>

        <View style={styles.cardArea}>
          <Text style={[styles.cardCount, { color: C.textMuted }]}>
            {cardIndex + 1} / {cards.length} — tap to flip
          </Text>

          <Pressable style={styles.cardWrapper} onPress={flipCard}>
            {/* Front */}
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: C.card, borderColor: C.border },
                { transform: [{ rotateY: frontRotate }], backfaceVisibility: 'hidden' },
              ]}
            >
              <LinearGradient
                colors={[C.sage + '18', C.sage + '06']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.cardBadge, { backgroundColor: C.sage + '20' }]}>
                <Text style={[styles.cardBadgeText, { color: C.sage }]}>{card.kp}</Text>
              </View>
              <Text style={[styles.cardMain, { color: C.text }]}>{card.main}</Text>
              <View style={styles.flipHint}>
                <Ionicons name="swap-horizontal" size={14} color={C.textMuted} />
                <Text style={[styles.flipHintText, { color: C.textMuted }]}>Tap to reveal detail</Text>
              </View>
            </Animated.View>

            {/* Back */}
            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                { backgroundColor: C.cardAlt, borderColor: C.sage + '50' },
                { transform: [{ rotateY: backRotate }], backfaceVisibility: 'hidden' },
              ]}
            >
              <LinearGradient
                colors={[C.sage + '22', C.sage + '08']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="information-circle" size={24} color={C.sage} style={{ marginBottom: 8 }} />
              <Text style={[styles.cardDetail, { color: C.text }]}>{card.detail}</Text>
            </Animated.View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.nextBtn, { backgroundColor: C.sage + '18', borderColor: C.sage + '40' }, pressed && { opacity: 0.8 }]}
            onPress={nextCard}
          >
            <Text style={[styles.nextBtnText, { color: C.sage }]}>
              {cardIndex < cards.length - 1 ? 'Next Card' : 'Start Quiz'}
            </Text>
            <Ionicons name={cardIndex < cards.length - 1 ? 'chevron-forward' : 'checkmark'} size={16} color={C.sage} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'quiz') {
    const isCorrect = answered && selected === question.correct;
    const isWrong = answered && selected !== question.correct;

    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={[styles.header, { paddingTop: topInset + 12 }]}>
          <View style={styles.backBtn} />
          <View style={styles.headerCenter}>
            <View style={styles.phasePill}>
              <Text style={[styles.phaseNum, { color: C.sage }]}>Phase 2</Text>
              <Text style={[styles.phaseLabel, { color: C.textMuted }]}>Quiz</Text>
            </View>
          </View>
          <Text style={[styles.scoreText, { color: C.textMuted }]}>{score}/{questions.length}</Text>
        </View>

        <View style={styles.dots}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i < quizIndex
                    ? (answers[i] ? C.success : C.error)
                    : i === quizIndex ? C.sage : C.border,
                },
                i === quizIndex && { width: 20 },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.quizContent, { paddingBottom: botInset + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.questionCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <LinearGradient
              colors={[C.sage + '15', C.bg + '00']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.questionNum, { color: C.sage }]}>
              Question {quizIndex + 1} of {questions.length}
            </Text>
            <Text style={[styles.questionText, { color: C.text }]}>{question.q}</Text>
          </View>

          {question.opts.map((opt, i) => {
            const isSelected = selected === i;
            const isRight = answered && i === question.correct;
            const isBadChoice = answered && isSelected && !isRight;

            return (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.optBtn,
                  {
                    backgroundColor: isRight
                      ? C.success + '18'
                      : isBadChoice
                      ? C.error + '18'
                      : isSelected
                      ? C.sage + '15'
                      : C.card,
                    borderColor: isRight
                      ? C.success + '80'
                      : isBadChoice
                      ? C.error + '80'
                      : isSelected
                      ? C.sage + '60'
                      : C.border,
                    opacity: pressed && !answered ? 0.85 : 1,
                  },
                ]}
                onPress={() => handleAnswer(i)}
                disabled={answered}
              >
                <View style={[styles.optLetter, {
                  backgroundColor: isRight ? C.success + '30' : isBadChoice ? C.error + '30' : C.border + '60',
                }]}>
                  <Text style={[styles.optLetterText, {
                    color: isRight ? C.success : isBadChoice ? C.error : C.textMuted,
                  }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optText, { color: C.text, flex: 1 }]}>{opt}</Text>
                {isRight && <Ionicons name="checkmark-circle" size={18} color={C.success} />}
                {isBadChoice && <Ionicons name="close-circle" size={18} color={C.error} />}
              </Pressable>
            );
          })}

          {answered && (
            <View style={[styles.explanationCard, { backgroundColor: C.card, borderColor: isCorrect ? C.success + '40' : C.error + '40' }]}>
              <Text style={[styles.explanationLabel, { color: isCorrect ? C.success : C.error }]}>
                {isCorrect ? question.right : question.wrong}
              </Text>
              <Text style={[styles.explanationText, { color: C.textSub }]}>{question.explain}</Text>
              <Pressable
                style={({ pressed }) => [styles.nextBtn, { backgroundColor: C.sage + '18', borderColor: C.sage + '40', marginTop: 4 }, pressed && { opacity: 0.8 }]}
                onPress={nextQuestion}
              >
                <Text style={[styles.nextBtnText, { color: C.sage }]}>
                  {quizIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={C.sage} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const finalScore = score;
  const pct = Math.round((finalScore / questions.length) * 100);

  return (
    <View style={[styles.root, { backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <View style={[styles.doneCard, { backgroundColor: C.card, borderColor: C.border }]}>
        <LinearGradient colors={[C.sage + '20', C.bg + '00']} style={StyleSheet.absoluteFill} />
        <View style={[styles.doneIcon, { backgroundColor: C.sage + '20' }]}>
          <Ionicons name="checkmark-circle" size={40} color={C.sage} />
        </View>
        <Text style={[styles.doneTitle, { color: C.text }]}>Flashcards Complete</Text>
        <Text style={[styles.doneScore, { color: C.sage }]}>{finalScore}/{questions.length} correct</Text>
        <Text style={[styles.doneMsg, { color: C.textSub }]}>
          {pct >= 75
            ? 'Excellent recall. Ready for the Thread Puzzle.'
            : pct >= 50
            ? 'Good effort. The Thread Puzzle will reinforce these concepts.'
            : 'The Thread Puzzle will help connect these ideas.'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.nextBtn, { backgroundColor: C.sage, borderColor: 'transparent', marginTop: 8 }, pressed && { opacity: 0.85 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/deep-dive/thread'); }}
        >
          <Text style={[styles.nextBtnText, { color: C.bg }]}>Start Thread Puzzle</Text>
          <Ionicons name="git-network-outline" size={16} color={C.bg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  phaseLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  scoreText: { width: 38, textAlign: 'right', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dots: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 4 },
  dot: { height: 4, width: 10, borderRadius: 2 },
  cardArea: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 20 },
  cardCount: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  cardWrapper: { width: '100%', height: 260, position: 'relative' },
  card: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20, borderWidth: 1, padding: 24,
    overflow: 'hidden', justifyContent: 'center', gap: 16,
  },
  cardBack: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100,
  },
  cardBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardMain: { fontSize: 18, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  flipHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  flipHintText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  cardDetail: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 26 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  nextBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  quizContent: { paddingHorizontal: 20, gap: 10, paddingTop: 8 },
  questionCard: {
    borderRadius: 18, borderWidth: 1, padding: 20,
    gap: 10, overflow: 'hidden', marginBottom: 4,
  },
  questionNum: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  questionText: { fontSize: 17, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  optBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  optLetter: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  optLetterText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  optText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  explanationCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 8,
    marginTop: 4,
  },
  explanationLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  explanationText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  doneCard: {
    borderRadius: 24, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 12, overflow: 'hidden',
    width: '100%',
  },
  doneIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  doneScore: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  doneMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center' },
});
