import { appendMessage, pairKey } from '@/features/chat/messages';
import type { ChatMessage } from '@/features/chat/interfaces';

const message = (id: string, createdAt: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  senderId: 'me',
  recipientId: 'mia',
  content: id,
  momentId: null,
  tradeId: null,
  createdAt,
  readAt: null,
  ...over,
});

describe('appendMessage', () => {
  const first = message('a', '2026-09-14T10:00:00.000Z');
  const second = message('b', '2026-09-14T10:01:00.000Z');

  it('adds a message at the end', () => {
    expect(appendMessage([first], second).map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('replaces the pending copy of a message rather than showing it twice', () => {
    const pending = message('b', '2026-09-14T10:01:00.000Z', { pending: true });
    const confirmed = message('b', '2026-09-14T10:01:02.000Z');
    const list = appendMessage(appendMessage([first], pending), confirmed);

    expect(list.map((m) => m.id)).toEqual(['a', 'b']);
    expect(list[1].pending).toBeUndefined();
  });

  it('puts an out-of-order arrival where it belongs', () => {
    const early = message('z', '2026-09-14T09:59:00.000Z');
    expect(appendMessage([first, second], early).map((m) => m.id)).toEqual(['z', 'a', 'b']);
  });
});

describe('pairKey', () => {
  it('is the same string from either side', () => {
    expect(pairKey('bbb', 'aaa')).toBe('aaa:bbb');
    expect(pairKey('aaa', 'bbb')).toBe(pairKey('bbb', 'aaa'));
  });
});
