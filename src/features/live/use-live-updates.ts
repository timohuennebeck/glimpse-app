import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { queries } from '@/shared/lib/queries';
import { appendMessage } from '@/features/chat/messages';
import { actionsFor, type LiveAction, type LiveEvent } from '@/features/live/live-actions';
import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * One channel for everything that can change behind my back.
 *
 * Mounted in the root layout rather than under the tabs, so a deep link
 * straight into a moment or a chat is live too. Row-level security decides
 * which change reaches which subscriber; the filters below only narrow it
 * further, so the socket does not carry rows this phone would drop.
 */
type Payload = RealtimePostgresChangesPayload<Record<string, unknown>>;

function applyActions(queryClient: QueryClient, actions: LiveAction[]): void {
  for (const action of actions) {
    switch (action.kind) {
      case 'inbox-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
        break;
      case 'pairs-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.pairs._def });
        break;
      case 'outgoing-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.outgoingLocked.queryKey });
        break;
      case 'friendships-changed':
        void queryClient.invalidateQueries({ queryKey: queries.friends._def });
        break;
      case 'message-received':
        // Appended rather than invalidated: an open conversation should show it
        // now, not after a round trip.
        queryClient.setQueryData<ChatMessage[]>(queries.chat.messages(action.partnerId).queryKey, (old) =>
          old ? appendMessage(old, action.message) : old,
        );
        void queryClient.invalidateQueries({ queryKey: queries.chat.threads.queryKey });
        break;
      case 'message-read':
        queryClient.setQueryData<ChatMessage[]>(queries.chat.messages(action.partnerId).queryKey, (old) =>
          old?.map((message) =>
            message.id === action.messageId ? { ...message, readAt: action.readAt } : message,
          ),
        );
        break;
    }
  }
}

export function useLiveUpdates(userId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const handle =
      (table: LiveEvent['table']) =>
      (payload: Payload): void => {
        if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;
        applyActions(
          queryClient,
          actionsFor(
            { table, eventType: payload.eventType, new: payload.new as Record<string, unknown> },
            userId,
          ),
        );
      };

    const table = (name: LiveEvent['table'], event: 'INSERT' | 'UPDATE', filter: string) =>
      ({ event, schema: 'public', table: name, filter }) as const;

    /** False until the first successful subscribe, so the initial one is not a "reconnect". */
    let hasSubscribed = false;

    const channel = supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', table('trades', 'INSERT', `responder_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'UPDATE', `responder_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'INSERT', `initiator_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'UPDATE', `initiator_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('messages', 'INSERT', `recipient_id=eq.${userId}`), handle('messages'))
      .on('postgres_changes', table('messages', 'UPDATE', `sender_id=eq.${userId}`), handle('messages'))
      .on(
        'postgres_changes',
        table('friendships', 'INSERT', `recipient_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'UPDATE', `recipient_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'INSERT', `requester_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'UPDATE', `requester_id=eq.${userId}`),
        handle('friendships'),
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        // Anything that happened while the socket was down was simply missed;
        // there is no replay. One sweep is cheaper than reasoning about it.
        if (hasSubscribed) void queryClient.invalidateQueries();
        hasSubscribed = true;
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
