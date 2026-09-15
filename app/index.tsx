import { Redirect } from 'expo-router';
import { entryRoute } from '@/features/auth/entry-route';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Entry point: signed out it starts the flow, signed in it opens the feed — or
 * drops back into onboarding for an account that never finished it.
 */
export default function Index() {
  const { status } = useSession();
  const { data: me, isError } = useMe();

  const route = entryRoute({
    status,
    // `undefined` means the profile has not answered yet; a row with no stamp
    // means onboarding was never finished.
    onboardingDoneAt: me === undefined ? undefined : (me?.onboarding_done_at ?? null),
    profileFailed: isError,
  });

  if (!route) return null;
  return <Redirect href={route} />;
}
