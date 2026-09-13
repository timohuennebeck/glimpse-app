import { Platform, TextStyle } from 'react-native';

/**
 * The mock sets `font-family:'TikTok Sans'`. That face is loaded at runtime via
 * expo-font (see `src/shared/theme/fonts.ts`); until it resolves we fall back to
 * the platform UI face so layout never shifts to a serif.
 */
export const fontFamily = {
  regular: Platform.select({ ios: 'TikTokSans-Regular', android: 'TikTokSans-Regular', default: 'System' }),
  medium: Platform.select({ ios: 'TikTokSans-Medium', android: 'TikTokSans-Medium', default: 'System' }),
  semibold: Platform.select({ ios: 'TikTokSans-SemiBold', android: 'TikTokSans-SemiBold', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

/**
 * CLAUDE.md, project rule: Glimpse never uses a weight above 600 (semibold).
 * Nothing in this file may introduce 700/800/900.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/**
 * Type scale transcribed from the mock. Names follow where each size is used so
 * screens read declaratively instead of repeating magic numbers.
 */
export const type = {
  /** 42px — "Sign up" hero */
  displayXl: { fontSize: 42, lineHeight: 42 * 1.04, letterSpacing: -1.7, fontWeight: fontWeight.semibold },
  /** 38px — Welcome / paywall hero */
  displayLg: { fontSize: 38, lineHeight: 38 * 1.06, letterSpacing: -1.4, fontWeight: fontWeight.semibold },
  /** 37px — most onboarding headlines */
  display: { fontSize: 37, lineHeight: 37 * 1.06, letterSpacing: -1.4, fontWeight: fontWeight.semibold },
  /** 35px — two-line onboarding headline */
  displaySm: { fontSize: 35, lineHeight: 35 * 1.06, letterSpacing: -1.4, fontWeight: fontWeight.semibold },
  /** 34px — feed greeting */
  headline: { fontSize: 34, lineHeight: 34 * 1.06, letterSpacing: -1.2, fontWeight: fontWeight.semibold },
  /** 33px — name step (looser leading, inline chips) */
  headlineChips: { fontSize: 33, lineHeight: 33 * 1.62, letterSpacing: -1.1, fontWeight: fontWeight.semibold },
  /** 32px — invite deeplink */
  headlineSm: { fontSize: 32, lineHeight: 32 * 1.08, letterSpacing: -1.2, fontWeight: fontWeight.semibold },
  /** 31px — profile name */
  title: { fontSize: 31, letterSpacing: -1, fontWeight: fontWeight.semibold },
  /** 27px — screen title (Friends, Chats) */
  screenTitle: { fontSize: 27, letterSpacing: -0.8, fontWeight: fontWeight.semibold },
  /** 24px — section heading */
  section: { fontSize: 24, letterSpacing: -0.65, fontWeight: fontWeight.semibold },
  /** 23px — sheet title */
  sheetTitle: { fontSize: 23, letterSpacing: -0.6, fontWeight: fontWeight.semibold },
  /** 21px / 20px / 19px — primary button labels by size */
  buttonXl: { fontSize: 21, fontWeight: fontWeight.semibold },
  buttonLg: { fontSize: 20, fontWeight: fontWeight.semibold },
  button: { fontSize: 19, fontWeight: fontWeight.semibold },
  buttonSm: { fontSize: 17, fontWeight: fontWeight.semibold },
  /** 20px — card name, blurred-moment title */
  cardTitleLg: { fontSize: 20, letterSpacing: -0.35, fontWeight: fontWeight.semibold },
  /** 18px — moment card title */
  cardTitle: { fontSize: 18, letterSpacing: -0.3, fontWeight: fontWeight.semibold },
  /** 17px — list row title, nav title */
  rowTitle: { fontSize: 17, letterSpacing: -0.2, fontWeight: fontWeight.semibold },
  /** 16.5px — list row title (friends/recipients) */
  rowTitleSm: { fontSize: 16.5, letterSpacing: -0.2, fontWeight: fontWeight.semibold },
  /** 19px — body on dark, moment caption */
  bodyLg: { fontSize: 19, lineHeight: 19 * 1.36, fontWeight: fontWeight.regular },
  /** 18px — welcome subcopy */
  bodyMd: { fontSize: 18, lineHeight: 18 * 1.42, fontWeight: fontWeight.regular },
  /** 17px — list value, benefit row */
  body: { fontSize: 17, lineHeight: 17 * 1.4, fontWeight: fontWeight.regular },
  /** 15.5px — default paragraph */
  bodySm: { fontSize: 15.5, lineHeight: 15.5 * 1.45, fontWeight: fontWeight.regular },
  /** 15px — chat bubble, caption */
  bodyXs: { fontSize: 15, lineHeight: 15 * 1.4, fontWeight: fontWeight.regular },
  /** 14.5px — subtitle */
  subtitle: { fontSize: 14.5, fontWeight: fontWeight.regular },
  /** 14px — secondary meta */
  meta: { fontSize: 14, fontWeight: fontWeight.regular },
  /** 13.5px / 13px — tertiary meta */
  metaSm: { fontSize: 13.5, fontWeight: fontWeight.regular },
  metaXs: { fontSize: 13, fontWeight: fontWeight.regular },
  /** 12.5px — timestamps, badges */
  caption: { fontSize: 12.5, fontWeight: fontWeight.regular },
  /** 11.5px — share-row labels */
  captionXs: { fontSize: 11.5, fontWeight: fontWeight.regular },
  /** 12.5px uppercase tracked — section eyebrow */
  eyebrow: {
    fontSize: 12.5,
    letterSpacing: 12.5 * 0.14,
    textTransform: 'uppercase',
    fontWeight: fontWeight.semibold,
  },
  /** 13px tracked — paywall eyebrow */
  eyebrowAccent: { fontSize: 13, letterSpacing: 13 * 0.06, fontWeight: fontWeight.semibold },
} as const satisfies Record<string, TextStyle>;

export type TypeToken = keyof typeof type;
