import { isSupabaseConfigured, requireSupabase } from '@/shared/lib/supabase';
import { demoInbox, demoPairs, demoProfiles } from '@/shared/lib/fixtures';
import type { InboxMoment, MomentPair } from '@/features/moments/interfaces';
/**
 * Data access for the trade loop.
 *
 * Every function degrades to fixtures when no Supabase project is configured,
 * so the screens are reviewable before the backend exists. The shape returned
 * is identical in both branches.
 */

export async function fetchInbox(): Promise<InboxMoment[]> {
  if (!isSupabaseConfigured) {
    return demoInbox.map((row) => ({
      tradeId: row.trade_id,
      momentId: row.moment_id,
      from: {
        id: row.from_id,
        name: row.from_name,
        username: row.from_username,
        avatar: demoProfiles[row.from_id]?.photo ?? null,
      },
      caption: row.caption,
      capturedAt: row.captured_at,
      status: row.status,
      isOpen: row.is_open,
      autoUnlockAt: row.auto_unlock_at,
      seenAt: row.seen_at,
      photo: row.photo,
    }));
  }

  const sb = requireSupabase();
  const { data, error } = await sb.from('v_inbox').select('*');
  if (error) throw error;

  const rows = data ?? [];
  const urls = await signedMomentUrls(rows.map((row) => row.moment_id));

  return rows.map((row) => ({
    tradeId: row.trade_id,
    momentId: row.moment_id,
    from: {
      id: row.from_id,
      name: row.from_name,
      username: row.from_username,
      avatar: row.from_avatar_path ? publicAvatarUrl(row.from_avatar_path) : null,
    },
    caption: row.caption,
    capturedAt: row.captured_at,
    status: row.status,
    isOpen: row.is_open,
    autoUnlockAt: row.auto_unlock_at,
    seenAt: row.seen_at,
    // Empty when the server withholds the moment (no blurred rendition yet);
    // the card then draws its neutral frosted placeholder.
    photo: urls.get(row.moment_id) ?? '',
  }));
}

/**
 * Signed URLs for many moments in two round trips, however many there are.
 *
 * The server decides *which* rendition each caller may see
 * (`visible_moment_paths`); the Storage API then refuses to sign any path the
 * caller's RLS does not allow. The client never chooses — it only asks.
 * See docs/database.md §3.
 */
export async function signedMomentUrls(momentIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (!isSupabaseConfigured || momentIds.length === 0) return result;
  const sb = requireSupabase();

  const { data: paths, error } = await sb.rpc('visible_moment_paths', { p_moment_ids: momentIds });
  if (error) throw error;

  const allowed = (paths ?? []).filter((p): p is { moment_id: string; path: string } => p.path !== null);
  if (allowed.length === 0) return result;

  const { data: signed, error: signError } = await sb.storage
    .from('moments')
    .createSignedUrls(allowed.map((p) => p.path), SIGNED_URL_TTL_SECONDS);
  if (signError) throw signError;

  const byPath = new Map(signed.map((entry) => [entry.path, entry.signedUrl]));
  for (const { moment_id, path } of allowed) {
    const url = byPath.get(path);
    if (url) result.set(moment_id, url);
  }
  return result;
}

const SIGNED_URL_TTL_SECONDS = 3600;

export function publicAvatarUrl(path: string): string {
  const sb = requireSupabase();
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a captured photo and insert its row. Returns the moment id.
 *
 * The blurred rendition is produced server-side by an Edge Function watching
 * the bucket, so a tampered client cannot upload a "blurred" copy that is
 * really the original. Until that function is deployed, `blurred_path` stays
 * null and `visible_moment_paths` withholds the moment rather than leaking it.
 */
export async function createMoment(args: {
  localUri: string;
  caption: string | null;
  facing: 'front' | 'back';
}): Promise<string> {
  const sb = requireSupabase();
  const { data: auth } = await sb.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('not_authenticated');

  const objectKey = `${userId}/${Date.now()}.jpg`;
  const blob = await (await fetch(args.localUri)).blob();

  const { error: uploadError } = await sb.storage
    .from('moments')
    .upload(`original/${objectKey}`, blob, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { data: moment, error: insertError } = await sb
    .from('moments')
    .insert({
      author_id: userId,
      original_path: `original/${objectKey}`,
      caption: args.caption,
      facing: args.facing,
    })
    .select('id')
    .single();
  if (insertError) throw insertError;

  return moment.id;
}

/** Open a new trade with each recipient — one lock per person. */
export async function sendMoment(momentId: string, recipientIds: string[]): Promise<string[]> {
  const sb = requireSupabase();
  const { data: trades, error } = await sb.rpc('send_moment', {
    p_moment_id: momentId,
    p_recipient_ids: recipientIds,
  });
  if (error) throw error;
  return (trades ?? []).map((t) => t.id);
}

/**
 * Trade back. This is the unlock — after it returns, both halves are visible to
 * both people. The state transition itself happens in a SECURITY DEFINER
 * function so a client cannot forge it.
 */
export async function respondToTrade(tradeId: string, momentId: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('respond_to_trade', {
    p_trade_id: tradeId,
    p_moment_id: momentId,
  });
  if (error) throw error;
  return data;
}

/** Stamp the frosted card as seen, so the sender can tell it landed. */
export async function markTradeSeen(tradeId: string) {
  if (!isSupabaseConfigured) return;
  const sb = requireSupabase();
  await sb.from('trades').update({ seen_at: new Date().toISOString() }).eq('id', tradeId);
}

export async function fetchPairs(withUserId: string): Promise<MomentPair[]> {
  if (!isSupabaseConfigured) {
    return demoPairs.map((p) => ({
      tradeId: p.trade_id,
      date: p.pair_date,
      left: p.leftPhoto,
      right: p.rightPhoto,
      locked: p.locked,
    }));
  }

  const sb = requireSupabase();
  const { data, error } = await sb
    .from('v_pairs')
    .select('*')
    .or(`user_a.eq.${withUserId},user_b.eq.${withUserId}`);
  if (error) throw error;

  const pairs = data ?? [];
  const urls = await signedMomentUrls(pairs.flatMap((p) => [p.initiator_moment_id, p.responder_moment_id]));

  return pairs.map((p) => ({
    tradeId: p.trade_id,
    date: p.pair_date,
    left: urls.get(p.initiator_moment_id) ?? '',
    right: urls.get(p.responder_moment_id) ?? '',
    locked: false,
  }));
}
