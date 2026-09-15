import {
  friendsOf,
  incomingRequests,
  otherParty,
  relationshipWith,
  sentRequests,
} from '@/features/friends/relationships';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';

const person = (id: string): PersonSummary => ({
  id,
  name: id,
  username: id,
  tagline: null,
  avatarUrl: null,
});

const link = (
  id: string,
  requester: string,
  recipient: string,
  status: FriendshipWithPeople['status'],
): FriendshipWithPeople => ({
  id,
  status,
  createdAt: '2026-09-14T10:00:00Z',
  requester: person(requester),
  recipient: person(recipient),
});

const ME = 'me';
const list = [
  link('f1', ME, 'mia', 'accepted'),
  link('f2', 'ben', ME, 'accepted'),
  link('f3', 'lina', ME, 'pending'),
  link('f4', ME, 'noah', 'pending'),
];

describe('relationships', () => {
  it('reads the other person whichever side asked', () => {
    expect(otherParty(list[0], ME).id).toBe('mia');
    expect(otherParty(list[1], ME).id).toBe('ben');
  });

  it('counts only accepted rows as friends', () => {
    expect(friendsOf(list, ME).map((p) => p.id)).toEqual(['mia', 'ben']);
  });

  it('splits the pending rows by direction', () => {
    expect(incomingRequests(list, ME).map((f) => f.id)).toEqual(['f3']);
    expect(sentRequests(list, ME).map((f) => f.id)).toEqual(['f4']);
  });

  it('names the relationship with one person', () => {
    expect(relationshipWith(list, ME, 'mia')).toEqual({ kind: 'friends', friendshipId: 'f1' });
    expect(relationshipWith(list, ME, 'noah')).toEqual({ kind: 'sent', friendshipId: 'f4' });
    expect(relationshipWith(list, ME, 'lina')).toEqual({ kind: 'received', friendshipId: 'f3' });
    expect(relationshipWith(list, ME, 'stranger')).toEqual({ kind: 'none' });
  });
});
