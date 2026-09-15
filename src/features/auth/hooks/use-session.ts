import { create } from '@/shared/lib/store';
import { supabase } from '@/shared/lib/supabase';
/**
 * Who is signed in. A store rather than a context: the data modules call
 * `currentUserId()` outside React, and the root layout needs the answer before
 * it decides which routes exist at all.
 */
export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

export interface SessionState {
  status: SessionStatus;
  userId: string | null;
}

export const useSession = create<SessionState>({ status: 'loading', userId: null });

function sessionState(userId: string | null | undefined): SessionState {
  return userId ? { status: 'signed-in', userId } : { status: 'signed-out', userId: null };
}

/**
 * Keeps the store in step with Supabase. Mounted once by the root layout; the
 * returned function unsubscribes.
 *
 * `getSession()` reads the session AsyncStorage already holds, so a relaunch
 * resolves without a round trip. Everything after that — refresh, sign-in,
 * sign-out, expiry — arrives through `onAuthStateChange`. The callback only
 * writes to the store: calling back into `supabase.auth` from inside it
 * deadlocks the auth lock.
 */
export function startSessionSync(): () => void {
  let active = true;

  void supabase.auth.getSession().then(({ data }) => {
    // A state change may have answered first while this was in flight; it is
    // the newer truth, so it wins.
    if (!active || useSession.getState().status !== 'loading') return;
    useSession.set(sessionState(data.session?.user.id));
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSession.set(sessionState(session?.user.id));
  });

  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}
