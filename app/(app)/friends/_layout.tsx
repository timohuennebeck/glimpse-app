import { Stack } from 'expo-router';
import { colors } from '@/shared/theme/colors';
/**
 * Without this layout the Tabs navigator treats `friends/search` as a fifth
 * tab. Nesting it in a Stack keeps Friends a single tab with search pushed on
 * top of it.
 */
export default function FriendsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />;
}
