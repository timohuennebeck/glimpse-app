import { I18n } from 'i18n-js';
import { de } from '@/shared/i18n/locales/de';
import { en } from '@/shared/i18n/locales/en';
export const i18n = new I18n({ de, en });

/**
 * German is the launch locale, so it is both the default and the fallback: an
 * untranslated English key renders the German string rather than the raw key.
 */
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

/**
 * English is pinned as the ACTIVE locale.
 *
 * It is pinned rather than read from the device because both locales must be
 * complete before following the device is safe — a partial locale renders a
 * screen in two languages. German in `de.ts` is complete and stays the
 * fallback, so switching the launch market back is this one line.
 *
 * To follow the device instead: `getLocales()[0]?.languageCode` from
 * expo-localization, gated on both locales being complete.
 */
i18n.locale = 'en';

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
