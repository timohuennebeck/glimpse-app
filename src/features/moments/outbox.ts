/**
 * Sending is not a plain mutation: uploading a photo takes real seconds, and
 * the screen that took it is gone by then. An entry is queued, the screen
 * navigates, and this drains it behind them.
 */

/** A send in flight. */
export interface OutboxEntry {
  id: string;
  localUri: string;
  width: number;
  height: number;
  caption: string | null;
  /** Frosted moments this capture answers. */
  replyToTradeIds: string[];
  /** Friends this capture opens a new lock with. */
  recipientIds: string[];
  /** For the line above the feed: "Sending to Mia…". */
  names: string[];
  status: 'sending' | 'failed';
  error: string | null;
  /** Set once the photo is up, so a retry does not upload it again. */
  momentId: string | null;
  /** Answered already, so a retry does not answer them twice. */
  answeredTradeIds: string[];
}

export interface OutboxDeps {
  createMoment(args: {
    localUri: string;
    caption: string | null;
    width: number;
    height: number;
  }): Promise<string>;
  respondToTrade(tradeId: string, momentId: string): Promise<unknown>;
  sendMoment(momentId: string, recipientIds: string[]): Promise<unknown>;
}

/**
 * Run one entry to completion, recording each finished step through
 * `onProgress` so a retry picks up where it stopped.
 *
 * Two of the three steps must not repeat: the upload is the expensive one, and
 * `respond_to_trade` refuses a second answer outright. `send_moment` needs no
 * bookkeeping — its unique index on (moment, recipient) makes a repeat a no-op.
 */
export async function runEntry(
  entry: OutboxEntry,
  deps: OutboxDeps,
  onProgress: (patch: Partial<OutboxEntry>) => void,
): Promise<void> {
  let momentId = entry.momentId;
  if (!momentId) {
    momentId = await deps.createMoment({
      localUri: entry.localUri,
      caption: entry.caption,
      width: entry.width,
      height: entry.height,
    });
    onProgress({ momentId });
  }

  const answered = [...entry.answeredTradeIds];
  for (const tradeId of entry.replyToTradeIds) {
    if (answered.includes(tradeId)) continue;
    await deps.respondToTrade(tradeId, momentId);
    answered.push(tradeId);
    onProgress({ answeredTradeIds: [...answered] });
  }

  if (entry.recipientIds.length > 0) await deps.sendMoment(momentId, entry.recipientIds);
}
