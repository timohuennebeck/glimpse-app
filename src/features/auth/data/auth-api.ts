import { supabase } from '@/shared/lib/supabase';
import { interpretSignUp, type SignUpOutcome } from '@/features/auth/interpret-sign-up';
import { useSession } from '@/features/auth/hooks/use-session';
/** Email and password. Google sign-in stays inert; see docs/database.md §6. */

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  locale: string;
}

/**
 * `options.data` lands in `auth.users.raw_user_meta_data`, which the
 * `handle_new_user` trigger reads to create the profile row and generate the
 * username. Nothing here writes to `profiles` directly.
 */
export async function signUp({ email, password, firstName, locale }: SignUpInput): Promise<SignUpOutcome> {
  const outcome = interpretSignUp(
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, locale } },
    }),
  );
  // `onAuthStateChange` fires a tick later, and the avatar upload that follows
  // this call needs `currentUserId()` now.
  if (outcome.kind === 'signed-in') useSession.set({ status: 'signed-in', userId: outcome.userId });
  return outcome;
}

/** Returns the user id. Throws Supabase's error, which the form shows as it is. */
export async function signIn({ email, password }: { email: string; password: string }): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  useSession.set({ status: 'signed-in', userId: data.user.id });
  return data.user.id;
}
