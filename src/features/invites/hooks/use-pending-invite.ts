import { create } from '@/shared/lib/store';
/**
 * A token a signed-out visitor arrived with, held across onboarding so the
 * account they create at step 4 can claim it.
 *
 * Not persisted on purpose: a token that survives a restart is a link they can
 * simply open again, and a stale one would befriend a stranger later.
 */
interface PendingInvite {
  token: string | null;
}

export const usePendingInvite = create<PendingInvite>({ token: null });
