import Ionicons from '@expo/vector-icons/Ionicons';
import { Audio } from 'expo-av';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

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
  const { currentDurationMinutes, currentSound, availableTracks } = useSessionState();
  const selectedTrackUrl = useMemo(() => {
    return availableTracks.find((track) => track.title === currentSound)?.media_url;
  }, [availableTracks, currentSound]);

  const initialSecondsRef = useRef(currentDurationMinutes * 60);
  const [remaining, setRemaining] = useState(initialSecondsRef.current);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const meditationAudioRef = useRef<Audio.Sound | null>(null);

  const stopMeditationAudio = useCallback(async () => {
    if (!meditationAudioRef.current) return;

    try {
      await meditationAudioRef.current.stopAsync();
    } catch {
      // ignore stop errors while cleaning up
    }

    try {
      await meditationAudioRef.current.unloadAsync();
    } catch {
      // ignore unload errors while cleaning up
    }

    meditationAudioRef.current = null;
  }, []);

  const pauseMeditationAudio = useCallback(async () => {
    if (!meditationAudioRef.current) return;
    try {
      await meditationAudioRef.current.pauseAsync();
    } catch {
      // ignore pause errors while toggling playback
    }
  }, []);

  const startMeditationAudio = useCallback(async () => {
    if (meditationAudioRef.current) {
      try {
        await meditationAudioRef.current.playAsync();
        return;
      } catch {
        await stopMeditationAudio();
      }
    }

    if (!selectedTrackUrl) return;

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: selectedTrackUrl },
        { shouldPlay: true, isLooping: true }
      );
      meditationAudioRef.current = sound;
    } catch {
      // keep session timer running even if audio fails
    }
  }, [selectedTrackUrl, stopMeditationAudio]);

  useFocusEffect(
    useCallback(() => {
      const minutes = currentDurationMinutes;
      initialSecondsRef.current = minutes * 60;

      if (initialSecondsRef.current <= 0) {
        router.back();
        return;
      }

      setRemaining(initialSecondsRef.current);
      setIsPaused(false);
      pausedRef.current = false;
      void startMeditationAudio();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      intervalRef.current = setInterval(() => {
        if (pausedRef.current) return;

        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            void stopMeditationAudio();
            router.back();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        void stopMeditationAudio();
      };
    }, [currentDurationMinutes, startMeditationAudio, stopMeditationAudio])
  );

  const showFinish = isPaused && remaining > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.timerWrapper}>
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
        </View>

        <View style={styles.bottomControls}>
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

          {showFinish ? (
            <Pressable
              onPress={() => {
                void stopMeditationAudio().finally(() => {
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
  timerText: {
    fontSize: 56,
    color: PALETTE.pale,
    fontVariant: ['tabular-nums'],
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

