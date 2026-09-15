import { useMe } from '@/features/profile/hooks/use-me';
import { useUpdateProfile } from '@/features/profile/data/profile-mutations';
import { useOncePerKey } from '@/shared/lib/use-once-per-key';
/**
 * Onboarding counts as finished the first time the signed-in tabs mount, not on
 * the thank-you screen: "Look around first" leaves the flow too, and a relaunch
 * must not drop that person back into step 5.
 */
export function useStampOnboardingDone() {
  const { data: me } = useMe();
  const { mutate } = useUpdateProfile();

  // Keyed by user, so one failed stamp is retried on the next launch rather
  // than immediately: the guard used to read `onboarding_done_at` straight back
  // out of the cache the patch writes, and the rollback re-armed it forever.
  useOncePerKey(me != null && me.onboarding_done_at === null ? me.id : null, () => {
    mutate({ onboarding_done_at: new Date().toISOString() });
  });
}
