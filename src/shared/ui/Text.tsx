import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, fontFamily, type as typeScale, TypeToken } from '@/shared/theme';

export type TextProps = RNTextProps & {
  /** Token from the type scale in `src/shared/theme/typography.ts`. */
  variant?: TypeToken;
  color?: string;
  center?: boolean;
};

/**
 * Every piece of copy in the app goes through here so the TikTok Sans family and
 * the "never above 600" weight rule are applied in exactly one place.
 */
export function Text({ variant = 'body', color = colors.inkBody, center, style, ...rest }: TextProps) {
  const token = typeScale[variant];
  // Widened to string: the token map is `as const`, so TS would otherwise
  // narrow each comparison against a single literal weight.
  const weight: string = token.fontWeight ?? '400';
  const family =
    weight === '600' ? fontFamily.semibold : weight === '500' ? fontFamily.medium : fontFamily.regular;

  return (
    <RNText
      {...rest}
      style={StyleSheet.flatten([token, { fontFamily: family, color }, center && styles.center, style])}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
