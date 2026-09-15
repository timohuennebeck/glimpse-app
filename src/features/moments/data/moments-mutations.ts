import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { markTradeSeen } from '@/features/moments/data/moments-api';
import type { InboxMoment } from '@/features/moments/interfaces';
/** Opening the frosted card stamps it, so the sender can tell it landed. */
export function useMarkTradeSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeId: string) => markTradeSeen(tradeId),
    ...optimistic(queryClient, [
      patch<InboxMoment[], string>(queries.moments.inbox.queryKey, (old, tradeId) =>
        old.map((moment) =>
          moment.tradeId === tradeId ? { ...moment, seenAt: new Date().toISOString() } : moment,
        ),
      ),
    ]),
  });
}
