import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
import { nextUnlockDelay } from '@/features/moments/selectors';
import type { InboxMoment } from '@/features/moments/interfaces';
const EMPTY: InboxMoment[] = [];

/**
 * Feed + widget source: everything sent to me, frosted or open. One cached
 * query, so the tab badge, the feed and the viewer share a single fetch and
 * every mutation that touches a trade invalidates all of them at once.
 *
 * The auto-unlock timer lives on the `useQuery` rather than in the key factory:
 * the factory's entry type does not carry the row type into `refetchInterval`'s
 * `query` argument, so it would be typed `unknown` there.
 */
export function useInbox() {
  const {
    data = EMPTY,
    isPending,
    error,
    refetch,
  } = useQuery({
    ...queries.moments.inbox,
    refetchInterval: (query) => nextUnlockDelay(query.state.data ?? [], Date.now()) ?? false,
  });

  const pending = useMemo(() => data.filter((m) => !m.isOpen), [data]);
  const open = useMemo(() => data.filter((m) => m.isOpen), [data]);

  return { data, loading: isPending, error, pending, open, reload: refetch };
}
