import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchInvitePreview } from '@/features/invites/data/invites-api';
export const invitesQueries = createQueryKeys('invites', {
  /** What the deep-link screen shows before the visitor has an account. */
  preview: (token: string) => ({
    queryKey: [token],
    queryFn: () => fetchInvitePreview(token),
  }),
});
