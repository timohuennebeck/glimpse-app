import { t } from '@/shared/i18n/i18n';
import type { TranslationKey } from '@/shared/i18n/i18n';

/** Codes raised by the database functions, mapped to copy a person can read. */
const KNOWN_CODES: Record<string, TranslationKey> = {
  friend_cap_reached: 'errors.friendCapReached',
  not_friends: 'errors.notFriends',
  trade_already_answered: 'errors.tradeAlreadyAnswered',
  trade_expired: 'errors.tradeExpired',
};

/** The message a screen shows for a thrown value. Supabase errors are plain objects, not `Error`s. */
export function errorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';
  const code = Object.keys(KNOWN_CODES).find((known) => message.includes(known));
  if (code) return t(KNOWN_CODES[code]);

  // A bare snake_case token is one of the database's own codes, not prose:
  // respond_to_trade alone can raise not_trade_responder, not_moment_author,
  // trade_not_found and not_authenticated, none of which mean anything to a
  // person. Anything with a space in it is a real sentence — Supabase's own
  // "Invalid login credentials" is the one users actually need to read.
  const isBareCode = /^[a-z][a-z0-9_]*$/.test(message);
  if (!message || isBareCode) return t('errors.generic');
  return message;
}
