import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
/** Unread messages across every conversation — the Friends tab badge. */
export function useUnreadTotal(): number {
  const { data: threads = [] } = useQuery(queries.chat.threads);
  return threads.reduce((total, thread) => total + thread.unreadCount, 0);
}
