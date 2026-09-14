import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchInbox, fetchMomentPhoto, fetchPairs } from '@/features/moments/data/moments-api';
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
  /** Completed trades with one person, for the profile grid. */
  pairs: (withUserId: string) => ({
    queryKey: [withUserId],
    queryFn: () => fetchPairs(withUserId),
  }),
  /** One unlocked photo, full bleed. */
  photo: (momentId: string) => ({
    queryKey: [momentId],
    queryFn: () => fetchMomentPhoto(momentId),
  }),
});
