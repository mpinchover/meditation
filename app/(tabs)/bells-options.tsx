import Ionicons from '@expo/vector-icons/Ionicons';
import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
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
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });
  const { availableEndingBells, isTracksLoading, fetchTracks } = useSessionState();

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
          <View style={styles.list}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/sound',
                  params: { mode: 'ending-bell', title: 'Ending bell' },
                })
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowText}>Ending bell</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/sound',
                  params: { mode: 'intermediate-bell', title: 'Intermediate bells' },
                })
              }
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
              <View style={styles.rowContent}>
                <Text style={styles.rowText}>Intermediate bells</Text>
                <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
              </View>
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
  list: {
    gap: 10,
  },
  loadingContainer: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.15)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    fontSize: 15,
    color: PALETTE.pale,
  },
});
