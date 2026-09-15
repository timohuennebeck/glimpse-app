import { supabase } from '@/shared/lib/supabase';
import type { Profile } from '@/shared/lib/database.types';
/** Reads and writes for `public.profiles`. Screens go through the queries and mutations. */

/** `null` when there is no such row, or a block hides it. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
