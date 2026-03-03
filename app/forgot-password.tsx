import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth } from '@/constants/firebase';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = isSubmitting || email.trim().length === 0;

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail(auth, normalizedEmail);
      Alert.alert('Reset email sent', `Password reset instructions were sent to ${normalizedEmail}.`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Unable to send reset email', error?.message ?? 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.75 }]}>
            <Ionicons name="close" size={24} color={PALETTE.pale} />
          </Pressable>

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>Enter your email and we will send a reset link.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={PALETTE.mist}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <Pressable
            onPress={() => {
              void handleSubmit();
            }}
            disabled={isDisabled}
            style={({ pressed }) => [
              styles.submitButton,
              isDisabled && styles.submitButtonDisabled,
              pressed && !isDisabled && { opacity: 0.85 },
            ]}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.ink,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 24,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.pale,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
    color: PALETTE.mist,
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200,212,232,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: PALETTE.pale,
  },
  submitButton: {
    marginTop: 4,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(126,184,212,0.45)',
    backgroundColor: 'rgba(126,184,212,0.16)',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.pale,
  },
});
