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
  return message || t('errors.generic');
}
