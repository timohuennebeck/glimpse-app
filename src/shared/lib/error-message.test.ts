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
});
