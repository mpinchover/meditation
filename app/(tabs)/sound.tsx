import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { auth } from '@/constants/firebase';
import {
  getAvailableSounds,
  getCurrentSound,
  getTrackMediaUrlByTitle,
  setCurrentSound,
  subscribeToSessionChanges,
} from '@/constants/session';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

export default function SoundScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });

  const [selected, setSelected] = useState<string>(getCurrentSound());
  const [sounds, setSounds] = useState<string[]>(getAvailableSounds());
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const previewRef = useRef<Audio.Sound | null>(null);

  const stopPreview = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      await previewRef.current.stopAsync();
    } catch {
      // ignore stop errors while cleaning up
    }

    try {
      await previewRef.current.unloadAsync();
    } catch {
      // ignore unload errors while cleaning up
    }

    previewRef.current = null;
  }, []);

  const playPreview = useCallback(
    async (name: string) => {
      setSelected(name);
      const mediaUrl = getTrackMediaUrlByTitle(name);
      await stopPreview();
      if (!mediaUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: true, isLooping: true }
        );
        previewRef.current = sound;
      } catch {
        // keep UI responsive even if preview fails
      }
    },
    [stopPreview]
  );

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    return subscribeToSessionChanges(() => {
      setSounds(getAvailableSounds());
      setSelected(getCurrentSound());
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopPreview();
      };
    }, [stopPreview])
  );

  useEffect(() => {
    return () => {
      void stopPreview();
    };
  }, [stopPreview]);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  async function handleSave() {
    await stopPreview();
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
            onPress={() => {
              void stopPreview().finally(() => {
                router.back();
              });
            }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>Sound</Text>

        <View style={styles.list}>
          {sounds.map((name) => {
            const active = selected === name;
            return (
              <Pressable
                key={name}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => {
                  void playPreview(name);
                }}>
                <View style={styles.rowInner}>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{name}</Text>
                
                </View>
              </Pressable>
            );
          })}
        </View>

        {!user ? (
          <Pressable
            onPress={() => router.push('/modal')}
            style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}>
            <Text style={styles.loginButtonText}>Log in for more sounds</Text>
          </Pressable>
        ) : null}
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
  screenTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4.2,
    textAlign: 'left',
    marginLeft: 8,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.mist,
    marginBottom: 18,
  },

  list: {
    gap: 10,
  },
  loginButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,184,212,0.35)',
    backgroundColor: 'rgba(126,184,212,0.13)',
  },
  loginButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: PALETTE.pale,
    fontWeight: '600',
  },
  loginButtonSubtext: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 13,
    color: PALETTE.mist,
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
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewText: {
    fontSize: 13,
    color: PALETTE.mist,
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

