import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
/** The signed-in person's own profile. Disabled, not guessed at, while signed out. */
export function useMe() {
  const { userId } = useSession();
  return useQuery({ ...queries.profile.byId(userId ?? ''), enabled: userId !== null });
}
