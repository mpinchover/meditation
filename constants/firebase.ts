import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCIsEqg8LfdNtwjtIyR0rRYGH4tLdJrU9Q',
  authDomain: 'callysto-6286f.firebaseapp.com',
  projectId: 'callysto-6286f',
  storageBucket: 'callysto-6286f.firebasestorage.app',
  messagingSenderId: '724373166676',
  appId: '1:724373166676:web:d9a8feaf82e26256e4abc1',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

if (__DEV__) {
  const configuredHost = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST?.trim();
  const defaultHost = Platform.OS === 'android' ? '10.0.2.2:9099' : '127.0.0.1:9099';
  const host = configuredHost && configuredHost.length > 0 ? configuredHost : defaultHost;
  const emulatorUrl = host.startsWith('http') ? host : `http://${host}`;

  try {
    connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  } catch {
    // ignore duplicate connect calls during fast refresh
  }
}

function normalizeUsernameToEmail(username: string) {
  const value = username.trim().toLowerCase();
  if (value.includes('@')) return value;
  return `${value}@callysto.local`;
}

export { app, auth, normalizeUsernameToEmail };
