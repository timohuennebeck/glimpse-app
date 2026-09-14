import { useEffect } from 'react';
import { create } from '@/features/moments/hooks/store';
import { fetchInbox } from '@/features/moments/data/moments-api';
import { publishSnapshot } from '@/features/widget/data/widget-bridge';
import type { InboxMoment } from '@/features/moments/interfaces';
interface InboxState {
  data: InboxMoment[];
  loading: boolean;
  error: Error | null;
}

/**
 * One inbox for the whole app. The tab badge, the feed and the moment viewer all
 * read the same store, so a cold start is one fetch (not three) and a reload
 * from any of them updates all of them.
 */
const useInboxStore = create<InboxState>({ data: [], loading: true, error: null });

// Two overlapping loads (focus + pull-to-refresh) must not let the slower,
// older response overwrite the newer one.
let requestId = 0;
let started = false;

/** Refetch the inbox. Called after sending or answering a moment. */
export async function reloadInbox() {
  const id = ++requestId;
  useInboxStore.set({ loading: true });
  try {
    const data = await fetchInbox();
    if (id !== requestId) return;
    useInboxStore.set({ data, loading: false, error: null });
    // Keep the homescreen honest: the widget mirrors the inbox. No-ops
    // without a dev build; a failure there must not surface as an
    // unhandled rejection.
    publishSnapshot(data).catch(() => {});
  } catch (error) {
    if (id !== requestId) return;
    // Keep what we had: a transient network error should not empty the feed.
    useInboxStore.set({ loading: false, error: error as Error });
  }
}

/** Feed + widget source: everything sent to me, frosted or open. */
export function useInbox() {
  const { data, loading, error } = useInboxStore();

  useEffect(() => {
    if (started) return;
    started = true;
    void reloadInbox();
  }, []);

  const pending = data.filter((m) => !m.isOpen);
  const open = data.filter((m) => m.isOpen);

  return { data, loading, error, pending, open, reload: reloadInbox };
}
