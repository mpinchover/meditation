import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

const sharedSoundCache = new Map<string, Audio.Sound>();

export default function SoundscapesScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });

  const { currentSound, setCurrentSound, availableTracks } = useSessionState();

  const sounds = useMemo(() => {
    const trackOptions = availableTracks
      .filter((track) => Boolean(track.title))
      .map((track) => ({
        uuid: track.uuid ?? track.title,
        name: track.title,
      }));
    if (trackOptions.length > 0) return trackOptions;
    return currentSound ? [{ uuid: currentSound, name: currentSound }] : [];
  }, [currentSound, availableTracks]);

  const [selected, setSelected] = useState<string>(currentSound);
  const [playingName, setPlayingName] = useState<string | null>(null);
  const previewRef = useRef<Audio.Sound | null>(null);
  const playingPulse = useRef(new Animated.Value(0)).current;

  const stopPreview = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      await previewRef.current.stopAsync();
    } catch {
      // ignore
    }
    try {
      await previewRef.current.setPositionAsync(0);
    } catch {
      // ignore
    }
    previewRef.current = null;
    setPlayingName(null);
  }, []);

  const playPreview = useCallback(
    async (name: string) => {
      setSelected(name);
      await stopPreview();

      const cached = sharedSoundCache.get(name);
      if (cached) {
        previewRef.current = cached;
        try {
          await cached.setIsLoopingAsync(true);
          await cached.playFromPositionAsync(0);
          setPlayingName(name);
        } catch {
          setPlayingName(null);
        }
        return;
      }

      const mediaUrl = availableTracks.find((track) => track.title === name)?.media_url;
      if (!mediaUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: false, isLooping: true }
        );
        sharedSoundCache.set(name, sound);
        previewRef.current = sound;
        await sound.playFromPositionAsync(0);
        setPlayingName(name);
      } catch {
        setPlayingName(null);
      }
    },
    [availableTracks, stopPreview]
  );

  useEffect(() => {
    let isCancelled = false;
    const preload = async () => {
      await Promise.all(
        availableTracks.map(async (track) => {
          if (isCancelled || !track.media_url || sharedSoundCache.has(track.title)) return;
          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: track.media_url },
              { shouldPlay: false, isLooping: true }
            );
            if (isCancelled) {
              try {
                await sound.unloadAsync();
              } catch {
                // ignore
              }
              return;
            }
            sharedSoundCache.set(track.title, sound);
          } catch {
            // ignore
          }
        })
      );
    };
    void preload();
    return () => {
      isCancelled = true;
    };
  }, [availableTracks]);

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopPreview();
      };
    }, [stopPreview])
  );

  useEffect(() => {
    setSelected(currentSound);
  }, [currentSound]);

  useEffect(() => {
    if (!playingName) {
      playingPulse.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(playingPulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(playingPulse, { toValue: 0, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [playingName, playingPulse]);

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
            onPress={() => void stopPreview().finally(() => router.back())}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.saveText}>Select</Text>
          </Pressable>
        </View>

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>Sound</Text>

        <FlatList
          data={sounds}
          keyExtractor={(item) => item.uuid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: { uuid, name } }) => {
            const active = selected === name;
            const isPlayingThis = playingName === name;
            const pulseScale = playingPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.92, 1.16],
            });
            const pulseOpacity = playingPulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.55, 1],
            });
            return (
              <Pressable
                key={uuid}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => void playPreview(name)}>
                <View style={styles.rowInner}>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{name}</Text>
                  {isPlayingThis ? (
                    <Animated.View
                      style={[
                        styles.playingDot,
                        { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
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
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowActive: {
    borderColor: PALETTE.accent,
    backgroundColor: 'rgba(126,184,212,0.12)',
  },
  rowTextActive: {
    color: PALETTE.accent,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: PALETTE.accent,
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
