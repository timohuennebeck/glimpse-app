import { errorMessage } from '@/shared/lib/error-message';
import { en } from '@/shared/i18n/locales/en';

describe('errorMessage', () => {
  it('translates a database error code wherever it appears in the message', () => {
    expect(errorMessage(new Error('friend_cap_reached'))).toBe(en.errors.friendCapReached);
    expect(errorMessage({ message: 'P0001: trade_already_answered' })).toBe(en.errors.tradeAlreadyAnswered);
  });

  it('keeps any other message as it is', () => {
    expect(errorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials');
  });

  it('falls back to the generic copy when there is no message', () => {
    expect(errorMessage(undefined)).toBe(en.errors.generic);
  });

  // Verified against the live database: respond_to_trade and send_moment raise
  // these, and none of them was mapped, so they reached the screen verbatim.
  it.each(['not_trade_responder', 'not_moment_author', 'trade_not_found', 'not_authenticated'])(
    'does not show the raw code %s to a person',
    (code) => {
      expect(errorMessage(new Error(code))).toBe(en.errors.generic);
    },
  );
});
