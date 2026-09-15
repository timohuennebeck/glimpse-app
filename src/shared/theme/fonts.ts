/**
 * The mock sets `font-family:'TikTok Sans'`.
 *
 * expo-google-fonts registers each weight as its own family, so weight is
 * chosen by picking a family, never by `fontWeight`. These names must match the
 * keys `useFonts()` is given in `app/_layout.tsx` exactly — a name with no
 * loaded font does not error, it silently falls back to the system face.
 *
 * Project rule: Glimpse never uses a weight above 600 (semibold). There is no
 * heavier family to pick, so the rule enforces itself.
 *
 * This file is also read by `tailwind.config.js` in Node, so it must not import
 * from react-native.
 */
export const fontFamily = {
  regular: 'TikTokSans_400Regular',
  medium: 'TikTokSans_500Medium',
  semibold: 'TikTokSans_600SemiBold',
} as const;

export type FontWeight = keyof typeof fontFamily;

/**
 * The mock is drawn on a 390x940 artboard, but a real iPhone viewport is about
 * 390x852 — roughly 10% less vertical room once safe areas are taken out.
 * Transcribing the artboard 1:1 therefore reads noticeably oversized on device.
 *
 * SCALE brings the whole system down one notch. One knob, rather than 40
 * hand-tuned numbers, so the proportions of the original survive.
 */
export const SCALE = 0.88;

/** Round to the nearest half point — RN renders halves cleanly, thirds do not. */
export const px = (n: number) => Math.round(n * SCALE * 2) / 2;

interface TypeSpec {
  fontSize: number;
  lineHeight?: number;
  letterSpacing?: number;
  weight: FontWeight;
  uppercase?: boolean;
}

/**
 * Type scale transcribed from the mock, then scaled. Names follow where each
 * size is used so screens read declaratively instead of repeating magic numbers.
 *
 * Consumed twice: `tailwind.config.js` turns each entry into a `text-<token>`
 * utility (kebab-cased, e.g. `text-display-xl`), and `Text` picks the family
 * from `weight`.
 */
export const type = {
  /** 42px — "Sign up" hero */
  displayXl: { fontSize: px(42), lineHeight: px(42 * 1.04), letterSpacing: px(-1.7), weight: 'semibold' },
  /** 38px — Welcome / paywall hero */
  displayLg: { fontSize: px(38), lineHeight: px(38 * 1.06), letterSpacing: px(-1.4), weight: 'semibold' },
  /** 37px — most onboarding headlines */
  display: { fontSize: px(37), lineHeight: px(37 * 1.06), letterSpacing: px(-1.4), weight: 'semibold' },
  /** 35px — two-line onboarding headline */
  displaySm: { fontSize: px(35), lineHeight: px(35 * 1.06), letterSpacing: px(-1.4), weight: 'semibold' },
  /** 34px — feed greeting */
  headline: { fontSize: px(34), lineHeight: px(34 * 1.06), letterSpacing: px(-1.2), weight: 'semibold' },
  /** 33px — name step (looser leading, inline chips) */
  headlineChips: { fontSize: px(33), lineHeight: px(33 * 1.62), letterSpacing: px(-1.1), weight: 'semibold' },
  /** 32px — invite deeplink */
  headlineSm: { fontSize: px(32), lineHeight: px(32 * 1.08), letterSpacing: px(-1.2), weight: 'semibold' },
  /** 31px — profile name */
  title: { fontSize: px(31), letterSpacing: px(-1), weight: 'semibold' },
  /** 27px — screen title (Friends, Chats) */
  screenTitle: { fontSize: px(27), letterSpacing: px(-0.8), weight: 'semibold' },
  /** 24px — section heading */
  section: { fontSize: px(24), letterSpacing: px(-0.65), weight: 'semibold' },
  /** 23px — sheet title */
  sheetTitle: { fontSize: px(23), letterSpacing: px(-0.6), weight: 'semibold' },
  /** 21px / 19px / 17px — button labels by size */
  buttonXl: { fontSize: px(21), weight: 'semibold' },
  button: { fontSize: px(19), weight: 'semibold' },
  buttonSm: { fontSize: px(17), weight: 'semibold' },
  /** 20px — card name, blurred-moment title */
  cardTitleLg: { fontSize: px(20), letterSpacing: px(-0.35), weight: 'semibold' },
  /** 18px — moment card title */
  cardTitle: { fontSize: px(18), letterSpacing: px(-0.3), weight: 'semibold' },
  /** 17px — list row title, nav title */
  rowTitle: { fontSize: px(17), letterSpacing: px(-0.2), weight: 'semibold' },
  /** 16.5px — list row title (friends/recipients) */
  rowTitleSm: { fontSize: px(16.5), letterSpacing: px(-0.2), weight: 'semibold' },
  /** 19px — body on dark, moment caption */
  bodyLg: { fontSize: px(19), lineHeight: px(19 * 1.36), weight: 'regular' },
  /** 18px — welcome subcopy */
  bodyMd: { fontSize: px(18), lineHeight: px(18 * 1.42), weight: 'regular' },
  /** 17px — list value, benefit row */
  body: { fontSize: px(17), lineHeight: px(17 * 1.4), weight: 'regular' },
  /** 15.5px — default paragraph */
  bodySm: { fontSize: px(15.5), lineHeight: px(15.5 * 1.45), weight: 'regular' },
  /** 15px — chat bubble, caption */
  bodyXs: { fontSize: px(15), lineHeight: px(15 * 1.4), weight: 'regular' },
  /** 14.5px — subtitle */
  subtitle: { fontSize: px(14.5), weight: 'regular' },
  /** 14px — secondary meta */
  meta: { fontSize: px(14), weight: 'regular' },
  /** 13.5px / 13px — tertiary meta */
  metaSm: { fontSize: px(13.5), weight: 'regular' },
  metaXs: { fontSize: px(13), weight: 'regular' },
  /** 12.5px — timestamps, badges */
  caption: { fontSize: px(12.5), weight: 'regular' },
  /** 11.5px — share-row labels */
  captionXs: { fontSize: px(11.5), weight: 'regular' },
  /** 12.5px uppercase tracked — section eyebrow */
  eyebrow: { fontSize: px(12.5), letterSpacing: px(12.5 * 0.14), weight: 'semibold', uppercase: true },
  /** 13px tracked — paywall eyebrow */
  eyebrowAccent: { fontSize: px(13), letterSpacing: px(13 * 0.06), weight: 'semibold' },
} as const satisfies Record<string, TypeSpec>;

export type TypeToken = keyof typeof type;
