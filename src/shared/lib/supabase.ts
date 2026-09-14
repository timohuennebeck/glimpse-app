import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from '@/shared/lib/database.interfaces';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
/**
 * The `sb_publishable_…` key from the project's API settings. It replaces the
 * legacy JWT-shaped `anon` key, which Supabase is retiring; both map to the
 * `anon` Postgres role, so RLS is what protects the data, not the key.
 */
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * The app is intentionally runnable before a Supabase project exists: every
 * data hook falls back to fixtures when this is false.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * `null` until the project is wired up. Call sites should go through the feature
 * `data/` modules rather than touching this directly.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // RN has no URL bar to parse a magic-link fragment out of.
        detectSessionInUrl: false,
        // Serialises token refreshes across concurrent calls in one process.
        lock: processLock,
      },
    })
  : null;

/**
 * Supabase only refreshes tokens while the app is foregrounded; without this the
 * session silently expires after a long background.
 */
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Throws a readable error instead of `null is not an object` deep in a hook. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set ' +
        'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return supabase;
}
