import { supabase } from '@/shared/lib/supabase';
import { currentUserId } from '@/features/auth/current-user';
import { PERSON_COLUMNS, toPersonSummary } from '@/features/friends/data/friends-api';
import { signedMomentUrls } from '@/features/moments/data/moment-urls';
import type { Message, ThreadRow } from '@/shared/lib/database.types';
import type { ChatMessage, Thread } from '@/features/chat/interfaces';
/** Reads and writes for 1:1 chat. */

/** No pagination: a conversation is short, and the positioning note keeps it that way. */
export const MESSAGE_PAGE = 200;

const MESSAGE_COLUMNS = 'id, sender_id, recipient_id, content, moment_id, trade_id, created_at, read_at';

/** Derived from the schema rather than restated. Keep in step with MESSAGE_COLUMNS. */
type MessageColumns = Pick<
  Message,
  'id' | 'sender_id' | 'recipient_id' | 'content' | 'moment_id' | 'trade_id' | 'created_at' | 'read_at'
>;

function toMessage(row: MessageColumns): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    momentId: row.moment_id,
    tradeId: row.trade_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

/**
 * The chats list. `v_threads` gives one row per conversation; the partners'
 * profiles and any moment thumbnails are two more round trips, not one per row.
 */
export async function fetchThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from('v_threads')
    .select('*')
    .overrideTypes<ThreadRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [profiles, urls] = await Promise.all([
    supabase
      .from('profiles')
      .select(PERSON_COLUMNS)
      .in(
        'id',
        rows.map((row) => row.partner_id),
      ),
    signedMomentUrls(rows.map((row) => row.last_moment_id).filter((id): id is string => id !== null)),
  ]);
  if (profiles.error) throw profiles.error;

  const byId = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

  return rows
    .map((row): Thread | null => {
      // A partner whose profile a block now hides: drop the thread rather than
      // render a nameless row.
      const profile = byId.get(row.partner_id);
      if (!profile) return null;
      return {
        partner: toPersonSummary(profile),
        lastMessageId: row.last_message_id,
        lastContent: row.last_content,
        lastMomentId: row.last_moment_id,
        lastSenderId: row.last_sender_id,
        lastAt: row.last_at,
        unreadCount: row.unread_count,
        photo: row.last_moment_id ? (urls.get(row.last_moment_id) ?? null) : null,
      };
    })
    .filter((thread): thread is Thread => thread !== null);
}

/** Newest 200 from the database — that is what the index is for — oldest first on screen. */
export async function fetchMessages(partnerId: string): Promise<ChatMessage[]> {
  const me = currentUserId();
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${me})`,
    )
    .order('created_at', { ascending: false })
    .limit(MESSAGE_PAGE);
  if (error) throw error;
  return (data ?? []).map(toMessage).reverse();
}

export interface SendMessageInput {
  /** Minted on the client, so the optimistic row already carries its real id. */
  id: string;
  recipientId: string;
  content: string;
  /** Set when the message was written on a moment screen. */
  tradeId?: string | null;
}

export async function sendMessage({
  id,
  recipientId,
  content,
  tradeId,
}: SendMessageInput): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id,
      sender_id: currentUserId(),
      recipient_id: recipientId,
      content,
      trade_id: tradeId ?? null,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return toMessage(data);
}

/** `read_at` is the only column the recipient may write (see the column grant). */
export async function markThreadRead(partnerId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', partnerId)
    .eq('recipient_id', currentUserId())
    .is('read_at', null);
  if (error) throw error;
}
