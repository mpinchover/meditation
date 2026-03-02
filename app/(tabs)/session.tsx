import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { getCurrentDurationMinutes } from '@/constants/session';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

export default function SessionScreen() {
  const initialSeconds = getCurrentDurationMinutes() * 60;
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialSeconds <= 0) {
      router.back();
      return;
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
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
    };
  }, [isPaused]);

  const showFinish = isPaused && remaining > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.timerWrapper}>
          <Text style={styles.timerText}>{formatTime(remaining)}</Text>
        </View>

        <View style={styles.bottomControls}>
          <Pressable
            onPress={() => setIsPaused((prev) => !prev)}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }]}>
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={28}
              color={PALETTE.pale}
            />
          </Pressable>

          {showFinish ? (
            <Pressable
              onPress={() => router.back()}
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
    left: 0,
    right: 0,
    bottom: 24,
    height: 120,
    alignItems: 'center',
  },
  primaryButton: {
    position: 'absolute',
    bottom: 64,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.3)',
    backgroundColor: 'rgba(74,111,165,0.5)',
  },
  secondaryButton: {
    position: 'absolute',
    bottom: 0,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.2)',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: PALETTE.mist,
  },
});

