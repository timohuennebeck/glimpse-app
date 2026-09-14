// The design tokens live in TypeScript under src/shared/theme and are the single
// source of truth. This file only projects them into Tailwind utilities, loading
// the .ts modules through jiti (which Tailwind itself ships).
const jiti = require('jiti')(__filename);
const { colors, alpha } = jiti('./src/shared/theme/colors.ts');
const { spacing, radius, controlHeight } = jiti('./src/shared/theme/page-structure.ts');
const { type, fontFamily } = jiti('./src/shared/theme/fonts.ts');

/** `purpleDeep` → `purple-deep`, so utilities read as Tailwind users expect. */
const kebab = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const mapKeys = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [kebab(k), fn(v)]));
const px = (n) => `${n}px`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind on web complains when the scheme is media-driven; the app is light-only anyway.
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ...mapKeys(colors, (v) => v),
        // Translucent fills for frosted controls: `bg-on-dark-fill`, `text-on-dark-text`.
        ...mapKeys(alpha, (v) => v),
      },
      fontFamily: {
        sans: [fontFamily.regular],
        'sans-medium': [fontFamily.medium],
        'sans-semibold': [fontFamily.semibold],
        mono: ['Menlo', 'monospace'],
        'mono-android': ['monospace'],
      },
      // Each type token becomes `text-<token>` carrying size, leading and tracking.
      fontSize: mapKeys(type, (spec) => [
        px(spec.fontSize),
        {
          ...(spec.lineHeight !== undefined ? { lineHeight: px(spec.lineHeight) } : {}),
          ...(spec.letterSpacing !== undefined ? { letterSpacing: px(spec.letterSpacing) } : {}),
        },
      ]),
      borderRadius: mapKeys(radius, px),
      spacing: mapKeys(spacing, px),
      height: mapKeys(controlHeight, px),
      minHeight: mapKeys(controlHeight, px),
    },
  },
  plugins: [],
};
