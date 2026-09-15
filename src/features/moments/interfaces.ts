import type { TradeStatus } from '@/shared/lib/database.types';
/** The sender of a received moment, as the cards and the rails need them. */
export interface MomentSender {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

/**
 * A received moment as the UI thinks of it: a photo plus a lock.
 *
 * `photo` is a signed URL — the original once the trade is open, the frosted
 * rendition before that, and `''` when the server withholds it entirely
 * (a moment whose blurred rendition does not exist yet).
 */
export interface InboxMoment {
  tradeId: string;
  momentId: string;
  from: MomentSender;
  caption: string | null;
  capturedAt: string;
  status: TradeStatus;
  /** False while the moment is frosted and awaiting a trade back. */
  isOpen: boolean;
  /** When the soft escape fires, if one is set. */
  autoUnlockAt: string | null;
  seenAt: string | null;
  photo: string;
}

/**
 * A completed trade: two photos taken the same day, kept together — or your own
 * half still waiting for one, which is what `rightMomentId: null` means.
 */
export interface MomentPair {
  tradeId: string;
  date: string;
  leftMomentId: string;
  /** `null` while nobody has traded back for this photo. */
  rightMomentId: string | null;
  left: string;
  right: string;
}

/** What the full-screen photo viewer needs, resolved for any moment id. */
export interface MomentPhoto {
  photo: string;
  fromName: string;
  fromAvatarUrl: string | null;
  capturedAt: string;
}

/** Somebody whose frosted moment I have not answered, and the trade to answer. */
export interface WaitingSender {
  person: MomentSender;
  tradeId: string;
}

/** One of my own moments that nobody has traded back for yet. */
export interface OutgoingLockedTrade {
  tradeId: string;
  momentId: string;
  createdAt: string;
}
