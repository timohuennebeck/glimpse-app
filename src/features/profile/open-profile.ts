import { router } from 'expo-router';
import { DEMO_USER_ID } from '@/shared/lib/fixtures';
/**
 * Your own avatar in a rail leads to the profile tab, not to a "friend" page
 * with a close button and a trade CTA that pre-selects yourself.
 */
export function openProfile(userId: string) {
  if (userId === DEMO_USER_ID) router.push('/(app)/profile');
  else router.push(`/profile/${userId}`);
}
