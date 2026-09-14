import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchFriends } from '@/features/friends/data/friends-api';
export const friendsQueries = createQueryKeys('friends', {
  /** Accepted friends, as the recipient picker needs them. */
  list: {
    queryKey: null,
    queryFn: fetchFriends,
  },
});
