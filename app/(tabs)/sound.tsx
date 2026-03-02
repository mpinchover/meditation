import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { getCurrentSound, setCurrentSound } from '@/constants/session';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

const SOUNDS = [
  'Soft rain',
  'Ocean tide',
  'Night forest',
  'White noise',
  'Singing bowls',
  'Tibetan monastery',
];

export default function SoundScreen() {
  const [selected, setSelected] = useState<string>(getCurrentSound());

  function handleSave() {
    if (!selected) {
      router.back();
      return;
    }
    setCurrentSound(selected);
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
          <Text style={styles.title}>Sound</Text>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Choose a soundscape for your session.</Text>

        <View style={styles.list}>
          {SOUNDS.map((name) => {
            const active = selected === name;
            return (
              <Pressable
                key={name}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => setSelected(name)}>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{name}</Text>
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
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  saveText: {
    fontSize: 14,
    color: PALETTE.accent,
  },
});

