import { isSupabaseConfigured, requireSupabase } from '@/shared/lib/supabase';
import { demoOthers } from '@/shared/lib/fixtures';
import type { Profile } from '@/shared/lib/database.types';
import { publicAvatarUrl } from '@/features/moments/data/moments-api';

/** A friend as a picker or list needs them. */
export interface FriendSummary {
  id: string;
  name: string;
  username: string | null;
  tagline: string | null;
  avatar: string | number | null;
}

/**
 * Accepted friends, from `v_my_friends` joined to `profiles`. Against a real
 * project this must return real uuids: the recipient picker hands them straight
 * to `send_moment`.
 */
export async function fetchFriends(): Promise<FriendSummary[]> {
  if (!isSupabaseConfigured) {
    return demoOthers.slice(0, 3).map((p) => toFriend(p, p.photo));
  }

  const sb = requireSupabase();
  const { data: links, error } = await sb.from('v_my_friends').select('friend_id');
  if (error) throw error;
  const ids = (links ?? []).map((l) => l.friend_id).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await sb
    .from('profiles')
    .select('id, first_name, username, tagline, avatar_storage_path')
    .in('id', ids);
  if (profileError) throw profileError;

  return (profiles ?? []).map((p) =>
    toFriend(p, p.avatar_storage_path ? publicAvatarUrl(p.avatar_storage_path) : null),
  );
}

function toFriend(
  p: Pick<Profile, 'id' | 'first_name' | 'username' | 'tagline'>,
  avatar: string | number | null,
): FriendSummary {
  return { id: p.id, name: p.first_name, username: p.username, tagline: p.tagline, avatar };
}

/**
 * Accept an incoming request. `status` is the only column the recipient may
 * write (see the column grant in the RLS migration); the friend cap trigger
 * runs on the way in.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase()
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Decline a request, withdraw one you sent, or unfriend: all three delete the
 * row. There is no declined state on purpose — a kept row would tell the
 * requester they were declined and block the pair from ever trying again.
 */
export async function removeFriendship(friendshipId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase().from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}
