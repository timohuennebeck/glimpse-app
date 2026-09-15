import { randomUUID } from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { markThreadRead, sendMessage } from '@/features/chat/data/chat-api';
import { appendMessage } from '@/features/chat/messages';
import type { ChatMessage, Thread } from '@/features/chat/interfaces';
import { useMe } from '@/features/profile/hooks/use-me';

export interface DraftMessageInput {
  senderId: string;
  recipientId: string;
  content: string;
  tradeId?: string | null;
}

/**
 * The row the insert is about to create, minted here so the bubble that appears
 * instantly and the row that lands a moment later are the same message rather
 * than two.
 */
export function draftMessage(input: DraftMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    senderId: input.senderId,
    recipientId: input.recipientId,
    content: input.content,
    momentId: null,
    tradeId: input.tradeId ?? null,
    createdAt: new Date().toISOString(),
    readAt: null,
    pending: true,
  };
}

/** Takes the draft itself as its variable, so the patch and the insert cannot drift. */
export function useSendMessage(partnerId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queries.chat.messages(partnerId).queryKey;

  return useMutation({
    mutationFn: (message: ChatMessage) =>
      sendMessage({
        id: message.id,
        recipientId: message.recipientId,
        content: message.content ?? '',
        tradeId: message.tradeId,
      }),
    ...optimistic(queryClient, [
      patch<ChatMessage[], ChatMessage>(messagesKey, (old, message) => appendMessage(old, message)),
      patch<Thread[], ChatMessage>(queries.chat.threads.queryKey, (old, message) =>
        old.map((thread) =>
          thread.partner.id === partnerId
            ? {
                ...thread,
                lastMessageId: message.id,
                lastContent: message.content,
                lastMomentId: null,
                lastSenderId: message.senderId,
                lastAt: message.createdAt,
                photo: null,
              }
            : thread,
        ),
      ),
    ]),
    // Swap the pending bubble for the stored row before the refetch lands, so
    // the "sending" state does not linger for a round trip longer than it is.
    onSuccess: (saved) => {
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (old) => (old ? appendMessage(old, saved) : old));
    },
  });
}

/** Opening a conversation reads it. Both the badge and the ticks move at once. */
export function useMarkThreadRead(partnerId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const myId = me?.id ?? '';

  return useMutation({
    mutationFn: () => markThreadRead(partnerId),
    ...optimistic(queryClient, [
      patch<Thread[], void>(queries.chat.threads.queryKey, (old) =>
        old.map((thread) => (thread.partner.id === partnerId ? { ...thread, unreadCount: 0 } : thread)),
      ),
      patch<ChatMessage[], void>(queries.chat.messages(partnerId).queryKey, (old) =>
        old.map((message) =>
          message.recipientId === myId && message.readAt === null
            ? { ...message, readAt: new Date().toISOString() }
            : message,
        ),
      ),
    ]),
  });
}
