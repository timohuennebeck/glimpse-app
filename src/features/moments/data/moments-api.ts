import { supabase } from '@/shared/lib/supabase';
import { MAX_CAPTURE_EDGE, resizeJpeg } from '@/shared/lib/resize';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { signedMomentUrls } from '@/features/moments/data/moment-urls';
import { lockedTiles } from '@/features/moments/selectors';
import type { InboxRow, PairRow } from '@/shared/lib/database.types';
import type {
  InboxMoment,
  MomentPair,
  MomentPhoto,
  OutgoingLockedTrade,
} from '@/features/moments/interfaces';
/** Data access for the trade loop. Screens go through the queries and mutations. */

export async function fetchInbox(): Promise<InboxMoment[]> {
  const { data, error } = await supabase
    .from('v_inbox')
    .select('*')
    .overrideTypes<InboxRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  const urls = await signedMomentUrls(rows.map((row) => row.moment_id));

  // `photo` is empty when the server withholds the moment; the card then draws
  // its own neutral frosted placeholder rather than a broken image.
  return rows.map((row) => ({
    tradeId: row.trade_id,
    momentId: row.moment_id,
    from: {
      id: row.from_id,
      name: row.from_name,
      username: row.from_username,
      avatarUrl: avatarUrl(row.from_avatar_storage_path),
    },
    caption: row.caption,
    capturedAt: row.moment_created_at,
    status: row.status,
    isOpen: row.is_open,
    autoUnlockAt: row.auto_unlock_at,
    seenAt: row.seen_at,
    photo: urls.get(row.moment_id) ?? '',
  }));
}

/** `null` asks for every pair I am in; an id narrows it to that person. */
export async function fetchPairs(withUserId: string | null): Promise<MomentPair[]> {
  const base = supabase.from('v_pairs').select('*');
  const filtered = withUserId ? base.or(`user_a.eq.${withUserId},user_b.eq.${withUserId}`) : base;
  const { data, error } = await filtered.overrideTypes<PairRow[], { merge: false }>();
  if (error) throw error;

  const pairs = data ?? [];
  const urls = await signedMomentUrls(
    pairs.flatMap((pair) => [pair.initiator_moment_id, pair.responder_moment_id]),
  );

  return pairs.map((pair) => ({
    tradeId: pair.trade_id,
    date: pair.pair_at,
    leftMomentId: pair.initiator_moment_id,
    rightMomentId: pair.responder_moment_id,
    left: urls.get(pair.initiator_moment_id) ?? '',
    right: urls.get(pair.responder_moment_id) ?? '',
  }));
}

/**
 * My own moments nobody has traded back for — the locked tiles on my grid.
 * Newest first, so they read as one sequence with the completed pairs.
 */
export async function fetchOutgoingLocked(): Promise<MomentPair[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('id, initiator_moment_id, created_at')
    .eq('initiator_id', currentUserId())
    .eq('status', 'pending')
    .is('responder_moment_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const trades: OutgoingLockedTrade[] = (data ?? []).map((row) => ({
    tradeId: row.id,
    momentId: row.initiator_moment_id,
    createdAt: row.created_at,
  }));
  const urls = await signedMomentUrls(trades.map((trade) => trade.momentId));
  return lockedTiles(trades, urls);
}

interface CreateMomentArgs {
  localUri: string;
  caption: string | null;
  /** Pixel size of the capture. Required: without it the resize cannot bound anything. */
  width: number;
  height: number;
}

/**
 * Resize, upload, insert the row, make the frosted rendition. Returns the
 * moment id.
 *
 * The blurred copy is produced server-side on purpose: a client that could
 * upload its own "blurred" rendition could upload the original and call it
 * blurred. A failure here fails the whole send, so a recipient never ends up
 * with a moment there is nothing to show them for.
 */
export async function createMoment(args: CreateMomentArgs): Promise<string> {
  const userId = currentUserId();
  const resized = await resizeJpeg(
    args.localUri,
    { width: args.width, height: args.height },
    MAX_CAPTURE_EDGE,
  );
  // The row constraint and the storage policy both require this exact shape.
  const objectKey = `original/${userId}/${Date.now()}.jpg`;

  // `fetch(file://…).arrayBuffer()` rather than a Blob: React Native's Blob has
  // no data the Storage client can read.
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('moments')
    .upload(objectKey, body, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { data: moment, error: insertError } = await supabase
    .from('moments')
    .insert({
      author_id: userId,
      original_storage_path: objectKey,
      caption: args.caption,
      width: resized.width,
      height: resized.height,
    })
    .select('id')
    .single();
  if (insertError) throw insertError;

  const { error: blurError } = await supabase.functions.invoke('blur-moment', {
    body: { moment_id: moment.id },
  });
  if (blurError) throw blurError;

  return moment.id;
}

/** Open a new trade with each recipient — one lock per person. */
export async function sendMoment(momentId: string, recipientIds: string[]): Promise<string[]> {
  const { data: trades, error } = await supabase.rpc('send_moment', {
    p_moment_id: momentId,
    p_recipient_ids: recipientIds,
  });
  if (error) throw error;
  return (trades ?? []).map((trade) => trade.id);
}

/**
 * Trade back. This is the unlock — after it returns, both halves are visible to
 * both people. The state transition itself happens in a SECURITY DEFINER
 * function so a client cannot forge it.
 */
export async function respondToTrade(tradeId: string, momentId: string) {
  const { data, error } = await supabase.rpc('respond_to_trade', {
    p_trade_id: tradeId,
    p_moment_id: momentId,
  });
  if (error) throw error;
  return data;
}

/** Stamp the frosted card as seen, so the sender can tell it landed. */
export async function markTradeSeen(tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', tradeId)
    .is('seen_at', null);
  if (error) throw error;
}

/**
 * Resolve one moment for the full-screen viewer, whether it arrived in the
 * inbox or sits in a completed pair. `null` when the caller may not see it, or
 * it does not exist.
 */
export async function fetchMomentPhoto(momentId: string): Promise<MomentPhoto | null> {
  const { data: moment, error } = await supabase
    .from('moments')
    .select('id, author_id, created_at')
    .eq('id', momentId)
    .maybeSingle();
  if (error) throw error;
  if (!moment) return null;

  const [{ data: author }, urls] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, avatar_storage_path')
      .eq('id', moment.author_id)
      .maybeSingle(),
    signedMomentUrls([moment.id]),
  ]);
  const photo = urls.get(moment.id);
  if (!photo) return null;

  return {
    photo,
    fromName: author?.first_name ?? '',
    fromAvatarUrl: avatarUrl(author?.avatar_storage_path ?? null),
    capturedAt: moment.created_at,
  };
}
