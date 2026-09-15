import type { Translations } from '@/shared/i18n/locales/de';
import { en } from '@/shared/i18n/locales/en';
/**
 * Translation keys as typed constants: `t(ONBOARDING.DETAILS.SUBTITLE)` instead
 * of `t('onboarding.details.subtitle')`. The tree is built from the English
 * locale when this module loads; its type is derived from the locale type, so a
 * renamed or removed string fails to compile at every call site.
 */

/** Type-level twin of `screamingSnake`: `storiesLabel` → `STORIES_LABEL`. */
export type ScreamingSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Uppercase<Head>}${SnakeTail<Tail>}`
  : S;

type SnakeTail<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Lowercase<Head>
    ? `${Uppercase<Head>}${SnakeTail<Tail>}`
    : `_${Head}${SnakeTail<Tail>}`
  : S;

export type KeyTree<T, Prefix extends string = ''> = {
  readonly [K in keyof T & string as ScreamingSnake<K>]: T[K] extends readonly unknown[]
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? KeyTree<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
};

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

/** Every key whose value is a string. */
export type TranslationKey = StringPaths<Translations>;
/** Every key whose value is an array (suggestion chips, review quotes). */
export type TranslationListKey = ListPaths<Translations>;

/** `storiesLabel` → `STORIES_LABEL`, `variantA` → `VARIANT_A`. */
export function screamingSnake(key: string): string {
  return (
    key.charAt(0).toUpperCase() +
    key
      .slice(1)
      .replace(/[A-Z]/g, (letter) => `_${letter}`)
      .toUpperCase()
  );
}

export function buildKeys(node: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    const path = `${prefix}${key}`;
    tree[screamingSnake(key)] =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? buildKeys(value as Record<string, unknown>, `${path}.`)
        : path;
  }
  return tree;
}

const KEYS = buildKeys(en) as unknown as KeyTree<Translations>;

export const NAV = KEYS.NAV;
export const COMMON = KEYS.COMMON;
export const TIME = KEYS.TIME;
export const ONBOARDING = KEYS.ONBOARDING;
export const PAYWALL = KEYS.PAYWALL;
export const FEED = KEYS.FEED;
export const CAMERA = KEYS.CAMERA;
export const COMPOSE = KEYS.COMPOSE;
export const MOMENT = KEYS.MOMENT;
export const FRIENDS = KEYS.FRIENDS;
export const CHAT = KEYS.CHAT;
export const PROFILE = KEYS.PROFILE;
export const PHOTO = KEYS.PHOTO;
export const INVITE = KEYS.INVITE;
export const ERRORS = KEYS.ERRORS;
