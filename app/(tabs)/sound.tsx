import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Audio } from 'expo-av';
import { useFonts } from 'expo-font';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
// @ts-ignore Slider types are provided by the runtime dependency
import Slider from '@react-native-community/slider';

import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

const sharedSoundCache = new Map<string, Audio.Sound>();

export default function SoundScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });

  const { mode, title } = useLocalSearchParams<{ mode?: string; title?: string }>();
  const isEndingBellMode = mode === 'ending-bell';
  const isIntermediateBellMode = mode === 'interval-bell';

  const {
    currentSound,
    setCurrentSound,
    availableTracks,
    currentEndingBell,
    setCurrentEndingBell,
    availableEndingBells,
    currentIntermediateBell,
    setCurrentIntermediateBell,
    intermediateBellIntervalMinutes,
    setIntermediateBellIntervalMinutes,
  } = useSessionState();
  const currentSelection = isEndingBellMode
    ? currentEndingBell
    : isIntermediateBellMode
      ? currentIntermediateBell
      : currentSound;
  const setCurrentSelection = isEndingBellMode
    ? setCurrentEndingBell
    : isIntermediateBellMode
      ? setCurrentIntermediateBell
      : setCurrentSound;
  const sourceTracks =
    isEndingBellMode || isIntermediateBellMode ? availableEndingBells : availableTracks;
  const shouldLoopPreview = !(isEndingBellMode || isIntermediateBellMode);

  const sounds = useMemo(() => {
    const trackOptions = sourceTracks
      .filter((track) => Boolean(track.title))
      .map((track) => ({
        uuid: track.uuid ?? track.title,
        name: track.title,
      }));
    const isBellMode = isEndingBellMode || isIntermediateBellMode;
    if (isBellMode) {
      return [{ uuid: 'none', name: 'None' }, ...trackOptions];
    }
    if (trackOptions.length > 0) return trackOptions;
    return currentSelection ? [{ uuid: currentSelection, name: currentSelection }] : [];
  }, [currentSelection, sourceTracks, isEndingBellMode, isIntermediateBellMode]);
  const [selected, setSelected] = useState<string>(
    (isEndingBellMode || isIntermediateBellMode) && !currentSelection ? 'None' : currentSelection
  );
  const [playingName, setPlayingName] = useState<string | null>(null);
  const previewRef = useRef<Audio.Sound | null>(null);
  const playingPulse = useRef(new Animated.Value(0)).current;

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
    setPlayingName(null);
  }, []);

  const playPreview = useCallback(
    async (name: string) => {
      setSelected(name);
      await stopPreview();
      if (name === 'None') return;

      const cached = sharedSoundCache.get(name);
      if (cached) {
        previewRef.current = cached;
        try {
          await cached.setIsLoopingAsync(shouldLoopPreview);
          await cached.playFromPositionAsync(0);
          setPlayingName(name);
        } catch {
          // ignore playback errors and keep UI responsive
          setPlayingName(null);
        }
        return;
      }

      const mediaUrl = sourceTracks.find((track) => track.title === name)?.media_url;
      if (!mediaUrl) return;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: false, isLooping: shouldLoopPreview }
        );
        sharedSoundCache.set(name, sound);
        previewRef.current = sound;
        await sound.playFromPositionAsync(0);
        setPlayingName(name);
      } catch {
        // keep UI responsive even if preview fails
        setPlayingName(null);
      }
    },
    [shouldLoopPreview, sourceTracks, stopPreview]
  );

  useEffect(() => {
    let isCancelled = false;

    const preload = async () => {
      await Promise.all(
        sourceTracks.map(async (track) => {
          if (isCancelled) return;
          if (!track.media_url || sharedSoundCache.has(track.title)) return;

          try {
            const { sound } = await Audio.Sound.createAsync(
              { uri: track.media_url },
              { shouldPlay: false, isLooping: shouldLoopPreview }
            );
            if (isCancelled) {
              try {
                await sound.unloadAsync();
              } catch {
                // ignore unload errors during cancellation
              }
              return;
            }
            sharedSoundCache.set(track.title, sound);
          } catch {
            // keep preloading best-effort
          }
        })
      );
    };

    void preload();
    return () => {
      isCancelled = true;
    };
  }, [shouldLoopPreview, sourceTracks]);

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
    return () => {
      void stopPreview();
    };
  }, [stopPreview]);

  useEffect(() => {
    if (isEndingBellMode || isIntermediateBellMode) {
      setSelected(currentSelection || 'None');
    } else {
      setSelected(currentSelection);
    }
  }, [currentSelection, isEndingBellMode, isIntermediateBellMode]);

  useEffect(() => {
    if (!playingName) {
      playingPulse.stopAnimation();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(playingPulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(playingPulse, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [playingName, playingPulse]);

  async function handleSave() {
    await stopPreview();
    const valueToSave = selected === 'None' ? '' : selected;
    setCurrentSelection(valueToSave);
    if (isIntermediateBellMode) {
      setIntermediateBellIntervalMinutes((prev) => Math.min(15, prev));
    }
    if (isEndingBellMode || isIntermediateBellMode) {
      router.replace('/(tabs)/bells-options');
    } else {
      router.back();
    }
  }

  const pickerTitle =
    typeof title === 'string' && title.length > 0
      ? title
      : isEndingBellMode
        ? 'Ending bell'
        : 'Meditation';

  function handleBack() {
    void stopPreview().finally(() => {
      if (mode === 'ending-bell' || mode === 'intermediate-bell') {
        router.replace('/(tabs)/bells-options');
        return;
      }
      if (mode === 'meditation') {
        router.back();
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
            <Text style={styles.saveText}>Select</Text>
          </Pressable>
        </View>

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>
          {pickerTitle}
        </Text>

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
                onPress={() => {
                  void playPreview(name);
                }}>
                <View style={styles.rowInner}>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{name}</Text>
                  {isPlayingThis ? (
                    <Animated.View
                      style={[
                        styles.playingDot,
                        {
                          transform: [{ scale: pulseScale }],
                          opacity: pulseOpacity,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />

        {isIntermediateBellMode ? (
          <View style={styles.intervalContainer}>
            <View style={styles.intervalHeaderRow}>
              <Text style={styles.intervalLabel}>Interval</Text>
              <Text style={styles.intervalValue}>
                {Math.min(intermediateBellIntervalMinutes, 15)} min
              </Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={15}
              step={1}
              value={Math.min(intermediateBellIntervalMinutes, 15)}
              onValueChange={(value: number) => {
                setIntermediateBellIntervalMinutes(Math.round(value));
              }}
              minimumTrackTintColor={PALETTE.accent}
              maximumTrackTintColor="rgba(200,212,232,0.25)"
              thumbTintColor={PALETTE.accent}
            />
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
    paddingBottom: 56,
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
  intervalContainer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,212,232,0.12)',
  },
  intervalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  intervalLabel: {
    fontSize: 13,
    color: PALETTE.mist,
  },
  intervalValue: {
    fontSize: 14,
    color: PALETTE.pale,
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

