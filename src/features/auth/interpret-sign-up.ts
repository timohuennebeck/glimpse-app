/**
 * What Supabase's sign-up response actually means.
 *
 * Two answers look like success and are not. With "Confirm email" on, sign-up
 * returns a user and no session. For an address that already has an account,
 * Supabase deliberately returns a fabricated user with an empty `identities`
 * array rather than confirming to a stranger that the address exists. Neither
 * is an error, and neither may let the flow walk on into the app.
 */
export type SignUpOutcome =
  { kind: 'signed-in'; userId: string } | { kind: 'confirmation-required' } | { kind: 'already-registered' };

/** Structural subset of supabase-js's `AuthResponse` — only what is read here. */
export interface SignUpResponseLike {
  data: {
    user: { id: string; identities?: unknown[] | null } | null;
    session: unknown | null;
  };
  error: { code?: string | null; message: string } | null;
}

export function interpretSignUp({ data, error }: SignUpResponseLike): SignUpOutcome {
  if (error) {
    if (error.code === 'user_already_exists' || /already\s+registered/i.test(error.message)) {
      return { kind: 'already-registered' };
    }
    throw error;
  }
  if (data.user && data.session) return { kind: 'signed-in', userId: data.user.id };
  if (data.user?.identities?.length === 0) return { kind: 'already-registered' };
  return { kind: 'confirmation-required' };
}
