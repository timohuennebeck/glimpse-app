import type { QueryClient } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';

/** The warm-up is best effort; the screen that needs the data reports failures. */
const noop = () => {};
/**
 * The four queries the first screen after sign-in reads.
 *
 * Fired once whenever a user id appears — at sign-in and at every cold start —
 * so the header, the feed, the rail and the badges are already in flight by the
 * time they mount. The persisted cache draws the previous answer meanwhile.
 */
export function prefetchForUser(queryClient: QueryClient, userId: string): void {
  // `query()` rather than the deprecated `prefetchQuery`, which v5 removes in
  // the next major. It rejects where prefetchQuery swallowed, and a failed
  // warm-up must not become an unhandled rejection: the screen's own useQuery
  // asks again and reports it properly. Listed one per line because each
  // carries its own result type, which an array would collapse.
  void queryClient.query(queries.profile.byId(userId)).catch(noop);
  void queryClient.query(queries.moments.inbox).catch(noop);
  void queryClient.query(queries.friends.all).catch(noop);
  void queryClient.query(queries.chat.threads).catch(noop);
}
