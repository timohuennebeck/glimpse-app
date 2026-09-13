import { Stack } from 'expo-router';
import { colors } from '@/shared/theme/colors';
/** The 7-step signup flow plus the screens that bracket it. */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />
  );
}
