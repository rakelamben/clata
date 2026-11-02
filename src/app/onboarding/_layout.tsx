import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" options={{ gestureEnabled: false }} />
      <Stack.Screen name="intro-1" options={{ gestureEnabled: false }} />
      <Stack.Screen name="intro-2" options={{ gestureEnabled: true }} />
      <Stack.Screen name="select-package" options={{ gestureEnabled: true }} />
      <Stack.Screen name="preparing" options={{ gestureEnabled: false }} />
      <Stack.Screen name="ready" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
