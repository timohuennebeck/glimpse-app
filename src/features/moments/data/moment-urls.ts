import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/shared/lib/supabase';
import { createSignedUrlCache } from '@/shared/lib/signed-urls';
/**
 * Signed URLs for moment objects, cached so a refetch hands back the same URL
 * and `expo-image` goes on serving it from disk instead of downloading the same
 * photo again.
 *
 * The server decides *which* rendition each caller may see
 * (`visible_moment_paths`); the Storage API then refuses to sign any path the
 * caller's row security does not allow. The client never chooses — it only
 * asks. See docs/database.md §3.
 */
export const momentUrlCache = createSignedUrlCache(AsyncStorage, async (paths, expiresIn) => {
  const { data, error } = await supabase.storage.from('moments').createSignedUrls(paths, expiresIn);
  if (error) throw error;
  return data ?? [];
});

/** A URL per moment the caller may see. Ids that were withheld are simply absent. */
export async function signedMomentUrls(momentIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const ids = [...new Set(momentIds)];
  if (ids.length === 0) return result;

  const { data: paths, error } = await supabase.rpc('visible_moment_paths', { p_moment_ids: ids });
  if (error) throw error;

  // A null path is "nothing yet": a locked moment whose blurred rendition has
  // not been made is withheld rather than leaked.
  const allowed = (paths ?? []).filter(
    (row): row is { moment_id: string; path: string } => row.path !== null,
  );
  if (allowed.length === 0) return result;

  const urls = await momentUrlCache.get(allowed.map((row) => row.path));
  for (const { moment_id, path } of allowed) {
    const url = urls.get(path);
    if (url) result.set(moment_id, url);
  }
  return result;
}
