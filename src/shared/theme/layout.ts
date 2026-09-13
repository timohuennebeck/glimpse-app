/**
 * The mock draws every screen at a fixed 390x940 artboard. On device we use the
 * real safe-area insets instead, but the *relative* spacing below is transcribed
 * from that artboard so proportions survive the translation.
 */
export const ARTBOARD = { width: 390, height: 940 } as const;

export const spacing = {
  /** Horizontal gutter used by nearly every screen (`padding: 72px 20px 0`). */
  gutter: 20,
  /** Profile + sign-up screens use slightly different gutters. */
  gutterTight: 18,
  gutterWide: 22,
  /** Distance from the top of the artboard to the first content row. */
  contentTop: 72,
  /** Bottom padding above the home indicator on scrollable screens. */
  contentBottom: 40,
} as const;

export const radius = {
  pill: 999,
  xl: 28,
  lg: 26,
  card: 24,
  cardSm: 22,
  input: 20,
  thumb: 19,
  thumbSm: 18,
  chip: 16,
  tile: 12,
  sm: 8,
} as const;

export const controlHeight = {
  /** Primary CTA heights seen across the mock. */
  xl: 66,
  lg: 62,
  md: 58,
  sm: 56,
  xs: 52,
  /** Search + filter fields. */
  field: 54,
  fieldSm: 48,
  fieldXs: 44,
} as const;

export const avatarSize = {
  xl: 104,
  lg: 76,
  ring: 74,
  md: 64,
  row: 52,
  rowSm: 46,
  ringSm: 58,
  chip: 40,
  bubble: 30,
} as const;

/** Shadow presets, matched to the `box-shadow` values in the mock. */
export const shadow = {
  /** Frosted circular control. */
  glass: {
    shadowColor: '#4C2878',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** Raised card (`0 8px 22px rgba(76,40,120,.07)`). */
  card: {
    shadowColor: '#4C2878',
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  /** Notification preview card. */
  raised: {
    shadowColor: '#50288C',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** Purple CTA glow (`0 12px 28px rgba(139,92,246,.34)`). */
  cta: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;
