import { Redirect, Tabs } from 'expo-router';
import RemixIcon from 'react-native-remix-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../../ui/theme';
import { useAppRuntime } from '../../bootstrap/AppBootstrap';

export default function TabsLayout() {
  const { profile, startup, onboardingState } = useAppRuntime();
  const insets = useSafeAreaInsets();

  if (startup.status !== 'ready' || !startup.onboardingCompleted || onboardingState !== 'ready') {
    return <Redirect href="/onboarding" />;
  }

  const isAdult = profile?.ageCategory === 'adult';

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
          height: 60 + Math.max(insets.bottom, 8),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: {
          fontFamily: fonts.uiMedium,
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="kata"
        options={{
          title: 'Kata',
          tabBarIcon: ({ focused }) => (
            <RemixIcon
              name={focused ? 'book-read-fill' : 'book-read-line'}
              size={24}
              color={focused ? colors.primary : colors.textSecondary}
              accessible={false}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="latihan"
        options={{
          title: 'Latihan',
          tabBarIcon: ({ focused }) => (
            <RemixIcon
              name={focused ? 'sparkling-fill' : 'sparkling-line'}
              size={24}
              color={focused ? colors.primary : colors.textSecondary}
              accessible={false}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tantangan"
        options={{
          title: 'Tantangan',
          tabBarIcon: ({ focused }) => (
            <RemixIcon
              name={focused ? 'medal-fill' : 'medal-line'}
              size={24}
              color={focused ? colors.primary : colors.textSecondary}
              accessible={false}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          href: isAdult ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <RemixIcon
              name={focused ? 'user-3-fill' : 'user-3-line'}
              size={24}
              color={focused ? colors.primary : colors.textSecondary}
              accessible={false}
            />
          ),
        }}
      />
    </Tabs>
  );
}

