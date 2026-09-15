import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchFriendships, fetchMutualCounts, searchProfiles } from '@/features/friends/data/friends-api';
/**
 * `all` is every friendship I am in. Friends, requests and sent requests are
 * selectors over it, so one optimistic patch keeps all three in step.
 */
export const friendsQueries = createQueryKeys('friends', {
  all: {
    queryKey: null,
    queryFn: fetchFriendships,
  },
  search: (query: string) => ({
    queryKey: [query],
    queryFn: () => searchProfiles(query),
  }),
  /** Ids sorted by the caller, so two lists of the same people share one entry. */
  mutual: (sortedIds: string[]) => ({
    queryKey: [sortedIds],
    queryFn: () => fetchMutualCounts(sortedIds),
  }),
});
