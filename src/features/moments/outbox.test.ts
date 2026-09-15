import { runEntry, type OutboxDeps, type OutboxEntry } from '@/features/moments/outbox';

const entry = (over: Partial<OutboxEntry> = {}): OutboxEntry => ({
  id: 'e1',
  localUri: 'file:///capture.jpg',
  width: 1600,
  height: 1200,
  caption: 'hi',
  replyToTradeIds: [],
  recipientIds: [],
  names: [],
  status: 'sending',
  error: null,
  momentId: null,
  answeredTradeIds: [],
  ...over,
});

function deps(over: Partial<OutboxDeps> = {}): jest.Mocked<OutboxDeps> {
  return {
    createMoment: jest.fn(async () => 'm1'),
    respondToTrade: jest.fn(async () => ({})),
    sendMoment: jest.fn(async () => ['t1']),
    ...over,
  } as jest.Mocked<OutboxDeps>;
}

describe('runEntry', () => {
  it('uploads once, then answers and sends', async () => {
    const d = deps();
    const progress: Partial<OutboxEntry>[] = [];

    await runEntry(entry({ replyToTradeIds: ['t-a'], recipientIds: ['ben'] }), d, (p) => progress.push(p));

    expect(d.createMoment).toHaveBeenCalledTimes(1);
    expect(d.createMoment).toHaveBeenCalledWith({
      localUri: 'file:///capture.jpg',
      caption: 'hi',
      width: 1600,
      height: 1200,
    });
    expect(d.respondToTrade).toHaveBeenCalledWith('t-a', 'm1');
    expect(d.sendMoment).toHaveBeenCalledWith('m1', ['ben']);
    expect(progress).toEqual([{ momentId: 'm1' }, { answeredTradeIds: ['t-a'] }]);
  });

  it('opens no trade when nobody new was picked', async () => {
    const d = deps();
    await runEntry(entry({ replyToTradeIds: ['t-a'] }), d, () => {});
    expect(d.sendMoment).not.toHaveBeenCalled();
  });

  it('answers every frosted moment the capture replies to', async () => {
    const d = deps();
    await runEntry(entry({ replyToTradeIds: ['t-a', 't-b'] }), d, () => {});
    expect(d.respondToTrade).toHaveBeenCalledTimes(2);
  });

  it('a retry re-uses the upload and skips the answers it already made', async () => {
    const d = deps();

    await runEntry(
      entry({
        momentId: 'm1',
        answeredTradeIds: ['t-a'],
        replyToTradeIds: ['t-a', 't-b'],
        recipientIds: ['ben'],
      }),
      d,
      () => {},
    );

    expect(d.createMoment).not.toHaveBeenCalled();
    expect(d.respondToTrade).toHaveBeenCalledTimes(1);
    expect(d.respondToTrade).toHaveBeenCalledWith('t-b', 'm1');
    // send_moment's unique index makes a repeat a no-op, so it is not tracked.
    expect(d.sendMoment).toHaveBeenCalledWith('m1', ['ben']);
  });

  it('reports the upload before it answers, so a failure there is not re-uploaded', async () => {
    const progress: Partial<OutboxEntry>[] = [];
    const d = deps({
      respondToTrade: jest.fn(async () => {
        throw new Error('trade_already_answered');
      }),
    });

    await expect(runEntry(entry({ replyToTradeIds: ['t-a'] }), d, (p) => progress.push(p))).rejects.toThrow(
      'trade_already_answered',
    );
    expect(progress).toEqual([{ momentId: 'm1' }]);
  });
});
