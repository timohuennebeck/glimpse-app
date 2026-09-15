import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from '@/shared/lib/database.interfaces';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
/**
 * The `sb_publishable_…` key from the project's API settings. It maps to the
 * `anon` Postgres role, so row-level security is what protects the data.
 */
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  );
}

/** The one client. Screens never import it; feature `data/` modules do. */
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar to parse a magic-link fragment out of.
    detectSessionInUrl: false,
    // Serialises token refreshes across concurrent calls in one process.
    lock: processLock,
  },
});

/**
 * Supabase only refreshes tokens while the app is foregrounded; without this the
 * session silently expires after a long background.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/** @deprecated Always true. Removed in Task 20 once no module reads it. */
export const isSupabaseConfigured = true;

/** @deprecated Import `supabase` instead. Removed in Task 20. */
export function requireSupabase() {
  return supabase;
}
