import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
import { updateProfile } from '@/features/profile/data/profile-api';
import type { Profile, TablesUpdate } from '@/shared/lib/database.types';

export type ProfilePatch = TablesUpdate<'profiles'>;

/** Merges the patch into the cached profile at once; the refetch confirms it. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { userId } = useSession();

  return useMutation({
    mutationFn: (values: ProfilePatch) => updateProfile(values),
    ...optimistic(queryClient, [
      patch<Profile | null, ProfilePatch>(queries.profile.byId(userId ?? '').queryKey, (old, values) =>
        old ? { ...old, ...values } : old,
      ),
    ]),
  });
}
