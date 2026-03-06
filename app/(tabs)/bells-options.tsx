import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { Jost_200ExtraLight, Jost_400Regular } from '@expo-google-fonts/jost';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

export default function BellsOptionsScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    Jost_200ExtraLight,
    Jost_400Regular,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });
  const sansThin = fontsLoaded ? 'Jost_200ExtraLight' : Platform.select({ default: 'System' });
  const sansRegular = fontsLoaded ? 'Jost_400Regular' : Platform.select({ default: 'System' });
  const {
    currentEndingBell,
    currentIntermediateBell,
    intermediateBellIntervalMinutes,
    availableEndingBells,
    isTracksLoading,
    fetchTracks,
  } = useSessionState();

  useFocusEffect(
    React.useCallback(() => {
      if (availableEndingBells.length === 0) {
        void fetchTracks();
      }
    }, [availableEndingBells.length, fetchTracks])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>Bells</Text>

        {isTracksLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={PALETTE.accent} />
          </View>
        ) : (
          <View style={styles.inputs}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/sound',
                  params: { mode: 'ending-bell', title: 'Ending bell' },
                })
              }
              style={({ pressed }) => [styles.inputRow, pressed && { opacity: 0.9 }]}>
              <View style={styles.inputTextCol}>
                <Text
                  style={[styles.inputLabel, { fontFamily: sansThin, color: PALETTE.mist }]}>
                  Ending bell
                </Text>
                <View style={styles.soundSummary}>
                  <View style={styles.soundSummaryRow}>
                    <Feather name="bell" size={14} color={PALETTE.mist} />
                    <Text
                      style={[
                        styles.soundSummaryValue,
                        { fontFamily: sansRegular, color: PALETTE.pale },
                      ]}>
                      {currentEndingBell || 'None'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/sound',
                  params: { mode: 'interval-bell', title: 'Interval bells' },
                })
              }
              style={({ pressed }) => [styles.inputRow, pressed && { opacity: 0.9 }]}>
              <View style={styles.inputTextCol}>
                <Text
                  style={[styles.inputLabel, { fontFamily: sansThin, color: PALETTE.mist }]}>
                  Interval bell
                </Text>
                <View style={styles.soundSummary}>
                  <View style={styles.soundSummaryRow}>
                    <Feather name="bell" size={14} color={PALETTE.mist} />
                    <Text
                      style={[
                        styles.soundSummaryValue,
                        { fontFamily: sansRegular, color: PALETTE.pale },
                      ]}>
                      {currentIntermediateBell
                        ? `${currentIntermediateBell}, every ${intermediateBellIntervalMinutes}m`
                        : 'None'}
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
            </Pressable>
          </View>
        )}
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
  inputs: {
    gap: 12,
  },
  loadingContainer: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
  soundSummary: {
    marginTop: 4,
    gap: 2,
  },
  soundSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundSummaryValue: {
    fontSize: 15,
  },
});
