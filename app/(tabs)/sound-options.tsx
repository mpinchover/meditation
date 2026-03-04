import Ionicons from '@expo/vector-icons/Ionicons';
import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router, useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { auth } from '@/constants/firebase';
import { useSessionState } from '@/constants/session-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

export default function SoundOptionsScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : Platform.select({ default: 'serif' });
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const { availableTracks, availableEndingBells, isTracksLoading, fetchTracks } = useSessionState();

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (availableTracks.length === 0 && availableEndingBells.length === 0) {
        void fetchTracks();
      }
    }, [availableEndingBells.length, availableTracks.length, fetchTracks])
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

        <Text style={[styles.screenTitle, { fontFamily: serif, color: PALETTE.silver }]}>Sound</Text>

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
                params: { mode: 'meditation', title: 'Meditation' },
              })
            }
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}>
            <View style={styles.rowContent}>
              <Text style={styles.rowText}>Meditation</Text>
              <Ionicons name="chevron-forward" size={18} color={PALETTE.mist} />
            </View>
          </Pressable>

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
          </View>
        )}

        {!user ? (
          <View style={styles.loginGateAnchor}>
            <View style={styles.loginGate}>
              <Text style={styles.loginPromptText}>Log in for more sounds</Text>
              <Pressable
                onPress={() => router.push('/modal')}
                style={({ pressed }) => [styles.loginButton, pressed && { opacity: 0.85 }]}>
                <Text style={styles.loginButtonText}>Log in</Text>
              </Pressable>
            </View>
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
  list: {
    gap: 10,
  },
  loadingContainer: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  loginGateAnchor: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 50,
  },
  loginGate: {
    justifyContent: 'flex-end',
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
