import { Tabs } from 'expo-router';
import Icon from 'react-native-remix-icon';

import { colors, fonts } from '../../ui/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.uiMedium,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="kata"
        options={{
          title: 'Kata',
          tabBarIcon: ({ color, size }) => (
            <Icon
              color={typeof color === 'string' ? color : colors.primary}
              name="book-open-line"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="latihan"
        options={{
          title: 'Latihan',
          tabBarIcon: ({ color, size }) => (
            <Icon
              color={typeof color === 'string' ? color : colors.primary}
              name="pencil-line"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tantangan"
        options={{
          title: 'Tantangan',
          tabBarIcon: ({ color, size }) => (
            <Icon
              color={typeof color === 'string' ? color : colors.primary}
              name="trophy-line"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon
              color={typeof color === 'string' ? color : colors.primary}
              name="user-line"
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
