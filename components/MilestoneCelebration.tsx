import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  withSpring, runOnJS, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import C from '@/constants/colors';

interface Props {
  milestone: string | null;
  onDismiss: () => void;
}

const PARTICLE_COLORS = [C.lavender, C.sage, C.gold, C.mauve, C.rose, C.wisteria, '#7DD3FC', '#34D399'];

const MILESTONE_CONFIG: Record<string, { icon: string; title: string; message: string; color: string }> = {
  'streak-3': { icon: 'flame', title: '3-Day Streak!', message: 'Three days in a row. Momentum is building.', color: C.gold },
  'streak-7': { icon: 'trophy', title: 'One Week Strong!', message: 'A full week of showing up for yourself.', color: C.lavender },
  'streak-14': { icon: 'medal', title: 'Two Week Warrior!', message: "Two weeks of consistency. You're building something real.", color: C.sage },
  'streak-30': { icon: 'star', title: '30-Day Champion!', message: "A month of daily practice. This is who you are now.", color: C.gold },
  'first-game': { icon: 'game-controller', title: 'First Game Played!', message: 'Your cognitive journey has begun.', color: C.lavender },
  'journal-3': { icon: 'journal', title: 'Reflector Unlocked!', message: 'Three entries. Self-awareness is your superpower.', color: C.rose },
  'mindful': { icon: 'leaf', title: 'Mindful Badge!', message: 'You chose stillness. That takes strength.', color: C.sage },
};

function Particle({ index, color }: { index: number; color: string }) {
  const x = useSharedValue(0);
  const y = useSharedValue(-20);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  const startX = (Math.random() - 0.5) * 340;
  const delay = Math.random() * 600;
  const duration = 1400 + Math.random() * 600;

  useEffect(() => {
    x.value = withDelay(delay, withTiming(startX + (Math.random() - 0.5) * 80, { duration, easing: Easing.out(Easing.quad) }));
    y.value = withDelay(delay, withTiming(650 + Math.random() * 200, { duration, easing: Easing.in(Easing.quad) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }, () => {
      opacity.value = withDelay(duration - 400, withTiming(0, { duration: 400 }));
    }));
    rotate.value = withDelay(delay, withTiming(720 + Math.random() * 360, { duration }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const size = 6 + Math.random() * 8;

  return (
    <Reanimated.View
      style={[
        styles.particle,
        style,
        { width: size, height: size, backgroundColor: color, borderRadius: Math.random() > 0.5 ? size / 2 : 2 },
      ]}
    />
  );
}

export default function MilestoneCelebration({ milestone, onDismiss }: Props) {
  const config = milestone ? MILESTONE_CONFIG[milestone] : null;
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!milestone) return;
    cardScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    cardOpacity.value = withTiming(1, { duration: 300 });
    dismissTimer.current = setTimeout(() => onDismiss(), 3500);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [milestone]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  if (!milestone || !config) return null;

  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.particleContainer} pointerEvents="none">
          {particles.map(p => (
            <Particle key={p.id} index={p.id} color={p.color} />
          ))}
        </View>

        <Reanimated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={[config.color + '30', C.bg2]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.iconOrb, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
            <Ionicons name={config.icon as any} size={48} color={config.color} />
          </View>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>
          <Pressable
            style={[styles.dismissBtn, { backgroundColor: config.color }]}
            onPress={onDismiss}
          >
            <Text style={styles.dismissText}>Keep Going</Text>
          </Pressable>
        </Reanimated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
  card: {
    width: 300,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: C.bg2,
  },
  iconOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    color: C.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 24,
  },
  dismissBtn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 100,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: C.bg,
  },
});
