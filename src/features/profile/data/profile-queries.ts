import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchProfile } from '@/features/profile/data/profile-api';
/**
 * One key, and it always carries the user id. There is deliberately no
 * user-less `me` key: the cache is persisted to disk, and a `me` entry would
 * be handed straight to whoever signs in next on this phone.
 */
export const profileQueries = createQueryKeys('profile', {
  byId: (userId: string) => ({
    queryKey: [userId],
    queryFn: () => fetchProfile(userId),
  }),
});
