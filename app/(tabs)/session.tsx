import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import {
  pauseMeditationSound,
  playMeditationSound,
  prewarmMeditationSound,
  stopMeditationSound,
} from '@/constants/meditation-audio';
import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    sec.toString().padStart(2, '0'),
  ].join(':');
}

export default function SessionScreen() {
  const {
    currentDurationMinutes,
    currentSound,
    availableTracks,
    currentEndingBell,
    availableEndingBells,
  } = useSessionState();
  const selectedTrackUrl = useMemo(() => {
    return availableTracks.find((track) => track.title === currentSound)?.media_url;
  }, [availableTracks, currentSound]);
  const selectedTrackCacheKey = useMemo(() => {
    const selectedTrack = availableTracks.find((track) => track.title === currentSound);
    if (!selectedTrack) return '';
    return selectedTrack.uuid || selectedTrack.title;
  }, [availableTracks, currentSound]);
  const selectedEndingBellUrl = useMemo(() => {
    return availableEndingBells.find((track) => track.title === currentEndingBell)?.media_url;
  }, [availableEndingBells, currentEndingBell]);

  const initialSecondsRef = useRef(currentDurationMinutes * 60);
  const [remaining, setRemaining] = useState(initialSecondsRef.current);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const meditationAudioRef = useRef<Audio.Sound | null>(null);
  const meditationAudioKeyRef = useRef<string>('');
  const endingBellAudioRef = useRef<Audio.Sound | null>(null);
  const endingBellAudioUrlRef = useRef<string>('');
  const hasPlayedEndingBellRef = useRef(false);
  const breathingAnim = useRef(new Animated.Value(0)).current;

  const stopMeditationAudio = useCallback(async () => {
    await stopMeditationSound(meditationAudioRef.current);
    meditationAudioRef.current = null;
    meditationAudioKeyRef.current = '';
  }, []);

  const pauseMeditationAudio = useCallback(async () => {
    await pauseMeditationSound(meditationAudioRef.current);
  }, []);

  const stopEndingBellAudio = useCallback(async () => {
    if (!endingBellAudioRef.current) return;
    try {
      await endingBellAudioRef.current.stopAsync();
    } catch {
      // ignore stop errors while cleaning up
    }
    try {
      await endingBellAudioRef.current.unloadAsync();
    } catch {
      // ignore unload errors while cleaning up
    }
    endingBellAudioRef.current = null;
    endingBellAudioUrlRef.current = '';
  }, []);

  const startMeditationAudio = useCallback(async () => {
    if (!selectedTrackUrl || !selectedTrackCacheKey) return;

    if (
      meditationAudioRef.current &&
      meditationAudioKeyRef.current === selectedTrackCacheKey
    ) {
      try {
        await meditationAudioRef.current.playAsync();
        return;
      } catch {
        await stopMeditationAudio();
      }
    }

    if (meditationAudioRef.current) {
      await stopMeditationAudio();
    }

    try {
      meditationAudioRef.current = await playMeditationSound(selectedTrackCacheKey, selectedTrackUrl);
      meditationAudioKeyRef.current = selectedTrackCacheKey;
    } catch {
      // keep session timer running even if audio fails
    }
  }, [selectedTrackCacheKey, selectedTrackUrl, stopMeditationAudio]);

  const playEndingBellAudio = useCallback(async () => {
    if (!selectedEndingBellUrl) return;
    if (
      endingBellAudioRef.current &&
      endingBellAudioUrlRef.current === selectedEndingBellUrl
    ) {
      try {
        await endingBellAudioRef.current.playFromPositionAsync(0);
        return;
      } catch {
        await stopEndingBellAudio();
      }
    }

    await stopEndingBellAudio();
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: selectedEndingBellUrl },
        { shouldPlay: true, isLooping: false }
      );
      endingBellAudioRef.current = sound;
      endingBellAudioUrlRef.current = selectedEndingBellUrl;
    } catch {
      // keep completion flow working even if ending bell fails
    }
  }, [selectedEndingBellUrl, stopEndingBellAudio]);

  useFocusEffect(
    useCallback(() => {
      const minutes = currentDurationMinutes;
      initialSecondsRef.current = minutes * 60;

      if (initialSecondsRef.current <= 0) {
        setRemaining(0);
        setIsPaused(true);
        pausedRef.current = true;
        void stopMeditationAudio();
        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          void stopMeditationAudio();
        };
      }

      setRemaining(initialSecondsRef.current);
      setIsPaused(false);
      pausedRef.current = false;
      hasPlayedEndingBellRef.current = false;
      void startMeditationAudio();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      intervalRef.current = setInterval(() => {
        if (pausedRef.current) return;

        setRemaining((prev) => {
          return prev <= 1 ? 0 : prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        void stopMeditationAudio();
        void stopEndingBellAudio();
      };
    }, [currentDurationMinutes, startMeditationAudio, stopEndingBellAudio, stopMeditationAudio])
  );

  useEffect(() => {
    if (!selectedTrackUrl || !selectedTrackCacheKey) return;
    void prewarmMeditationSound(selectedTrackCacheKey, selectedTrackUrl);
  }, [selectedTrackCacheKey, selectedTrackUrl]);

  useEffect(() => {
    if (!selectedTrackCacheKey) return;
    if (meditationAudioKeyRef.current === selectedTrackCacheKey) return;
    if (!meditationAudioRef.current) return;
    void stopMeditationAudio();
  }, [selectedTrackCacheKey, stopMeditationAudio]);

  useEffect(() => {
    if (!selectedEndingBellUrl) return;
    if (endingBellAudioUrlRef.current === selectedEndingBellUrl) return;
    if (!endingBellAudioRef.current) return;
    void stopEndingBellAudio();
  }, [selectedEndingBellUrl, stopEndingBellAudio]);

  useEffect(() => {
    if (remaining !== 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    pausedRef.current = true;
    setIsPaused(true);

    if (!hasPlayedEndingBellRef.current) {
      hasPlayedEndingBellRef.current = true;
      void playEndingBellAudio();
    }
  }, [playEndingBellAudio, remaining]);

  const hasCompleted = remaining === 0;
  const showFinish = hasCompleted || (isPaused && remaining > 0);
  const isMeditationActive = remaining > 0 && !isPaused;

  useEffect(() => {
    if (!isMeditationActive) {
      breathingAnim.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
    };
  }, [breathingAnim, isMeditationActive]);

  const auraScale = breathingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const auraOpacity = breathingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.2],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.timerWrapper}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.breathAura,
              {
                opacity: auraOpacity,
                transform: [{ scale: auraScale }],
              },
            ]}
          />
          <View pointerEvents="none" style={styles.breathCore} />
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
        </View>

        <View style={styles.bottomControls}>
          {!hasCompleted ? (
            <Pressable
              onPress={() => {
                const next = !isPaused;
                setIsPaused(next);
                pausedRef.current = next;
                if (next) {
                  void pauseMeditationAudio();
                  return;
                }
                void startMeditationAudio();
              }}
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}>
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={40}
                color={PALETTE.pale}
              />
            </Pressable>
          ) : null}

          {showFinish ? (
            <Pressable
              onPress={() => {
                void Promise.all([stopMeditationAudio(), stopEndingBellAudio()]).finally(() => {
                  router.back();
                });
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.9 }]}>
              <Text style={styles.secondaryButtonText}>Finish</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.ink,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 32 : 12,
    paddingBottom: 32,
  },
  timerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathAura: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(126,184,212,0.28)',
  },
  breathCore: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 999,
    backgroundColor: 'rgba(126,184,212,0.08)',
  },
  timerText: {
    fontSize: 56,
    color: PALETTE.pale,
    fontVariant: ['tabular-nums'],
    zIndex: 1,
  },
  bottomControls: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    height: 120,
    alignItems: 'center',
  },
  primaryButton: {
    position: 'absolute',
    bottom: 64,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: PALETTE.pale,
    backgroundColor: PALETTE.pale,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: PALETTE.ink,
  },
});

