import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
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

import { auth, normalizeUsernameToEmail } from '@/constants/firebase';

const PALETTE = {
  ink: '#0d0d1a',
  mist: '#8b9bb4',
  pale: '#e8edf5',
  accent: '#7eb8d4',
} as const;

export default function ModalScreen() {
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonLabel = useMemo(() => (isCreateMode ? 'Create account' : 'Log in'), [isCreateMode]);
  const isDisabled =
    isSubmitting ||
    username.trim().length === 0 ||
    password.trim().length === 0 ||
    (isCreateMode && confirmPassword.trim().length === 0);

  async function handleSubmit() {
    const email = normalizeUsernameToEmail(username);
    const pwd = password.trim();
    const confirmPwd = confirmPassword.trim();

    if (isCreateMode && pwd !== confirmPwd) {
      Alert.alert('Unable to create account', 'Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isCreateMode) {
        await createUserWithEmailAndPassword(auth, email, pwd);
      } else {
        await signInWithEmailAndPassword(auth, email, pwd);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        isCreateMode ? 'Unable to create account' : 'Unable to log in',
        error?.message ?? 'Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleMode() {
    setIsCreateMode((prev) => !prev);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleForgotPassword() {
    if (username.trim().length === 0) {
      Alert.alert('Forgot password', 'Enter your username or email first.');
      return;
    }

    const email = normalizeUsernameToEmail(username);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Reset email sent', `Password reset instructions were sent to ${email}.`);
    } catch (error: any) {
      Alert.alert('Unable to send reset email', error?.message ?? 'Please try again.');
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

          <Text style={styles.title}>{isCreateMode ? 'Create account' : 'Log in'}</Text>
          <Text style={styles.subtitle}>
            {isCreateMode
              ? 'Create an account to unlock more sounds.'
              : 'Log in to access additional sound tracks.'}
          </Text>

          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={PALETTE.mist}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={PALETTE.mist}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          {isCreateMode ? (
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor={PALETTE.mist}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          ) : null}

          {!isCreateMode ? (
            <Pressable
              onPress={() => {
                void handleForgotPassword();
              }}
              style={({ pressed }) => [styles.forgotButton, pressed && { opacity: 0.8 }]}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          ) : null}

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
            <Text style={styles.submitButtonText}>{buttonLabel}</Text>
          </Pressable>

          <Pressable
            onPress={handleToggleMode}
            style={({ pressed }) => [styles.switchButton, pressed && { opacity: 0.8 }]}>
            <Text style={styles.switchText}>
              {isCreateMode ? 'Already have an account? Log in' : "Don't have an account? Create one"}
            </Text>
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
  forgotButton: {
    alignSelf: 'center',
    marginTop: -2,
    marginBottom: 10,
    paddingVertical: 4,    
  },
  forgotText: {
    fontSize: 13,
    color: PALETTE.accent,
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
  switchButton: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  switchText: {
    fontSize: 14,
    color: PALETTE.accent,
  },
});
