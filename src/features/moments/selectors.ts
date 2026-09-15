import type {
  InboxMoment,
  MomentPair,
  OutgoingLockedTrade,
  WaitingSender,
} from '@/features/moments/interfaces';
/** Pure readings of the inbox and my outgoing trades. No I/O, so they are tested. */

/**
 * How long until the next frosted card opens on its own.
 *
 * Nothing changes in the database when a trade's 24 hours pass, so no Realtime
 * event ever arrives. The inbox schedules one refetch for the earliest deadline
 * it holds instead. `null` means there is nothing to wait for.
 */
export function nextUnlockDelay(inbox: InboxMoment[], now: number): number | null {
  const deadlines = inbox
    .filter((moment) => !moment.isOpen && moment.autoUnlockAt !== null)
    .map((moment) => Date.parse(moment.autoUnlockAt as string))
    .filter((time) => Number.isFinite(time) && time > now);
  if (deadlines.length === 0) return null;
  // A second of slack, so the refetch happens after the deadline, not on it.
  return Math.min(...deadlines) - now + 1000;
}

/**
 * My unanswered outgoing moments as grid tiles: my photo on the left, an empty
 * frosted tile on the right until somebody sends one back.
 *
 * One tile per photo, not per recipient — sending one capture to three people
 * is still one moment, and three tiles would claim otherwise.
 */
export function lockedTiles(trades: OutgoingLockedTrade[], urls: Map<string, string>): MomentPair[] {
  const seen = new Set<string>();
  const tiles: MomentPair[] = [];

  for (const trade of trades) {
    if (seen.has(trade.momentId)) continue;
    seen.add(trade.momentId);
    tiles.push({
      tradeId: trade.tradeId,
      date: trade.createdAt,
      leftMomentId: trade.momentId,
      rightMomentId: null,
      left: urls.get(trade.momentId) ?? '',
      right: '',
    });
  }
  return tiles;
}

/**
 * Who is waiting on me, and which trade a capture would answer.
 *
 * Several frosted moments from one person collapse to their oldest unanswered
 * one: answering the newest first would leave the older lock open for ever.
 */
export function waitingBySender(inbox: InboxMoment[]): WaitingSender[] {
  const oldest = new Map<string, InboxMoment>();

  for (const moment of inbox) {
    if (moment.isOpen) continue;
    const held = oldest.get(moment.from.id);
    if (!held || Date.parse(moment.capturedAt) < Date.parse(held.capturedAt)) {
      oldest.set(moment.from.id, moment);
    }
  }
  return [...oldest.values()].map((moment) => ({ person: moment.from, tradeId: moment.tradeId }));
}

/**
 * The recipients screen has one list of selected people; the send has two jobs.
 *
 * Selecting somebody who is waiting on me answers their moment. Selecting
 * anybody else opens a new lock. One capture can do both — and a capture sent
 * to somebody already waiting always answers them rather than opening a second
 * lock in the reverse direction.
 */
export function splitSelection(
  selectedIds: string[],
  waiting: WaitingSender[],
): { replyToTradeIds: string[]; recipientIds: string[] } {
  const tradeByPerson = new Map(waiting.map((entry) => [entry.person.id, entry.tradeId]));
  const replyToTradeIds: string[] = [];
  const recipientIds: string[] = [];

  for (const id of selectedIds) {
    const tradeId = tradeByPerson.get(id);
    if (tradeId) replyToTradeIds.push(tradeId);
    else recipientIds.push(id);
  }
  return { replyToTradeIds, recipientIds };
}
