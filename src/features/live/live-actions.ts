import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * What a Realtime change means for the cache, as a value rather than a side
 * effect. The socket handler is then four lines and this is testable — which
 * matters, because "the other person's moment did not appear" is invisible in
 * a single-user run.
 *
 * Deletes are deliberately absent. Supabase cannot filter delete events and
 * does not apply row security to them, so declines, withdrawals and unfriends
 * reach the other phone on its next refetch instead.
 */
export type LiveAction =
  | { kind: 'inbox-changed' }
  | { kind: 'pairs-changed' }
  | { kind: 'outgoing-changed' }
  | { kind: 'friendships-changed' }
  | { kind: 'message-received'; partnerId: string; message: ChatMessage }
  | { kind: 'message-read'; partnerId: string; messageId: string; readAt: string };

export interface LiveEvent {
  table: 'trades' | 'messages' | 'friendships';
  eventType: 'INSERT' | 'UPDATE';
  /** The changed row. Row security already decided this subscriber may see it. */
  new: Record<string, unknown>;
}

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function toMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: text(row.id) ?? '',
    senderId: text(row.sender_id) ?? '',
    recipientId: text(row.recipient_id) ?? '',
    content: text(row.content),
    momentId: text(row.moment_id),
    tradeId: text(row.trade_id),
    createdAt: text(row.created_at) ?? new Date().toISOString(),
    readAt: text(row.read_at),
  };
}

export function actionsFor(event: LiveEvent, me: string): LiveAction[] {
  const row = event.new;

  if (event.table === 'trades') {
    const actions: LiveAction[] = [];
    if (text(row.responder_id) === me) {
      actions.push({ kind: 'inbox-changed' });
      // An update to a trade I hold is the unlock, which makes a pair.
      if (event.eventType === 'UPDATE') actions.push({ kind: 'pairs-changed' });
    }
    if (text(row.initiator_id) === me) {
      // An insert is a new lock of mine — my own send, or somebody claiming an
      // invite. An update is somebody answering one.
      if (event.eventType === 'UPDATE') actions.push({ kind: 'pairs-changed' });
      actions.push({ kind: 'outgoing-changed' });
    }
    return actions;
  }

  if (event.table === 'messages') {
    if (event.eventType === 'INSERT' && text(row.recipient_id) === me) {
      const message = toMessage(row);
      return [{ kind: 'message-received', partnerId: message.senderId, message }];
    }
    const readAt = text(row.read_at);
    if (event.eventType === 'UPDATE' && text(row.sender_id) === me && readAt) {
      return [
        {
          kind: 'message-read',
          partnerId: text(row.recipient_id) ?? '',
          messageId: text(row.id) ?? '',
          readAt,
        },
      ];
    }
    return [];
  }

  const isMine = text(row.requester_id) === me || text(row.recipient_id) === me;
  return isMine ? [{ kind: 'friendships-changed' }] : [];
}
