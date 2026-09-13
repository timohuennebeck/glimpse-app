import { Stack } from 'expo-router';
import { colors } from '@/shared/theme';

/**
 * The signed-in area. The mock has no persistent tab bar — navigation between
 * feed, friends and chats happens through the header controls on each screen —
 * so this is a plain stack rather than tabs.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />
  );
}
