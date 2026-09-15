import type { FriendshipStatus } from '@/shared/lib/database.types';
/** A person as every row, rail and picker in the app needs them. */
export interface PersonSummary {
  id: string;
  name: string;
  username: string | null;
  tagline: string | null;
  avatarUrl: string | null;
}

/** One `friendships` row with both profiles resolved. */
export interface FriendshipWithPeople {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  requester: PersonSummary;
  recipient: PersonSummary;
}

/** Where I stand with someone, and the row that says so. */
export type Relationship =
  | { kind: 'none' }
  | { kind: 'friends'; friendshipId: string }
  | { kind: 'sent'; friendshipId: string }
  | { kind: 'received'; friendshipId: string };
