import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { router, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { auth } from '@/constants/firebase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  useColorScheme();
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.46)',
        tabBarShowLabel: false,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          textAlign: 'center',
        },
        tabBarStyle: {
          display: user ? 'flex' : 'none',
          backgroundColor: '#000000',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-circle-outline" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (auth.currentUser) return;
            event.preventDefault();
            router.push({
              pathname: '/modal',
              params: { from: 'account' },
            });
          },
        }}
      />
      <Tabs.Screen
        name="duration"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sound"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sound-options"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="session"
        options={{
          href: null,
          // Hide tab bar while meditation session is active
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
