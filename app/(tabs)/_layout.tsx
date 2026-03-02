import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: Colors.dark.text,
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
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
    </Tabs>
  );
}
