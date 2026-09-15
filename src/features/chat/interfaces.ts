import type { PersonSummary } from '@/features/friends/interfaces';
/** One message in a 1:1 conversation. Group threads are deliberately not a thing. */
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string | null;
  momentId: string | null;
  /** Set when the message was written from a moment screen. */
  tradeId: string | null;
  createdAt: string;
  readAt: string | null;
  /** True while the insert is still in flight. */
  pending?: boolean;
}

/** A row in the chats list: the last message with one person. */
export interface Thread {
  partner: PersonSummary;
  lastMessageId: string;
  lastContent: string | null;
  lastMomentId: string | null;
  lastSenderId: string;
  lastAt: string;
  unreadCount: number;
  /** Thumbnail of the moment the last message carried, when it carried one. */
  photo: string | null;
}
