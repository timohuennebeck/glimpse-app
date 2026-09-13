import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme/colors';
import { fontFamily, type as typeScale, TypeToken } from '@/shared/theme/fonts';
export interface TextProps extends RNTextProps {
  /** Token from the type scale in `src/shared/theme/fonts.ts`. */
  variant?: TypeToken;
  color?: string;
  center?: boolean;
}

/**
 * Every piece of copy in the app goes through here so the TikTok Sans family and
 * the "never above 600" weight rule are applied in exactly one place.
 */
export function Text({ variant = 'body', color = colors.inkBody, center, style, ...rest }: TextProps) {
  const token = typeScale[variant];

  // Resolve the family from the EFFECTIVE weight, override included.
  // expo-google-fonts registers each weight as its own family, so a bare
  // `style={{ fontWeight: '600' }}` on a regular token did nothing on iOS and
  // fake-bolded on Android. Reading the flattened style makes every existing
  // override render the real semibold face.
  const weight = String(StyleSheet.flatten([token, style])?.fontWeight ?? '400');
  if (__DEV__ && !['400', '500', '600'].includes(weight)) {
    console.warn(`Text: fontWeight ${weight} is above the 600 cap; rendering as 600.`);
  }
  const family =
    weight === '400' ? fontFamily.regular : weight === '500' ? fontFamily.medium : fontFamily.semibold;

  return (
    <RNText
      {...rest}
      // The family goes last so it wins over any fontFamily in `style`.
      style={StyleSheet.flatten([token, { color }, center && styles.center, style, { fontFamily: family }])}
    />
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
