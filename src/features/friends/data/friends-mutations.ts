import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from '@/features/friends/data/friends-api';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';
import type { Profile } from '@/shared/lib/database.types';
/**
 * All three patch the one `friends.all` list, so the rail, the request lists
 * and every search result agree the instant the pill is tapped.
 */
const ALL = queries.friends.all.queryKey;

function asPerson(me: Profile): PersonSummary {
  return {
    id: me.id,
    name: me.first_name,
    username: me.username,
    tagline: me.tagline,
    avatarUrl: avatarUrl(me.avatar_storage_path),
  };
}

/**
 * The row the server is about to create, built here so the result flips to
 * "Requested" on the tap. Its id is a placeholder until the refetch replaces
 * it — nothing navigates on it, and the withdraw action only appears in the
 * sent list, which the refetch has reached by then.
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  return useMutation({
    mutationFn: (person: PersonSummary) => sendFriendRequest(person.id),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], PersonSummary>(ALL, (old, person) =>
        me
          ? [
              {
                id: `pending-${person.id}`,
                status: 'pending' as const,
                createdAt: new Date().toISOString(),
                requester: asPerson(me),
                recipient: person,
              },
              ...old,
            ]
          : old,
      ),
    ]),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], string>(ALL, (old, friendshipId) =>
        old.map((f) => (f.id === friendshipId ? { ...f, status: 'accepted' as const } : f)),
      ),
    ]),
  });
}

/** Decline, withdraw and unfriend are the same delete, so they are one hook. */
export function useRemoveFriendship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => removeFriendship(friendshipId),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], string>(ALL, (old, friendshipId) =>
        old.filter((f) => f.id !== friendshipId),
      ),
    ]),
  });
}
