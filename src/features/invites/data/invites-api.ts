import { supabase } from '@/shared/lib/supabase';
import { SIGN_TTL_SECONDS } from '@/shared/lib/signed-urls';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
/**
 * The growth loop's front door. An invite is a token that stands in for a
 * friendship that does not exist yet: opening it shows the frosted moment, and
 * claiming it makes the two people friends and opens the trade.
 */

/**
 * One constant, to be swapped for a universal link once there is a domain.
 * A custom scheme is enough while the app is not in a store.
 */
export const INVITE_BASE = 'glimpse://invite/';

export function inviteLink(token: string): string {
  return `${INVITE_BASE}${token}`;
}

export interface InvitePreview {
  inviterName: string;
  inviterAvatarUrl: string | null;
  /** `null` for an invite that carries no photo — just "come and trade". */
  momentId: string | null;
  photo: string | null;
  createdAt: string;
}

export interface ClaimResult {
  inviterId: string;
  momentId: string | null;
  /** `null` when the invite carried no moment, so there is nothing to answer. */
  tradeId: string | null;
}

/** The `invites` trigger refuses a moment that is not the inviter's own. */
export async function createInvite(momentId?: string | null): Promise<string> {
  const { data, error } = await supabase
    .from('invites')
    .insert({ inviter_id: currentUserId(), moment_id: momentId ?? null })
    .select('token')
    .single();
  if (error) throw error;
  return data.token;
}

/**
 * Callable without an account — the token is the only key. `null` for a token
 * that is unknown, expired, or already claimed.
 */
export async function fetchInvitePreview(token: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc('invite_preview', { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;

  // Signed directly rather than through the moment URL cache: a signed-out
  // visitor has no `visible_moment_paths` to ask. The `invite_object_readable`
  // policy is what lets the Storage API sign this one path for them.
  let photo: string | null = null;
  if (row.blurred_storage_path) {
    const { data: signed } = await supabase.storage
      .from('moments')
      .createSignedUrl(row.blurred_storage_path, SIGN_TTL_SECONDS);
    photo = signed?.signedUrl ?? null;
  }

  return {
    inviterName: row.inviter_first_name,
    inviterAvatarUrl: avatarUrl(row.inviter_avatar_storage_path),
    momentId: row.moment_id,
    photo,
    createdAt: row.created_at,
  };
}

/**
 * Marks the token used, makes the two friends, and opens the trade for the
 * frosted photo. `null` when the token is not claimable — unknown, expired,
 * already used, the caller's own, or across a block.
 */
export async function claimInvite(token: string): Promise<ClaimResult | null> {
  const { data, error } = await supabase.rpc('claim_invite', { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return { inviterId: row.inviter_id, momentId: row.moment_id, tradeId: row.trade_id };
}
