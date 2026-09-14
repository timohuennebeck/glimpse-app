import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { FontWeight, type as typeScale, TypeToken } from '@/shared/theme/fonts';
export interface TextProps extends RNTextProps {
  /** Token from the type scale in `src/shared/theme/fonts.ts`. */
  variant?: TypeToken;
  /** Override the token's weight. Picks a family; there is nothing above semibold. */
  weight?: FontWeight;
  className?: string;
}

// Literal class names, because Tailwind's scanner cannot see a template string.
const SIZE: Record<TypeToken, string> = {
  displayXl: 'text-display-xl',
  displayLg: 'text-display-lg',
  display: 'text-display',
  displaySm: 'text-display-sm',
  headline: 'text-headline',
  headlineChips: 'text-headline-chips',
  headlineSm: 'text-headline-sm',
  title: 'text-title',
  screenTitle: 'text-screen-title',
  section: 'text-section',
  sheetTitle: 'text-sheet-title',
  buttonXl: 'text-button-xl',
  button: 'text-button',
  buttonSm: 'text-button-sm',
  cardTitleLg: 'text-card-title-lg',
  cardTitle: 'text-card-title',
  rowTitle: 'text-row-title',
  rowTitleSm: 'text-row-title-sm',
  bodyLg: 'text-body-lg',
  bodyMd: 'text-body-md',
  body: 'text-body',
  bodySm: 'text-body-sm',
  bodyXs: 'text-body-xs',
  subtitle: 'text-subtitle',
  meta: 'text-meta',
  metaSm: 'text-meta-sm',
  metaXs: 'text-meta-xs',
  caption: 'text-caption',
  captionXs: 'text-caption-xs',
  eyebrow: 'text-eyebrow uppercase',
  eyebrowAccent: 'text-eyebrow-accent',
};

const FAMILY: Record<FontWeight, string> = {
  regular: 'font-sans',
  medium: 'font-sans-medium',
  semibold: 'font-sans-semibold',
};

/**
 * Every piece of copy in the app goes through here, so the TikTok Sans family
 * is chosen in exactly one place. Colour and alignment come from `className`
 * (`text-ink`, `text-center`); the default is the body ink.
 */
export function Text({ variant = 'body', weight, className, ...rest }: TextProps) {
  const family = FAMILY[weight ?? typeScale[variant].weight];
  return <RNText {...rest} className={cn('text-ink-body', SIZE[variant], family, className)} />;
}
