import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { getCurrentDurationMinutes, setCurrentDurationMinutes } from '@/constants/session';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

export default function DurationScreen() {
  const [selected, setSelected] = useState<number>(getCurrentDurationMinutes());

  function handleSelect() {
    if (!selected) {
      router.back();
      return;
    }
    setCurrentDurationMinutes(selected);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Duration</Text>
          <Pressable
            onPress={handleSelect}
            style={({ pressed }) => [styles.selectBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.selectText}>Select</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>How long would you like to meditate?</Text>

        <View style={styles.list}>
          {DURATIONS.map((m) => {
            const active = selected === m;
            return (
              <Pressable
                key={m}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => setSelected(m)}>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{m} minutes</Text>
              </Pressable>
            );
          })}
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 14,
    color: PALETTE.mist,
  },
  title: {
    fontSize: 18,
    color: PALETTE.pale,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.mist,
    marginBottom: 18,
  },
  list: {
    gap: 10,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.15)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowText: {
    fontSize: 15,
    color: PALETTE.pale,
  },
  rowActive: {
    borderColor: PALETTE.accent,
    backgroundColor: 'rgba(126,184,212,0.12)',
  },
  rowTextActive: {
    color: PALETTE.accent,
  },
  selectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectText: {
    fontSize: 14,
    color: PALETTE.accent,
  },
});

