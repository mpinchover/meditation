import {
  CormorantGaramond_300Light,
  CormorantGaramond_300Light_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Jost_200ExtraLight,
  Jost_400Regular,
} from '@expo-google-fonts/jost';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  glow: '#4a6fa5',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;



export default function HomeScreen() {
  const {
    currentSound: sound,
    currentEndingBell: endingBell,
    currentDurationMinutes: durationMinutes,
  } = useSessionState();

  const [fontsLoaded] = useFonts({
    Jost_200ExtraLight,
    Jost_400Regular,
    CormorantGaramond_300Light,
    CormorantGaramond_300Light_Italic,
  });

  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });
  const sansThin = fontsLoaded ? 'Jost_200ExtraLight' : Platform.select({ default: 'System' });
  const sansRegular = fontsLoaded ? 'Jost_400Regular' : Platform.select({ default: 'System' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.bg}>

        <View style={styles.app}>
          <View style={styles.header}>
            <Text style={[styles.h1, { fontFamily: serif, color: PALETTE.silver }]}>Stillness</Text>
          </View>

          <View style={styles.center}>
            <View style={styles.inputs}>
              <Pressable
                onPress={() => router.push('/(tabs)/duration')}
                style={({ pressed }) => [styles.inputRow, pressed && { opacity: 0.9 }]}>
                <View style={styles.inputTextCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { fontFamily: sansThin, color: PALETTE.mist },
                    ]}>
                    Duration
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      { fontFamily: sansRegular, color: PALETTE.pale },
                    ]}>
                    {(() => {
                      const hrs = Math.floor(durationMinutes / 60);
                      const mins = durationMinutes % 60;
                      if (durationMinutes <= 0) return '0 min';
                      const hrPart = hrs > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''}` : '';
                      const minPart = mins > 0 ? `${mins} min` : '';
                      const sep = hrPart && minPart ? ' ' : '';
                      return `${hrPart}${sep}${minPart}`;
                    })()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
              </Pressable>

              <Pressable
                onPress={() => router.push('/(tabs)/sound-options')}
                style={({ pressed }) => [styles.inputRow, pressed && { opacity: 0.9 }]}>
                <View style={styles.inputTextCol}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { fontFamily: sansThin, color: PALETTE.mist },
                    ]}>
                    Sound
                  </Text>
                  <Text
                    style={[
                      styles.inputValue,
                      { fontFamily: sansRegular, color: PALETTE.pale },
                    ]}>
                    {endingBell ? `${sound}, ${endingBell}` : sound}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
              </Pressable>
            </View>

            <View style={styles.playWrapper}>
              <Pressable
                onPress={() => {
                  router.push('/(tabs)/session');
                }}
                style={({ pressed }) => [
                  styles.playButton,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}>
                <Ionicons name="play" size={40} color={PALETTE.silver} style={{ marginLeft: 4 }} />
              </Pressable>

            </View>
          </View>


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
  bg: {
    flex: 1,
    backgroundColor: PALETTE.ink,
  },
  moon: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 360,
    height: 360,
    borderRadius: 999,
    opacity: 0.12,
    backgroundColor: PALETTE.silver,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 40% 40%, #c8d4e8 0%, #8b9bb4 40%, rgba(0,0,0,0) 70%)',
        } as any)
      : null),
  },
  aurora: {
    position: 'absolute',
    bottom: -220,
    left: -120,
    width: 820,
    height: 420,
    borderRadius: 999,
    opacity: 0.3,
    backgroundColor: 'rgba(74,111,165,0.18)',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(ellipse, rgba(74,111,165,0.18) 0%, rgba(126,184,212,0.10) 40%, rgba(0,0,0,0) 70%)',
        } as any)
      : null),
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.3)',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(126,184,212,0.6)',
    shadowColor: 'rgba(126,184,212,0.9)',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  h1: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4.2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '200',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  inputs: {
    gap: 12,
    marginBottom: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.18)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  inputTextCol: {
    flexDirection: 'column',
    gap: 2,
  },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  inputValue: {
    fontSize: 16,
  },
  playWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: "5%",
    alignItems: 'center',
    gap: 14,
  },
  playButton: {
    width: 94,
    height: 94,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.35)',
    backgroundColor: 'rgba(74,111,165,0.35)',
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 30% 30%, rgba(232,237,245,0.16), rgba(74,111,165,0.35))',
        } as any)
      : null),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(74,111,165,1)',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  playHint: {
    fontSize: 14,
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },
  footer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
