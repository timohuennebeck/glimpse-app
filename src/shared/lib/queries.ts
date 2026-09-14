import { mergeQueryKeys } from '@lukemorales/query-key-factory';
import { momentsQueries } from '@/features/moments/data/moments-queries';
import { friendsQueries } from '@/features/friends/data/friends-queries';
/**
 * Every query key in the app, by feature: `queries.moments.inbox`,
 * `queries.friends.list`, … Each entry carries its `queryKey` and `queryFn`,
 * so `useQuery(queries.moments.inbox)` is the whole call.
 */
export const queries = mergeQueryKeys(momentsQueries, friendsQueries);
