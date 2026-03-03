import { CormorantGaramond_300Light } from '@expo-google-fonts/cormorant-garamond';
import { useFonts } from 'expo-font';
import { deleteUser, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth } from '@/constants/firebase';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  silver: '#c8d4e8',
  pale: '#e8edf5',
  accent: '#7eb8d4',
  danger: '#ff6b6b',
} as const;

export default function AccountScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
  });
  const serif = fontsLoaded ? 'CormorantGaramond_300Light' : 'serif';

  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  async function handleSignOut() {
    try {
      await signOut(auth);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Unable to sign out', error?.message ?? 'Please try again.');
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      await deleteUser(user);
    } catch (error: any) {
      Alert.alert('Unable to delete account', error?.message ?? 'Please log in again and retry.');
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <Text style={[styles.title, { fontFamily: serif, color: PALETTE.silver }]}>Account</Text>
          <View style={styles.loginOnlyContainer}>
            <Pressable
              onPress={() => router.push('/modal')}
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}>
              <Text style={styles.primaryText}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={[styles.title, { fontFamily: serif, color: PALETTE.silver }]}>Account</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Email address</Text>
          <Text style={styles.value}>{user.email ?? 'Signed in'}</Text>
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => {
              void handleSignOut();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9 },
            ]}>
            <Text style={styles.primaryText}>Sign out</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void handleDeleteAccount();
            }}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed && { opacity: 0.9 },
            ]}>
            <Text style={styles.dangerText}>Delete account</Text>
          </Pressable>
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
  loginOnlyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4.2,
    textAlign: 'left',
    marginLeft: 8,
    marginBottom: 32,
  },
  section: {
    marginBottom: 40,
  },
  label: {
    fontSize: 12,
    color: PALETTE.mist,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: PALETTE.pale,
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(126,184,212,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(126,184,212,0.6)',
    alignItems: 'center',
  },
  primaryText: {
    color: PALETTE.pale,
    fontSize: 15,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.7)',
    alignItems: 'center',
  },
  dangerText: {
    color: PALETTE.danger,
    fontSize: 15,
  },
});
