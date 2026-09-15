import { supabase } from '@/shared/lib/supabase';
import { MAX_AVATAR_EDGE, resizeJpeg } from '@/shared/lib/resize';
import { currentUserId } from '@/features/auth/current-user';
import type { Profile, TablesUpdate } from '@/shared/lib/database.types';
/** Reads and writes for `public.profiles`. Screens go through the queries and mutations. */

/** `null` when there is no such row, or a block hides it. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** The public URL of an avatar object. The bucket is public, so no signing. */
export function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** Only the columns the RLS column grant allows; anything else fails at the database. */
export async function updateProfile(values: TablesUpdate<'profiles'>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', currentUserId())
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Resize to 512, upload under a fresh timestamped key, point the profile at it,
 * then remove the old object.
 *
 * A new avatar therefore has a new URL, so no image cache anywhere — expo-image
 * on the phone, the browser on the web build — can go on serving the old one.
 */
export async function uploadAvatar(asset: { uri: string; width: number; height: number }): Promise<Profile> {
  const userId = currentUserId();
  const resized = await resizeJpeg(asset.uri, asset, MAX_AVATAR_EDGE);
  // Object key inside the `avatars` bucket; the storage policy requires the
  // first folder to be the caller's id.
  const path = `${userId}/${Date.now()}.jpg`;

  // `fetch(file://…).arrayBuffer()` rather than a Blob: React Native's Blob has
  // no data the Storage client can read.
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;

  const previous = (await fetchProfile(userId))?.avatar_storage_path ?? null;
  const profile = await updateProfile({ avatar_storage_path: path });
  // Best effort, and deliberately after the row is updated: an orphaned object
  // costs a few kilobytes, a premature delete costs the person their picture.
  if (previous && previous !== path) await supabase.storage.from('avatars').remove([previous]);
  return profile;
}
