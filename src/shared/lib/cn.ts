import { extendTailwindMerge } from 'tailwind-merge';
import { colors, alpha } from '@/shared/theme/colors';
import { type } from '@/shared/theme/fonts';
const kebab = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Class merging that resolves Tailwind conflicts by meaning (`text-ink` after
 * `text-ink-body` wins; `mt-2` after `mt-4` wins), which plain string
 * concatenation cannot do. Taught our custom `text-<token>` sizes and colour
 * names so it does not mistake `text-display-xl` for a colour.
 */
export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Object.keys(type).map(kebab) }],
      'text-color': [{ text: [...Object.keys(colors), ...Object.keys(alpha)].map(kebab) }],
    },
  },
});
