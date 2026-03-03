import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { auth } from '@/constants/firebase';
import { useSessionState } from '@/constants/session-context';

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

  const { mode, title } = useLocalSearchParams<{ mode?: string; title?: string }>();
  const isEndingBellMode = mode === 'ending-bell';

  const {
    currentSound,
    setCurrentSound,
    availableTracks,
    currentEndingBell,
    setCurrentEndingBell,
    availableEndingBells,
  } = useSessionState();
  const currentSelection = isEndingBellMode ? currentEndingBell : currentSound;
  const setCurrentSelection = isEndingBellMode ? setCurrentEndingBell : setCurrentSound;
  const sourceTracks = isEndingBellMode ? availableEndingBells : availableTracks;

  const sounds = useMemo(() => {
    const titles = sourceTracks.map((track) => track.title).filter(Boolean);
    if (titles.length > 0) return titles;
    return currentSelection ? [currentSelection] : [];
  }, [currentSelection, sourceTracks]);
  const [selected, setSelected] = useState<string>(currentSelection);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const previewRef = useRef<Audio.Sound | null>(null);
  const soundCacheRef = useRef<Map<string, Audio.Sound>>(new Map());

  const stopPreview = useCallback(async () => {
    if (!previewRef.current) return;

    try {
      await previewRef.current.stopAsync();
    } catch {
      // ignore stop errors while cleaning up
    }

    try {
      await previewRef.current.setPositionAsync(0);
    } catch {
      // ignore reset errors while cleaning up
    }

    previewRef.current = null;
  }, []);

  const unloadAllPreviews = useCallback(async () => {
    await stopPreview();
    const cachedSounds = Array.from(soundCacheRef.current.values());
    for (const sound of cachedSounds) {
      try {
        await sound.unloadAsync();
      } catch {
        // ignore unload errors during teardown
      }
    }
    soundCacheRef.current.clear();
  }, [stopPreview]);

  const playPreview = useCallback(
    async (name: string) => {
      setSelected(name);
      await stopPreview();

      const cached = soundCacheRef.current.get(name);
      if (cached) {
        previewRef.current = cached;
        try {
          await cached.playFromPositionAsync(0);
        } catch {
          // ignore playback errors and keep UI responsive
        }
        return;
      }

      const mediaUrl = sourceTracks.find((track) => track.title === name)?.media_url;
      if (!mediaUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: false, isLooping: true }
        );
        soundCacheRef.current.set(name, sound);
        previewRef.current = sound;
        await sound.playFromPositionAsync(0);
      } catch {
        // keep UI responsive even if preview fails
      }
    },
    [sourceTracks, stopPreview]
  );

  useEffect(() => {
    let isCancelled = false;

    const preload = async () => {
      for (const track of sourceTracks) {
        if (isCancelled) return;
        if (!track.media_url || soundCacheRef.current.has(track.title)) continue;

        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: track.media_url },
            { shouldPlay: false, isLooping: true }
          );
          if (isCancelled) {
            try {
              await sound.unloadAsync();
            } catch {
              // ignore unload errors during cancellation
            }
            return;
          }
          soundCacheRef.current.set(track.title, sound);
        } catch {
          // keep preloading best-effort
        }
      }
    };

    void preload();
    return () => {
      isCancelled = true;
    };
  }, [sourceTracks]);

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void unloadAllPreviews();
      };
    }, [unloadAllPreviews])
  );

  useEffect(() => {
    return () => {
      void unloadAllPreviews();
    };
  }, [unloadAllPreviews]);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  useEffect(() => {
    setSelected(currentSelection);
  }, [currentSelection]);

  async function handleSave() {
    await stopPreview();
    if (!selected) {
      router.back();
      return;
    }
    setCurrentSelection(selected);
    router.back();
  }

  const pickerTitle =
    typeof title === 'string' && title.length > 0
      ? title
      : isEndingBellMode
        ? 'Ending bell'
        : 'Meditation';

  function handleBack() {
    void stopPreview().finally(() => {
      if (mode === 'meditation' || mode === 'ending-bell') {
        router.replace('/(tabs)/sound-options');
        return;
      }
      router.back();
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>
          {pickerTitle}
        </Text>

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

        { !user ? (
          <View style={styles.loginGate}>
            <Text style={styles.loginPromptText}>Log in for more sounds</Text>
            <Pressable
              onPress={() => router.push('/modal')}
              style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}>
              <Text style={styles.loginButtonText}>Log in</Text>
            </Pressable>
          </View>
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
  loginGate: {
    height: '50%',
    justifyContent: 'center',
  },
  loginPromptText: {
    textAlign: 'center',
    fontSize: 18,
    color: PALETTE.pale,
    marginBottom: 12,
  },
  loginButton: {
    width: '100%',
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

