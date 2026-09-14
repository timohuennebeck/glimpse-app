import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchInbox } from '@/features/moments/data/moments-api';
import { publishSnapshot } from '@/features/widget/data/widget-bridge';
import type { InboxMoment } from '@/features/moments/interfaces';
interface State { data: InboxMoment[]; loading: boolean; error: Error | null }

/** Feed + widget source: everything sent to me, frosted or open. */
export function useInbox() {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });
  // Two overlapping loads (focus + pull-to-refresh) must not let the slower,
  // older response overwrite the newer one.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchInbox();
      if (id !== requestId.current) return;
      setState({ data, loading: false, error: null });
      // Keep the homescreen honest: the widget mirrors the inbox. No-ops
      // without a dev build; a failure there must not surface as an
      // unhandled rejection.
      publishSnapshot(data).catch(() => {});
    } catch (error) {
      if (id !== requestId.current) return;
      // Keep what we had: a transient network error should not empty the feed.
      setState((s) => ({ ...s, loading: false, error: error as Error }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = state.data.filter((m) => !m.isOpen);
  const open = state.data.filter((m) => m.isOpen);

  return { ...state, pending, open, reload: load };
}
