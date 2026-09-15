import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { pairKey } from '@/features/chat/messages';
/**
 * "Active now", for one conversation and nowhere else.
 *
 * Presence is tracked only while this screen is open, on a private channel whose
 * topic is the pair — so nobody outside the conversation can observe it and
 * there is no global online state to leak. The two policies on
 * `realtime.messages` from the `app_wiring` migration enforce that server-side;
 * `private: true` is what makes the server consult them.
 */
export function usePartnerPresence(myId: string, partnerId: string): boolean {
  const [present, setPresent] = useState(false);

  useEffect(() => {
    if (!myId || !partnerId) return;

    const channel = supabase.channel(`chat:${pairKey(myId, partnerId)}`, {
      config: { private: true, presence: { key: myId } },
    });

    const read = () => setPresent(Object.keys(channel.presenceState()).includes(partnerId));

    channel
      .on('presence', { event: 'sync' }, read)
      .on('presence', { event: 'join' }, read)
      .on('presence', { event: 'leave' }, read)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.track({ at: new Date().toISOString() });
      });

    return () => {
      // Removing the channel untracks and unsubscribes in one go, so leaving
      // the screen is the same thing as going offline for this pair.
      setPresent(false);
      void supabase.removeChannel(channel);
    };
  }, [myId, partnerId]);

  return present;
}
