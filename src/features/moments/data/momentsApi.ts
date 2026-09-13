import { isSupabaseConfigured, requireSupabase } from '@/shared/lib/supabase';
import { demoInbox, demoPairs, demoProfiles } from '@/shared/lib/fixtures';
import type { InboxMoment, MomentPair } from '../types';

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

  // Resolve one signed URL per moment. The server decides which rendition —
  // blurred or original — the signature points at; the client cannot promote it.
  return Promise.all(
    (data ?? []).map(async (row) => ({
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
      photo: (await signedMomentUrl(row.moment_id)) ?? '',
    })),
  );
}

/** The only sanctioned way to get a moment's pixels. See docs/database.md §3. */
export async function signedMomentUrl(momentId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('visible_moment_url', { p_moment_id: momentId });
  if (error) throw error;
  return data ?? null;
}

export function publicAvatarUrl(path: string): string {
  const sb = requireSupabase();
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * Upload a captured photo and create one lock per recipient.
 *
 * The blurred rendition is produced server-side by an Edge Function watching the
 * bucket, so a tampered client cannot upload a "blurred" copy that is really the
 * original. Until that function is deployed, `blurred_path` stays null and
 * `visible_moment_url` falls back to the original — see the note in
 * `supabase/functions/README.md`.
 */
export async function sendMoment(args: {
  localUri: string;
  caption: string | null;
  recipientIds: string[];
  facing: 'front' | 'back';
}): Promise<{ momentId: string; tradeIds: string[] }> {
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

  const { data: trades, error: sendError } = await sb.rpc('send_moment', {
    p_moment_id: moment.id,
    p_recipient_ids: args.recipientIds,
  });
  if (sendError) throw sendError;

  return { momentId: moment.id, tradeIds: (trades ?? []).map((t) => t.id) };
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

  return Promise.all(
    (data ?? []).map(async (p) => ({
      tradeId: p.trade_id,
      date: p.pair_date,
      left: (await signedMomentUrl(p.initiator_moment_id)) ?? '',
      right: (await signedMomentUrl(p.responder_moment_id)) ?? '',
      locked: false,
    })),
  );
}
