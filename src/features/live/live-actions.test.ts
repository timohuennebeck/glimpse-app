import { actionsFor, type LiveEvent } from '@/features/live/live-actions';

const ME = 'me';
const event = (over: Partial<LiveEvent> & Pick<LiveEvent, 'table'>): LiveEvent => ({
  eventType: 'INSERT',
  new: {},
  ...over,
});

describe('actionsFor', () => {
  it('a moment arriving for me changes the inbox', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { responder_id: ME, initiator_id: 'mia' } }), ME),
    ).toEqual([{ kind: 'inbox-changed' }]);
  });

  it('a trade of mine unlocking changes the inbox and the pairs', () => {
    expect(
      actionsFor(
        event({ table: 'trades', eventType: 'UPDATE', new: { responder_id: ME, initiator_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'inbox-changed' }, { kind: 'pairs-changed' }]);
  });

  it('a trade I started appearing changes my locked tiles', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { initiator_id: ME, responder_id: 'mia' } }), ME),
    ).toEqual([{ kind: 'outgoing-changed' }]);
  });

  it('a trade I started being answered changes the pairs and my locked tiles', () => {
    expect(
      actionsFor(
        event({ table: 'trades', eventType: 'UPDATE', new: { initiator_id: ME, responder_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'pairs-changed' }, { kind: 'outgoing-changed' }]);
  });

  it('a message to me arrives under its sender', () => {
    const actions = actionsFor(
      event({
        table: 'messages',
        new: {
          id: 'm1',
          sender_id: 'mia',
          recipient_id: ME,
          content: 'hey',
          moment_id: null,
          trade_id: null,
          created_at: '2026-09-14T10:00:00.000Z',
          read_at: null,
        },
      }),
      ME,
    );

    expect(actions).toEqual([
      {
        kind: 'message-received',
        partnerId: 'mia',
        message: expect.objectContaining({ id: 'm1', senderId: 'mia', content: 'hey' }),
      },
    ]);
  });

  it('my message being read stamps it in the right conversation', () => {
    expect(
      actionsFor(
        event({
          table: 'messages',
          eventType: 'UPDATE',
          new: {
            id: 'm1',
            sender_id: ME,
            recipient_id: 'mia',
            read_at: '2026-09-14T10:05:00.000Z',
          },
        }),
        ME,
      ),
    ).toEqual([
      {
        kind: 'message-read',
        partnerId: 'mia',
        messageId: 'm1',
        readAt: '2026-09-14T10:05:00.000Z',
      },
    ]);
  });

  it('ignores my own message coming back and an unread update', () => {
    expect(actionsFor(event({ table: 'messages', new: { sender_id: ME, recipient_id: 'mia' } }), ME)).toEqual(
      [],
    );
    expect(
      actionsFor(
        event({
          table: 'messages',
          eventType: 'UPDATE',
          new: { sender_id: ME, recipient_id: 'mia', read_at: null },
        }),
        ME,
      ),
    ).toEqual([]);
  });

  it('a friendship in either direction changes the friend lists', () => {
    expect(
      actionsFor(event({ table: 'friendships', new: { requester_id: 'mia', recipient_id: ME } }), ME),
    ).toEqual([{ kind: 'friendships-changed' }]);
    expect(
      actionsFor(
        event({ table: 'friendships', eventType: 'UPDATE', new: { requester_id: ME, recipient_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'friendships-changed' }]);
  });

  it('says nothing about a row that is not mine', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { initiator_id: 'mia', responder_id: 'ben' } }), ME),
    ).toEqual([]);
  });
});
