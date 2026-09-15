import { I18n } from 'i18n-js';
import type { Translations } from '@/shared/i18n/locales/de';
import { de } from '@/shared/i18n/locales/de';
import { en } from '@/shared/i18n/locales/en';

/**
 * Every dot path into the locale whose value is a string, and every one whose
 * value is a list. Derived from the locale type, so a renamed or removed string
 * is a compile error at every call site — `t('feed.empty.title')` is checked,
 * `t('feed.empty.nope')` does not compile.
 */
type StringPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? never
    : T[K] extends Record<string, unknown>
      ? StringPaths<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
}[keyof T & string];

type ListPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? ListPaths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type TranslationKey = StringPaths<Translations>;
export type TranslationListKey = ListPaths<Translations>;
export const i18n = new I18n({ de, en });

/**
 * Both locale files are typed as the complete `Translations`, so a missing key
 * is a compile error and the fallback never fires in practice.
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

/** Look up a translation by constant, e.g. `t('feed.storiesLabel')`. */
export function t(key: TranslationKey, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/**
 * Arrays in the locale files (review quotes, suggestion chips) come back as
 * arrays, which `t()` stringifies. This preserves the shape.
 */
export function tList<T = unknown>(key: TranslationListKey): T[] {
  const value = i18n.t(key, { defaultValue: [] });
  return Array.isArray(value) ? (value as T[]) : [];
}

export function getLocale(): string {
  return i18n.locale;
}
