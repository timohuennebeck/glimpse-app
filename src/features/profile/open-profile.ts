import { router } from 'expo-router';
/**
 * Your own avatar in a rail leads to the profile tab, not to a "friend" page
 * with a close button and a trade CTA that pre-selects yourself.
 */
export function openProfile(userId: string, myId: string) {
  if (userId === myId) router.push('/(app)/profile');
  else router.push(`/profile/${userId}`);
}
