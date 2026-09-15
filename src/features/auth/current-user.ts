import { useSession } from '@/features/auth/hooks/use-session';
/**
 * The signed-in id, for the `data/` modules that run outside React.
 *
 * Throws rather than returning null: every caller sits behind a protected
 * route, so no session there is a bug to surface, not a state to render.
 */
export function currentUserId(): string {
  const { userId } = useSession.getState();
  if (!userId) throw new Error('not_authenticated');
  return userId;
}
