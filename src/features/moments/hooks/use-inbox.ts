import { useCallback, useEffect, useState } from 'react';
import { fetchInbox } from '@/features/moments/data/moments-api';
import { publishSnapshot } from '@/features/widget/data/widget-bridge';
import type { InboxMoment } from '@/features/moments/interfaces';
interface State { data: InboxMoment[]; loading: boolean; error: Error | null }

/** Feed + widget source: everything sent to me, frosted or open. */
export function useInbox() {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fetchInbox();
      setState({ data, loading: false, error: null });
      // Keep the homescreen honest: the widget mirrors the inbox, so it is
      // republished on every successful load. No-ops without a dev build.
      void publishSnapshot(data);
    } catch (error) {
      setState({ data: [], loading: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = state.data.filter((m) => !m.isOpen);
  const open = state.data.filter((m) => m.isOpen);

  return { ...state, pending, open, reload: load };
}
