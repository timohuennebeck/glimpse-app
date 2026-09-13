import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { de } from './locales/de';
import { en } from './locales/en';

export const i18n = new I18n({ de, en });

/**
 * German is the launch locale, so it is both the default and the fallback: an
 * untranslated English key renders the German string rather than the raw key.
 */
i18n.defaultLocale = 'de';
i18n.enableFallback = true;

/**
 * German is pinned as the ACTIVE locale, not merely the fallback.
 *
 * Following the device locale meant an English phone rendered the handful of
 * keys translated in `en.ts` in English and fell back to German for the rest —
 * one screen in two languages. Until English is a complete translation that we
 * actually intend to ship, the launch locale is German for everyone.
 *
 * `deviceLocale` is read so the choice is visible and easy to re-enable.
 */
export const deviceLocale = getLocales()[0]?.languageCode ?? 'de';
i18n.locale = 'de';

/** Look up a translation. Path is dot-notated, e.g. `feed.storiesLabel`. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/**
 * Arrays in the locale files (review quotes, suggestion chips) come back as
 * arrays, which `t()` stringifies. This preserves the shape.
 */
export function tList<T = unknown>(key: string): T[] {
  const value = i18n.t(key, { defaultValue: [] });
  return Array.isArray(value) ? (value as T[]) : [];
}

export function getLocale(): string {
  return i18n.locale;
}

export function setLocale(locale: 'de' | 'en') {
  i18n.locale = locale;
}
