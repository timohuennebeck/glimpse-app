import { router } from 'expo-router';
import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { queryPersister } from '@/shared/lib/query-client';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { momentUrlCache } from '@/features/moments/data/moment-urls';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Everything on this device that belongs to whoever was signed in.
 *
 * Called on sign-out, and by the root layout whenever the user id changes away
 * from a previous one — an expired session that comes back as somebody else
 * must not inherit the last person's cached feed, and the cache is on disk.
 *
 * Tasks 13 and 14 add the signed-URL cache and the outbox to this list.
 */
export async function clearUserData(queryClient: QueryClient): Promise<void> {
  supabase.removeAllChannels();
  // Deliberately NOT useSession.reset(): that restores `status: 'loading'` and
  // the root layout would hold the splash for ever. `onAuthStateChange` sets
  // the signed-out state for us.
  useComposer.reset();
  useOnboardingDraft.reset();
  queryClient.clear();
  await momentUrlCache.clear();
  await queryPersister.removeClient();
}

export async function signOut(queryClient: QueryClient): Promise<void> {
  await supabase.auth.signOut();
  await clearUserData(queryClient);
  // `Stack.Protected` drops the signed-in routes as soon as the session flips;
  // this says where to land rather than leaving it to the fallback.
  router.replace('/(onboarding)/welcome');
}
