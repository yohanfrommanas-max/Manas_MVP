import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Video } from "expo-av";

const ONBOARDING_VIDEO = require("../assets/Video/OnboardingVideo.mp4");

export default function OnboardingScreen({ onFinish }) {
  const [videoFinished, setVideoFinished] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  
  // Slides state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesFinished, setSlidesFinished] = useState(false);
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  
  const slideFade = useRef(new Animated.Value(1)).current;
const slideScale = useRef(new Animated.Value(1)).current;

/* 🔥 ADD THIS RIGHT HERE */
const progressAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (slidesFinished && !showResults) {
    Animated.timing(progressAnim, {
      toValue: (currentQuestion + 1) / quizQuestions.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }
}, [currentQuestion, slidesFinished]);

  const slides = [
    {
      icon: "🧠",
      title: "Train Your Mind Daily",
      description: "Short, science-backed exercises that strengthen focus, memory, and cognitive flexibility in just 5-10 minutes."
    },
    {
      icon: "🪷",
      title: "Find Your Calm",
      description: "Guided breathing, sleep journeys, and ambient sounds to help you relax, reset, and recover from daily stress."
    },
    {
      icon: "📝",
      title: "Track Your Progress",
      description: "Daily reflections and insights help you understand your patterns and celebrate your growth over time."
    }
  ];

  const quizQuestions = [
    {
      id: "goal",
      title: "What do you want right now?",
      options: [
        { value: "calm", label: "Calm" },
        { value: "focus", label: "Focus" },
        { value: "energy", label: "Energy" },
        { value: "sleep", label: "Sleep" },
        { value: "not_sure", label: "Not sure" },
      ]
    },
    {
      id: "current_state",
      title: "How do you feel?",
      options: [
        { value: "overwhelmed", label: "Overwhelmed" },
        { value: "distracted", label: "Distracted" },
        { value: "tired", label: "Tired" },
        { value: "restless", label: "Restless" },
        { value: "okay", label: "Okay" },
      ]
    },
    {
      id: "time",
      title: "How much time do you have per day?",
      options: [
        { value: "30sec", label: "30 sec" },
        { value: "2min", label: "2 min" },
        { value: "5min", label: "5 min" },
        { value: "10min", label: "10+ min" },
      ]
    },
    {
      id: "typical_time",
      title: "When will you mostly use Manas?",
      options: [
        { value: "morning", label: "Morning" },
        { value: "midday", label: "Midday" },
        { value: "evening", label: "Evening" },
        { value: "bedtime", label: "Bedtime" },
        { value: "varies", label: "Varies" },
      ]
    },
    {
      id: "mode_preference",
      title: "What do you prefer?",
      options: [
        { value: "breathing", label: "Breathing" },
        { value: "meditation", label: "Meditation" },
        { value: "both", label: "Both" },
        { value: "quiet", label: "Quiet (no voice)" },
      ]
    },
    {
      id: "guidance_tone",
      title: "How should we guide you?",
      options: [
        { value: "gentle", label: "Gentle" },
        { value: "clear", label: "Clear" },
        { value: "minimal", label: "Minimal" },
      ]
    },
    {
      id: "consistency_style",
      title: "What helps you stay consistent?",
      options: [
        { value: "tiny_streak", label: "Tiny streak" },
        { value: "gentle_reminders", label: "Gentle reminders" },
        { value: "short_sessions", label: "Short sessions only" },
        { value: "no_tracking", label: "No tracking" },
      ]
    },
    {
      id: "reminders",
      title: "Want daily reminders?",
      options: [
        { value: "yes", label: "Yes" },
        { value: "not_now", label: "Not now" },
        { value: "no", label: "No" },
      ]
    },
  ];

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2500);

    return () => clearTimeout(skipTimer);
  }, []);

  // Slides navigation
  const handlePrevious = () => {
    if (currentSlide > 0) {
      Animated.parallel([
        Animated.timing(slideFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(currentSlide - 1);
        
        Animated.parallel([
          Animated.timing(slideFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      Animated.parallel([
        Animated.timing(slideFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(currentSlide + 1);
        
        Animated.parallel([
          Animated.timing(slideFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Move to quiz
      setSlidesFinished(true);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;
        
        if (gestureState.dx < -swipeThreshold) {
          handleNext();
        }
        else if (gestureState.dx > swipeThreshold) {
          handlePrevious();
        }
      },
    })
  ).current;

  // Quiz navigation
  const handleAnswer = (questionId, value) => {
    Animated.parallel([
      Animated.timing(slideFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideScale, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnswers({ ...answers, [questionId]: value });
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
      
      Animated.parallel([
        Animated.timing(slideFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleQuizBack = () => {
    if (currentQuestion > 0) {
      Animated.parallel([
        Animated.timing(slideFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentQuestion(currentQuestion - 1);
        
        Animated.parallel([
          Animated.timing(slideFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleQuizNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      Animated.parallel([
        Animated.timing(slideFade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentQuestion(currentQuestion + 1);
        
        Animated.parallel([
          Animated.timing(slideFade, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const getRecommendation = () => {
    const goal = answers.goal || "calm";
    const time = answers.time || "2min";
    const mode = answers.mode_preference || "breathing";
    const tone = answers.guidance_tone || "gentle";
    
    const goalLabels = {
      calm: "Calm",
      focus: "Focus",
      energy: "Energy",
      sleep: "Sleep",
      not_sure: "Quick Reset"
    };
    
    const timeLabels = {
      "30sec": "30 sec",
      "2min": "2 min",
      "5min": "5 min",
      "10min": "10+ min"
    };
    
    const modeLabels = {
      breathing: "Breathing",
      meditation: "Meditation",
      both: "Both",
      quiet: "Quiet"
    };
    
    return {
      summary: `${goalLabels[goal]} • ${timeLabels[time]} • ${modeLabels[mode]} • ${tone}`,
      mainActivity: `${timeLabels[time]} ${goalLabels[goal]} ${modeLabels[mode] === "Both" ? "Session" : modeLabels[mode]}`,
      quickReset: `30-sec Reset ${modeLabels[mode] === "Meditation" ? "Meditation" : "Breath"}`,
    };
  };

  // Results Screen
  if (showResults) {
    const recommendation = getRecommendation();
    
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingVertical: 40,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "rgba(255,255,255,0.35)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 64 }}>✨</Text>
            </View>

            <Text
              style={{
                fontSize: 32,
                fontWeight: "900",
                color: "#0F172A",
                textAlign: "center",
                marginBottom: 12,
                letterSpacing: 0.2,
              }}
            >
              Your Manas plan is ready
            </Text>

            <View
              style={{
                width: "100%",
                backgroundColor: "rgba(255,255,255,0.72)",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.9)",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "900",
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  color: "rgba(11,18,32,0.70)",
                  marginBottom: 12,
                }}
              >
                Today's Plan
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#0F172A",
                  lineHeight: 24,
                }}
              >
                {recommendation.summary}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onFinish}
              activeOpacity={0.9}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <LinearGradient
                colors={["#4F46E5", "#7C3AED"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 18,
                  borderRadius: 999,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900", marginBottom: 4 }}>
                  Start now
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" }}>
                  {recommendation.mainActivity}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                width: "100%",
                flexDirection: "row",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <TouchableOpacity
                onPress={onFinish}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.72)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.9)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#4F46E5", fontSize: 15, fontWeight: "900", marginBottom: 2 }}>
                  Quick reset
                </Text>
                <Text style={{ color: "rgba(11,18,32,0.65)", fontSize: 11, fontWeight: "600" }}>
                  {recommendation.quickReset}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onFinish}
                activeOpacity={0.9}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.72)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.9)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#4F46E5", fontSize: 15, fontWeight: "900", marginBottom: 2 }}>
                  Browse
                </Text>
                <Text style={{ color: "rgba(11,18,32,0.65)", fontSize: 11, fontWeight: "600" }}>
                  Explore library
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onFinish}
              style={{ paddingVertical: 12 }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#4F46E5",
                  textDecorationLine: "underline",
                }}
              >
                Personalise more
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

// Quiz Questions
if (slidesFinished && !showResults) {
  const question = quizQuestions[currentQuestion];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 30 }}>
          
          {/* Progress Bar */}
          <View
            style={{
              height: 8,
              backgroundColor: "rgba(255,255,255,0.35)",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                width: progressWidth,
                backgroundColor: "#4F46E5",
                borderRadius: 999,
              }}
            />
          </View>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "rgba(11,18,32,0.65)",
              marginBottom: 30,
            }}
          >
            {currentQuestion + 1} of {quizQuestions.length}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
        >
          <Animated.View
            style={{
              opacity: slideFade,
              transform: [{ scale: slideScale }],
            }}
          >
            {/* Question Card */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.45)",
                borderRadius: 28,
                padding: 28,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.8)",
                shadowColor: "#6366f1",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 30,
                marginBottom: 32,
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#0F172A",
                  lineHeight: 32,
                  textAlign: "center",
                }}
              >
                {question.title}
              </Text>
            </View>

            {/* Options */}
            <View style={{ gap: 16 }}>
              {question.options.map((option, index) => {
                const isSelected =
                  answers[question.id] === option.value;

                return (
                  <Animated.View
                    key={option.value}
                    style={{
                      transform: [
                        {
                          translateY: slideFade.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20 * (index + 1), 0],
                          }),
                        },
                      ],
                      opacity: slideFade,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        handleAnswer(question.id, option.value)
                      }
                    >
                      <LinearGradient
                        colors={
                          isSelected
                            ? ["#4F46E5", "#7C3AED"]
                            : [
                                "rgba(255,255,255,0.9)",
                                "rgba(255,255,255,0.75)",
                              ]
                        }
                        style={{
                          paddingVertical: 18,
                          paddingHorizontal: 22,
                          borderRadius: 20,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: "rgba(255,255,255,0.9)",
                          shadowColor: isSelected
                            ? "#4F46E5"
                            : "#000",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: isSelected ? 0.35 : 0.05,
                          shadowRadius: 20,
                          elevation: isSelected ? 8 : 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "800",
                            color: isSelected
                              ? "#FFFFFF"
                              : "#0F172A",
                            textAlign: "center",
                          }}
                        >
                          {option.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}


  // Initial Slides (after video)
  if (videoFinished && !slidesFinished) {
    return (
      <LinearGradient
        colors={["#7FE7F2", "#A5B4FC", "#C084FC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Tap Areas for Navigation */}
          <View style={{ flex: 1 }}>
            {/* Left tap area - Previous */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handlePrevious}
              disabled={currentSlide === 0}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                zIndex: 10,
              }}
            />

            {/* Right tap area - Next */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleNext}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: "30%",
                zIndex: 10,
              }}
            />

            {/* Content */}
            <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
              <Animated.View
                style={{
                  opacity: slideFade,
                  transform: [{ scale: slideScale }],
                }}
              >
                {currentSlide < 3 ? (
                <View style={{ alignItems: "center" }}>
                  {/* Icon in a frosted glass orb */}
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "rgba(255,255,255,0.40)",
                      borderWidth: 1.5,
                      borderColor: "rgba(255,255,255,0.85)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 36,
                      shadowColor: "#4F46E5",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.18,
                      shadowRadius: 24,
                    }}
                  >
                    <Text style={{ fontSize: 56 }}>{slides[currentSlide].icon}</Text>
                  </View>

                  {/* Title with decorative accent line */}
                  <View style={{ alignItems: "center", marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 30,
                        fontWeight: "900",
                        color: "#0F172A",
                        textAlign: "center",
                        letterSpacing: 0.2,
                        lineHeight: 37,
                        marginBottom: 12,
                      }}
                    >
                      {slides[currentSlide].title}
                    </Text>
                    <View
                      style={{
                        width: 36,
                        height: 3,
                        borderRadius: 999,
                        backgroundColor: "#4F46E5",
                        opacity: 0.7,
                      }}
                    />
                  </View>

                  {/* Description in a soft frosted card */}
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.38)",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.80)",
                      paddingHorizontal: 24,
                      paddingVertical: 20,
                      shadowColor: "#6366f1",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#334155",
                        textAlign: "center",
                        lineHeight: 26,
                        fontWeight: "500",
                        letterSpacing: 0.1,
                      }}
                    >
                      {slides[currentSlide].description}
                    </Text>
                  </View>
                </View>
                ) : (
                  <View style={{ alignItems: "center" }}>
                    {/* Logo with glow ring */}
                    <View
                      style={{
                        width: 160,
                        height: 160,
                        borderRadius: 80,
                        backgroundColor: "rgba(255,255,255,0.30)",
                        borderWidth: 1.5,
                        borderColor: "rgba(255,255,255,0.80)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 32,
                        shadowColor: "#7C3AED",
                        shadowOffset: { width: 0, height: 12 },
                        shadowOpacity: 0.22,
                        shadowRadius: 32,
                      }}
                    >
                      <Image
                        source={require("../assets/manas-logo-premium.png")}
                        style={{ width: 108, height: 108 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* "Welcome to" label chip */}
                    <View
                      style={{
                        backgroundColor: "rgba(79,70,229,0.12)",
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: "rgba(79,70,229,0.25)",
                        paddingHorizontal: 16,
                        paddingVertical: 5,
                        marginBottom: 14,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#4F46E5", letterSpacing: 1.2, textTransform: "uppercase" }}>
                        Welcome to Manas
                      </Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 34,
                        fontWeight: "900",
                        color: "#0F172A",
                        textAlign: "center",
                        marginBottom: 16,
                        letterSpacing: 0.2,
                        lineHeight: 42,
                      }}
                    >
                      The Journey{"\n"}Within
                    </Text>

                    {/* Description card */}
                    <View
                      style={{
                        backgroundColor: "rgba(255,255,255,0.38)",
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.80)",
                        paddingHorizontal: 24,
                        paddingVertical: 18,
                        marginBottom: 16,
                        shadowColor: "#6366f1",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#334155",
                          textAlign: "center",
                          lineHeight: 24,
                          fontWeight: "500",
                        }}
                      >
                        Build focus, calm, and resilience through short daily training.
                      </Text>
                    </View>

                    {/* Pill stats row */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      {["5–10 min/day", "Progress you feel", "Science-backed"].map((tag) => (
                        <View
                          key={tag}
                          style={{
                            backgroundColor: "rgba(255,255,255,0.50)",
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.85)",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#475569" }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Bottom Section */}
            <View style={{ paddingHorizontal: 32, paddingBottom: 48 }}>
              {/* Dots */}
              <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 32, gap: 8, alignItems: "center" }}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={{
                      width: currentSlide === index ? 32 : 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: currentSlide === index
                        ? "#4F46E5"
                        : "rgba(255,255,255,0.55)",
                      borderWidth: currentSlide === index ? 0 : 1,
                      borderColor: "rgba(79,70,229,0.35)",
                      shadowColor: currentSlide === index ? "#4F46E5" : "transparent",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.5,
                      shadowRadius: 6,
                    }}
                  />
                ))}
              </View>

              {/* Main Button */}
              {currentSlide === 3 && (
              <TouchableOpacity
                onPress={handleNext}
                activeOpacity={0.88}
                style={{ width: "100%" }}
              >
                <LinearGradient
                  colors={["#4338CA", "#6D28D9", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 20,
                    borderRadius: 999,
                    alignItems: "center",
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.38,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 17, fontWeight: "900", letterSpacing: 0.4 }}>
                    Let's personalise  →
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

              {/* Skip hint for first 3 slides */}
              {currentSlide < 3 && (
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "rgba(11,18,32,0.50)",
                      fontWeight: "600",
                    }}
                  >
                    <Text
                      onPress={() => setSlidesFinished(true)}
                      style={{ color: "#4F46E5", fontWeight: "700" }}
                    >
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Video Screen
  return (
    <View style={{ flex: 1 }}>
      <Video
        source={ONBOARDING_VIDEO}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="contain"
        isLooping={false}
        shouldPlay
        isMuted
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            setVideoFinished(true);
          }
        }}
      />
      
      {showSkip && (
        <SafeAreaView style={{ position: "absolute", top: 0, right: 0, padding: 20 }}>
          <TouchableOpacity
            onPress={() => setVideoFinished(true)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.92)",
              borderWidth: 1.5,
              borderColor: "rgba(79,70,229,0.40)",
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#4F46E5", letterSpacing: 0.3 }}>
              Skip →
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}