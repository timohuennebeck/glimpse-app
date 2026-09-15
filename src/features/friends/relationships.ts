import type { FriendshipWithPeople, PersonSummary, Relationship } from '@/features/friends/interfaces';
/**
 * Friends, incoming requests and sent requests are three readings of one list
 * of friendship rows, not three queries. That is what lets a single optimistic
 * patch keep the rail, the request list and the search results in step.
 */

export function otherParty(friendship: FriendshipWithPeople, me: string): PersonSummary {
  return friendship.requester.id === me ? friendship.recipient : friendship.requester;
}

export function friendsOf(list: FriendshipWithPeople[], me: string): PersonSummary[] {
  return list.filter((f) => f.status === 'accepted').map((f) => otherParty(f, me));
}

/** Waiting on me to accept. */
export function incomingRequests(list: FriendshipWithPeople[], me: string): FriendshipWithPeople[] {
  return list.filter((f) => f.status === 'pending' && f.recipient.id === me);
}

/** Waiting on them. */
export function sentRequests(list: FriendshipWithPeople[], me: string): FriendshipWithPeople[] {
  return list.filter((f) => f.status === 'pending' && f.requester.id === me);
}

/** What a search result's pill should say, and which row it would act on. */
export function relationshipWith(list: FriendshipWithPeople[], me: string, otherId: string): Relationship {
  const found = list.find((f) => otherParty(f, me).id === otherId);
  if (!found) return { kind: 'none' };
  if (found.status === 'accepted') return { kind: 'friends', friendshipId: found.id };
  return { kind: found.requester.id === me ? 'sent' : 'received', friendshipId: found.id };
}
