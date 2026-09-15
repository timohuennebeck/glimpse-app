import { lockedTiles, nextUnlockDelay, splitSelection, waitingBySender } from '@/features/moments/selectors';
import type { InboxMoment } from '@/features/moments/interfaces';

const NOW = Date.parse('2026-09-14T12:00:00.000Z');
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

const moment = (over: Partial<InboxMoment> & Pick<InboxMoment, 'tradeId'>): InboxMoment => ({
  momentId: `m-${over.tradeId}`,
  from: { id: 'mia', name: 'Mia', username: 'mia', avatarUrl: null },
  caption: null,
  capturedAt: at(-3_600_000),
  status: 'pending',
  isOpen: false,
  autoUnlockAt: null,
  seenAt: null,
  photo: '',
  ...over,
});

describe('nextUnlockDelay', () => {
  it('is null with nothing frosted', () => {
    expect(
      nextUnlockDelay([moment({ tradeId: 't1', isOpen: true, autoUnlockAt: at(3_600_000) })], NOW),
    ).toBeNull();
  });

  it('is null when no frosted moment has a deadline', () => {
    expect(nextUnlockDelay([moment({ tradeId: 't1' })], NOW)).toBeNull();
  });

  it('waits for the earliest deadline, a moment past it', () => {
    const delay = nextUnlockDelay(
      [
        moment({ tradeId: 't1', autoUnlockAt: at(7_200_000) }),
        moment({ tradeId: 't2', autoUnlockAt: at(600_000) }),
      ],
      NOW,
    );
    expect(delay).toBe(601_000);
  });

  it('ignores deadlines that have already passed', () => {
    expect(nextUnlockDelay([moment({ tradeId: 't1', autoUnlockAt: at(-60_000) })], NOW)).toBeNull();
  });
});

describe('lockedTiles', () => {
  it('draws one tile per photo, however many people it went to', () => {
    const tiles = lockedTiles(
      [
        { tradeId: 't1', momentId: 'm1', createdAt: at(-60_000) },
        { tradeId: 't2', momentId: 'm1', createdAt: at(-60_000) },
        { tradeId: 't3', momentId: 'm2', createdAt: at(-120_000) },
      ],
      new Map([['m1', 'https://signed/m1']]),
    );

    expect(tiles).toHaveLength(2);
    expect(tiles[0]).toEqual({
      tradeId: 't1',
      date: at(-60_000),
      leftMomentId: 'm1',
      rightMomentId: null,
      left: 'https://signed/m1',
      right: '',
    });
    // No URL yet: the tile still holds its place rather than vanishing.
    expect(tiles[1].left).toBe('');
  });
});

describe('waitingBySender', () => {
  it('lists one entry per sender, their oldest unanswered moment', () => {
    const inbox = [
      moment({ tradeId: 'new', capturedAt: at(-60_000) }),
      moment({ tradeId: 'old', capturedAt: at(-600_000) }),
      moment({ tradeId: 'ben', from: { id: 'ben', name: 'Ben', username: 'ben', avatarUrl: null } }),
      moment({ tradeId: 'open', isOpen: true }),
    ];

    expect(waitingBySender(inbox)).toEqual([
      { person: expect.objectContaining({ id: 'mia' }), tradeId: 'old' },
      { person: expect.objectContaining({ id: 'ben' }), tradeId: 'ben' },
    ]);
  });
});

describe('splitSelection', () => {
  const waiting = [{ person: { id: 'mia', name: 'Mia', username: null, avatarUrl: null }, tradeId: 't-mia' }];

  it('answers the people who are waiting and opens a lock for the rest', () => {
    expect(splitSelection(['mia', 'ben'], waiting)).toEqual({
      replyToTradeIds: ['t-mia'],
      recipientIds: ['ben'],
    });
  });

  it('never opens a second lock back at someone already waiting on me', () => {
    expect(splitSelection(['mia'], waiting)).toEqual({ replyToTradeIds: ['t-mia'], recipientIds: [] });
  });
});
