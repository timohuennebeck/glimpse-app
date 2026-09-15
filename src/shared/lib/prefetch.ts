import type { QueryClient } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
/**
 * The four queries the first screen after sign-in reads.
 *
 * Fired once whenever a user id appears — at sign-in and at every cold start —
 * so the header, the feed, the rail and the badges are already in flight by the
 * time they mount. The persisted cache draws the previous answer meanwhile.
 */
export function prefetchForUser(queryClient: QueryClient, userId: string): void {
  void queryClient.prefetchQuery(queries.profile.byId(userId));
  void queryClient.prefetchQuery(queries.moments.inbox);
  void queryClient.prefetchQuery(queries.friends.all);
  void queryClient.prefetchQuery(queries.chat.threads);
}
