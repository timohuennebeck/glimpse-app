import { randomUUID } from 'expo-crypto';
import type { QueryClient } from '@tanstack/react-query';
import { create } from '@/shared/lib/store';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { createMoment, respondToTrade, sendMoment } from '@/features/moments/data/moments-api';
import { runEntry, type OutboxEntry } from '@/features/moments/outbox';
import type { InboxMoment } from '@/features/moments/interfaces';
/**
 * Sends in flight. In memory only, deliberately: the local file a retry would
 * need may not survive a restart either, so a queue that did would be a list of
 * entries that can never succeed.
 */
interface OutboxState {
  entries: OutboxEntry[];
}

export const useOutbox = create<OutboxState>({ entries: [] });

export interface SendInput {
  localUri: string;
  width: number;
  height: number;
  caption: string | null;
  replyToTradeIds: string[];
  recipientIds: string[];
  names: string[];
}

function update(id: string, values: Partial<OutboxEntry>) {
  useOutbox.set({
    entries: useOutbox.getState().entries.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)),
  });
}

/** The moments this capture answers open now; the photos sharpen on the refetch. */
function openAnswered(queryClient: QueryClient, tradeIds: string[]) {
  if (tradeIds.length === 0) return;
  queryClient.setQueryData<InboxMoment[]>(queries.moments.inbox.queryKey, (old) =>
    old?.map((moment) => (tradeIds.includes(moment.tradeId) ? { ...moment, isOpen: true } : moment)),
  );
}

async function drain(id: string, queryClient: QueryClient): Promise<void> {
  const entry = useOutbox.getState().entries.find((e) => e.id === id);
  if (!entry) return;

  try {
    await runEntry(entry, { createMoment, respondToTrade, sendMoment }, (values) => update(id, values));
    useOutbox.set({ entries: useOutbox.getState().entries.filter((e) => e.id !== id) });
    await queryClient.invalidateQueries({ queryKey: queries.moments._def });
  } catch (error) {
    update(id, { status: 'failed', error: errorMessage(error) });
    // Put the inbox back: nothing was answered after all.
    await queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
  }
}

/** Queue a send and return at once — the screen navigates, the upload follows. */
export function enqueueSend(input: SendInput, queryClient: QueryClient): string {
  const entry: OutboxEntry = {
    id: randomUUID(),
    ...input,
    status: 'sending',
    error: null,
    momentId: null,
    answeredTradeIds: [],
  };
  useOutbox.set({ entries: [...useOutbox.getState().entries, entry] });
  openAnswered(queryClient, input.replyToTradeIds);
  void drain(entry.id, queryClient);
  return entry.id;
}

/** Re-run a failed entry. `runEntry` skips whatever already succeeded. */
export function retrySend(id: string, queryClient: QueryClient): void {
  const entry = useOutbox.getState().entries.find((e) => e.id === id);
  if (!entry) return;
  update(id, { status: 'sending', error: null });
  openAnswered(queryClient, entry.replyToTradeIds);
  void drain(id, queryClient);
}
