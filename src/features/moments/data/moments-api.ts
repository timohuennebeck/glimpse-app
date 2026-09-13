import { isSupabaseConfigured, requireSupabase } from '@/shared/lib/supabase';
import { demoInbox, demoPairs, demoProfiles } from '@/shared/lib/fixtures';
import type { InboxRow } from '@/shared/lib/database.interfaces';
import type { InboxMoment, MomentPair, MomentPhoto } from '@/features/moments/interfaces';
/**
 * Data access for the trade loop.
 *
 * Every function degrades to fixtures when no Supabase project is configured,
 * so the screens are reviewable before the backend exists. The shape returned
 * is identical in both branches.
 */

export async function fetchInbox(): Promise<InboxMoment[]> {
  if (!isSupabaseConfigured) {
    return demoInbox.map((row) => toInboxMoment(row, demoProfiles[row.from_id]?.photo ?? null, row.photo));
  }

  const sb = requireSupabase();
  const { data, error } = await sb.from('v_inbox').select('*');
  if (error) throw error;

  const rows = data ?? [];
  const urls = await signedMomentUrls(rows.map((row) => row.moment_id));

  // The photo is empty when the server withholds the moment (no blurred
  // rendition yet); the card then draws its neutral frosted placeholder.
  return rows.map((row) =>
    toInboxMoment(
      row,
      row.from_avatar_path ? publicAvatarUrl(row.from_avatar_path) : null,
      urls.get(row.moment_id) ?? '',
    ),
  );
}

function toInboxMoment(row: InboxRow, avatar: string | number | null, photo: string | number): InboxMoment {
  return {
    tradeId: row.trade_id,
    momentId: row.moment_id,
    from: { id: row.from_id, name: row.from_name, username: row.from_username, avatar },
    caption: row.caption,
    capturedAt: row.captured_at,
    status: row.status,
    isOpen: row.is_open,
    autoUnlockAt: row.auto_unlock_at,
    seenAt: row.seen_at,
    photo,
  };
}

const SIGNED_URL_TTL_SECONDS = 3600;

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

export function publicAvatarUrl(path: string): string {
  const sb = requireSupabase();
  return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

interface CreateMomentArgs {
  localUri: string;
  caption: string | null;
  facing: 'front' | 'back';
}

/**
 * Upload a captured photo and insert its row. Returns the moment id.
 *
 * The blurred rendition is produced server-side by an Edge Function watching
 * the bucket, so a tampered client cannot upload a "blurred" copy that is
 * really the original. Until that function is deployed, `blurred_path` stays
 * null and `visible_moment_paths` withholds the moment rather than leaking it.
 */
export async function createMoment(args: CreateMomentArgs): Promise<string> {
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
      leftMomentId: p.initiator_moment_id,
      rightMomentId: p.responder_moment_id,
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
    leftMomentId: p.initiator_moment_id,
    rightMomentId: p.responder_moment_id,
    left: urls.get(p.initiator_moment_id) ?? '',
    right: urls.get(p.responder_moment_id) ?? '',
    locked: false,
  }));
}

/**
 * Resolve one moment for the full-screen viewer, whether it arrived in the
 * inbox or sits in a completed pair. Returns null when the caller may not see
 * it (or it does not exist).
 */
export async function fetchMomentPhoto(momentId: string): Promise<MomentPhoto | null> {
  if (!isSupabaseConfigured) {
    const inbox = demoInbox.find((row) => row.moment_id === momentId);
    if (inbox) {
      return {
        photo: inbox.photo,
        fromName: inbox.from_name,
        fromAvatar: demoProfiles[inbox.from_id]?.photo ?? null,
        capturedAt: inbox.captured_at,
      };
    }
    for (const pair of demoPairs) {
      const side = pair.initiator_moment_id === momentId ? 'a' : pair.responder_moment_id === momentId ? 'b' : null;
      if (!side) continue;
      const author = demoProfiles[side === 'a' ? pair.user_a : pair.user_b];
      return {
        photo: side === 'a' ? pair.leftPhoto : pair.rightPhoto,
        fromName: author?.display_name ?? '',
        fromAvatar: author?.photo ?? null,
        capturedAt: pair.pair_date,
      };
    }
    return null;
  }

  const sb = requireSupabase();
  const { data: moment, error } = await sb
    .from('moments')
    .select('id, author_id, captured_at')
    .eq('id', momentId)
    .maybeSingle();
  if (error) throw error;
  if (!moment) return null;

  const [{ data: author }, urls] = await Promise.all([
    sb.from('profiles').select('display_name, avatar_path').eq('id', moment.author_id).maybeSingle(),
    signedMomentUrls([moment.id]),
  ]);
  const photo = urls.get(moment.id);
  if (!photo) return null;

  return {
    photo,
    fromName: author?.display_name ?? '',
    fromAvatar: author?.avatar_path ? publicAvatarUrl(author.avatar_path) : null,
    capturedAt: moment.captured_at,
  };
}
