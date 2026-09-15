import { supabase } from '@/shared/lib/supabase';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';
/** Everything the friends feature reads and writes. Screens go through the queries and mutations. */

/** The profile columns every person row needs. */
const PERSON_COLUMNS = 'id, first_name, username, tagline, avatar_storage_path';

interface PersonColumns {
  id: string;
  first_name: string;
  username: string | null;
  tagline: string | null;
  avatar_storage_path: string | null;
}

function toPerson(row: PersonColumns): PersonSummary {
  return {
    id: row.id,
    name: row.first_name,
    username: row.username,
    tagline: row.tagline,
    avatarUrl: avatarUrl(row.avatar_storage_path),
  };
}

/**
 * Every friendship I am in, pending or accepted, with both profiles embedded.
 *
 * One query, not three: friends, incoming requests and sent requests are
 * selectors over these rows (see `relationships.ts`). The `!…_fkey` hints are
 * required — there are two foreign keys from `friendships` to `profiles`, and
 * PostgREST will not guess which embed is which.
 */
export async function fetchFriendships(): Promise<FriendshipWithPeople[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `id, status, created_at,
       requester:profiles!friendships_requester_id_fkey(${PERSON_COLUMNS}),
       recipient:profiles!friendships_recipient_id_fkey(${PERSON_COLUMNS})`,
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    requester: toPerson(row.requester),
    recipient: toPerson(row.recipient),
  }));
}

/**
 * Add-friend search. Handles are the point, so `@` is stripped and both the
 * handle and the first name are matched from the start.
 */
export async function searchProfiles(query: string): Promise<PersonSummary[]> {
  const needle = query.trim().replace(/^@/, '');
  if (needle.length === 0) return [];
  // `,` and `)` are structural inside a PostgREST `or`, so the value is quoted;
  // `%` is stripped so a stray one cannot turn this into a full scan.
  const escaped = needle.replace(/["\\%]/g, '');
  if (escaped.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(PERSON_COLUMNS)
    .or(`username.ilike."${escaped}%",first_name.ilike."${escaped}%"`)
    .neq('id', currentUserId())
    .limit(20);
  if (error) throw error;
  return (data ?? []).map(toPerson);
}

/** "3 mutual" for a whole list of results or requests in one call. */
export async function fetchMutualCounts(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase.rpc('mutual_friends_counts', { p_user_ids: userIds });
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.user_id, row.mutual]));
}

/** The pair index means a second request in either direction is a unique violation. */
export async function sendFriendRequest(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: currentUserId(), recipient_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Accept an incoming request. `status` is the only column the recipient may
 * write (see the column grant in the RLS migration); the friend cap trigger
 * runs on the way in.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Decline a request, withdraw one you sent, or unfriend: all three delete the
 * row. There is no declined state on purpose — a kept row would tell the
 * requester they were declined and block the pair from ever trying again.
 */
export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}
