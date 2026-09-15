import { t } from '@/shared/i18n/i18n';
import { ERRORS } from '@/shared/i18n/keys';
import type { TranslationKey } from '@/shared/i18n/keys';

/** Codes raised by the database functions, mapped to copy a person can read. */
const KNOWN_CODES: Record<string, TranslationKey> = {
  friend_cap_reached: ERRORS.FRIEND_CAP_REACHED,
  not_friends: ERRORS.NOT_FRIENDS,
  trade_already_answered: ERRORS.TRADE_ALREADY_ANSWERED,
  trade_expired: ERRORS.TRADE_EXPIRED,
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
  return message || t(ERRORS.GENERIC);
}
