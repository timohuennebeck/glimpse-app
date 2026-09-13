/**
 * Colour tokens lifted verbatim from the original Claude Design mock.
 * Names describe role, not hue, so a future dark mode can remap them in one place.
 */
export const colors = {
  // Brand purple ramp
  purple: '#8B5CF6',
  purpleDeep: '#7C3AED',
  purpleInk: '#6D3FD4',
  purpleInkAlt: '#6D34E0',
  purpleMuted: '#5B3FA8',
  purpleSoft: '#B692F6',
  purpleHalo: '#DCD0F7',

  // Text
  ink: '#0B0B0E',
  inkStrong: '#101014',
  inkBody: '#16151A',
  inkSoft: '#26242B',
  inkFaint: '#3B3944',

  // Secondary text
  muted: '#706B86',
  /** Text on grey chips and muted pills. */
  mutedChip: '#6F6A80',
  mutedViolet: '#7C73A0',
  mutedGrey: '#8E8B96',
  mutedLilac: '#8F88A6',
  mutedCool: '#9B94A8',
  placeholder: '#B4AEC2',
  placeholderSoft: '#9A92B4',

  // Surfaces
  white: '#FFFFFF',
  surface: '#FCFBFE',
  surfaceAlt: '#FDFCFE',
  surfaceLilac: '#F5F2FB',
  surfaceLilacAlt: '#F5F2FA',
  surfaceViolet: '#F3EFFB',
  surfaceVioletDeep: '#F1EAFE',
  surfaceVioletTint: '#F8F4FF',
  surfaceVioletChip: '#EDE5FD',
  surfaceVioletWarm: '#F7F4FD',
  surfaceChipCool: '#F3F0F9',

  // Borders / hairlines
  border: '#E2DEE8',
  borderSoft: '#E6E0F2',
  borderLilac: '#EDE7F7',
  borderLilacAlt: '#EDE9F4',
  borderFaint: '#F0ECF6',
  borderDashed: '#CFC6E4',
  borderStrong: '#DCD4EA',
  borderInput: '#E4DEF0',
  borderChip: '#EDE7F9',

  // Dark screens (camera, moment viewer, widget preview)
  black: '#0B0B0E',
  blackDeep: '#08080B',
  widgetTop: '#241B36',
  widgetMid: '#100D1B',
  widgetBottom: '#07060C',
  widgetCard: '#17122A',

  // Misc accents
  avatarRingIdle: '#E6E0F2',
  swatchGrey: '#C9C3D6',
  dashedIdle: '#B0A7C4',
  notificationTint: '#EBE1FB',
  notificationChip: '#E6DBFA',
  dotIdle: '#D9CFF0',
  dotIdleSoft: '#DDD6EA',
} as const;

/** Translucent fills used by the frosted-glass controls. */
export const alpha = {
  glassTop: 'rgba(255,255,255,.75)',
  glassBottom: 'rgba(238,231,255,.45)',
  glassBorder: 'rgba(255,255,255,.75)',
  onDarkFill: 'rgba(255,255,255,.16)',
  onDarkBorder: 'rgba(255,255,255,.26)',
  onDarkText: 'rgba(255,255,255,.85)',
  onDarkTextSoft: 'rgba(255,255,255,.72)',
  onDarkTextFaint: 'rgba(255,255,255,.6)',
  lockScrim: 'rgba(255,255,255,.26)',
  lockBorder: 'rgba(255,255,255,.34)',
} as const;
