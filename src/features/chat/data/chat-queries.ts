import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchMessages, fetchThreads } from '@/features/chat/data/chat-api';
export const chatQueries = createQueryKeys('chat', {
  /** The chats list, and the source of every unread badge in the app. */
  threads: {
    queryKey: null,
    queryFn: fetchThreads,
  },
  messages: (partnerId: string) => ({
    queryKey: [partnerId],
    queryFn: () => fetchMessages(partnerId),
  }),
});
