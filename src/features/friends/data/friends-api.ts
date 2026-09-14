import { isSupabaseConfigured, requireSupabase } from '@/shared/lib/supabase';
import { demoOthers } from '@/shared/lib/fixtures';
import type { Profile } from '@/shared/lib/database.interfaces';
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
  const ids = (links ?? []).map((l) => l.friend_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profileError } = await sb
    .from('profiles')
    .select('id, display_name, username, tagline, avatar_path')
    .in('id', ids);
  if (profileError) throw profileError;

  return (profiles ?? []).map((p) => toFriend(p, p.avatar_path ? publicAvatarUrl(p.avatar_path) : null));
}

function toFriend(
  p: Pick<Profile, 'id' | 'display_name' | 'username' | 'tagline'>,
  avatar: string | number | null,
): FriendSummary {
  return { id: p.id, name: p.display_name, username: p.username, tagline: p.tagline, avatar };
}

/**
 * Answer an incoming request. `status` is the only column the addressee may
 * write (see the column grant in the RLS migration); the friend cap trigger
 * runs on the way in.
 */
export async function respondToFriendRequest(friendshipId: string, status: 'accepted' | 'declined'): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await requireSupabase().from('friendships').update({ status }).eq('id', friendshipId);
  if (error) throw error;
}
