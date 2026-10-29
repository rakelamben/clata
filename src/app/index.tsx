import { Redirect } from 'expo-router';

import { useAppRuntime } from '../bootstrap/AppBootstrap';

export default function IndexRoute() {
  const { startup, onboardingState } = useAppRuntime();
  if (startup.status !== 'ready') return null;

  return <Redirect href={startup.onboardingCompleted && onboardingState === 'ready' ? '/(tabs)/kata' : '/onboarding'} />;
}
