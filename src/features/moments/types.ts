import type { InboxRow, PairRow, TradeStatus } from '@/shared/lib/database.types';

/**
 * A received moment as the UI thinks of it: a photo plus a lock.
 * `photo` is the resolved image source — a remote signed URL, or a bundled
 * fixture while Supabase is unconfigured.
 */
export type InboxMoment = {
  tradeId: string;
  momentId: string;
  from: { id: string; name: string; username: string | null; avatar: string | number | null };
  caption: string | null;
  capturedAt: string;
  status: TradeStatus;
  /** False while the moment is frosted and awaiting a trade back. */
  isOpen: boolean;
  /** When the soft escape fires, if one is set. */
  autoUnlockAt: string | null;
  seenAt: string | null;
  photo: string | number;
};

/** A completed trade: two photos taken the same day, side by side. */
export type MomentPair = {
  tradeId: string;
  date: string;
  left: string | number;
  right: string | number;
  /** True when this is your own outgoing half still waiting on a reply. */
  locked: boolean;
};

export type { InboxRow, PairRow };
