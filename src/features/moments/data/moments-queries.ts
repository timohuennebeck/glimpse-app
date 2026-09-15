import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  fetchInbox,
  fetchMomentPhoto,
  fetchOutgoingLocked,
  fetchPairs,
} from '@/features/moments/data/moments-api';
import { publishSnapshot } from '@/features/widget/data/widget-bridge';
/**
 * Query keys + fetchers for the moments feature. Keys are derived by the
 * factory, so `queries.moments._def` invalidates everything here and
 * `queries.moments.inbox.queryKey` just the inbox.
 */
export const momentsQueries = createQueryKeys('moments', {
  /** Everything sent to me, frosted or open. Shared by the tab badge, the feed and the viewer. */
  inbox: {
    queryKey: null,
    queryFn: async () => {
      const data = await fetchInbox();
      // Keep the homescreen honest: the widget mirrors the inbox. No-ops
      // without a dev build; a failure there must not surface as an
      // unhandled rejection.
      publishSnapshot(data).catch(() => {});
      return data;
    },
  },
  /**
   * Completed trades as photo pairs. `null` means "with anyone" — spelled
   * `'all'` in the key itself, because the factory's key values cannot be null
   * and a uuid is never that word.
   */
  pairs: (withUserId: string | null) => ({
    queryKey: [withUserId ?? 'all'],
    queryFn: () => fetchPairs(withUserId),
  }),
  /** My own moments nobody has answered, for the locked tiles on my grid. */
  outgoingLocked: {
    queryKey: null,
    queryFn: fetchOutgoingLocked,
  },
  /** One unlocked photo, full bleed. */
  photo: (momentId: string) => ({
    queryKey: [momentId],
    queryFn: () => fetchMomentPhoto(momentId),
  }),
});
