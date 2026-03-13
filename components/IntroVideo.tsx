import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const introSource = require('@/assets/videos/intro.mp4');

interface IntroVideoProps {
  onDone: () => void;
}

function NativeVideoPlayer({ onEnd }: { onEnd: () => void }) {
  const { useVideoPlayer, VideoView } = require('expo-video');
  const player = useVideoPlayer(introSource, (p: any) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const sub = player.addListener('playToEnd', onEnd);
    return () => sub.remove();
  }, [player, onEnd]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

function WebVideoPlayer({ onEnd }: { onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.play().catch(() => {});
    const handler = () => onEnd();
    el.addEventListener('ended', handler);
    return () => el.removeEventListener('ended', handler);
  }, [onEnd]);

  const source = typeof introSource === 'object' && introSource.uri
    ? introSource.uri
    : typeof introSource === 'number'
      ? introSource
      : introSource;

  return (
    <video
      ref={videoRef}
      src={typeof source === 'string' ? source : undefined}
      style={{ width: '100%', height: '100%', objectFit: 'cover' } as any}
      playsInline
      muted
      autoPlay
    />
  );
}

export default function IntroVideo({ onDone }: IntroVideoProps) {
  const insets = useSafeAreaInsets();
  const doneCalledRef = useRef(false);

  const finish = useCallback(() => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    onDone();
  }, [onDone]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <WebVideoPlayer onEnd={finish} />
      ) : (
        <NativeVideoPlayer onEnd={finish} />
      )}
      <Pressable
        onPress={finish}
        style={[
          styles.skipBtn,
          {
            top: (Platform.OS === 'web' ? 67 : insets.top) + 12,
            right: 20,
          },
        ]}
        hitSlop={12}
      >
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.9)" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  skipBtn: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.9)',
  },
});
