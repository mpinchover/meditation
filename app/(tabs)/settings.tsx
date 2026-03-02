import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
  danger: '#ff6b6b',
} as const;

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Email address</Text>
          <Text style={styles.value}>you@example.com</Text>
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9 },
            ]}>
            <Text style={styles.primaryText}>Sign out</Text>
          </Pressable>

          <Pressable
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 22,
    color: PALETTE.pale,
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
