import { mergeQueryKeys } from '@lukemorales/query-key-factory';
import { momentsQueries } from '@/features/moments/data/moments-queries';
import { friendsQueries } from '@/features/friends/data/friends-queries';
import { profileQueries } from '@/features/profile/data/profile-queries';
import { chatQueries } from '@/features/chat/data/chat-queries';
import { invitesQueries } from '@/features/invites/data/invites-queries';
/**
 * Every query key in the app, by feature: `queries.moments.inbox`,
 * `queries.friends.all`, … Each entry carries its `queryKey` and `queryFn`,
 * so `useQuery(queries.moments.inbox)` is the whole call.
 */
export const queries = mergeQueryKeys(
  momentsQueries,
  friendsQueries,
  profileQueries,
  chatQueries,
  invitesQueries,
);
