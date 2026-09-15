import { useEffect } from 'react';
import { useMe } from '@/features/profile/hooks/use-me';
import { useUpdateProfile } from '@/features/profile/data/profile-mutations';
/**
 * Onboarding counts as finished the first time the signed-in tabs mount, not on
 * the thank-you screen: "Look around first" leaves the flow too, and a relaunch
 * must not drop that person back into step 5.
 */
export function useStampOnboardingDone() {
  const { data: me } = useMe();
  const { mutate, isPending, isSuccess } = useUpdateProfile();
  // Primitive deps only: every refetch hands back a new object for the same
  // profile, which must not stamp it a second time.
  const needsStamp = me != null && me.onboarding_done_at === null;

  useEffect(() => {
    if (needsStamp && !isPending && !isSuccess) mutate({ onboarding_done_at: new Date().toISOString() });
  }, [needsStamp, isPending, isSuccess, mutate]);
}
