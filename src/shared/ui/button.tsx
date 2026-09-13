import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { controlHeight, radius, shadow } from '@/shared/theme/page-structure';
type Variant = 'primary' | 'purple' | 'outline' | 'ghost' | 'muted';
type Size = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

const sizeMap: Record<Size, { height: number; variant: 'buttonXl' | 'buttonLg' | 'button' | 'buttonSm' }> = {
  xl: { height: controlHeight.xl, variant: 'buttonXl' },
  lg: { height: controlHeight.lg, variant: 'button' },
  md: { height: controlHeight.md, variant: 'button' },
  sm: { height: controlHeight.sm, variant: 'buttonSm' },
  xs: { height: controlHeight.xs, variant: 'buttonSm' },
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  /** Leading icon, rendered at the label's left with the mock's 12px gap. */
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * Pill button. The mock only ever uses three fills: near-black (#0B0B0E) for the
 * primary CTA, purple (#8B5CF6) for in-card actions, and a hairline outline.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { height, variant: textVariant } = sizeMap[size];
  const palette = paletteFor(variant);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderWidth: palette.border ? 1.6 : 0,
          // The mock renders the disabled CTA at 35% opacity (screen 10a).
          opacity: inactive ? 0.35 : pressed ? 0.88 : 1,
        },
        variant === 'purple' && shadow.cta,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text variant={textVariant} color={palette.text}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function paletteFor(variant: Variant): { background: string; text: string; border?: string } {
  switch (variant) {
    case 'purple':
      return { background: colors.purple, text: colors.white };
    case 'outline':
      return { background: colors.white, text: colors.inkBody, border: colors.border };
    case 'ghost':
      return { background: 'transparent', text: colors.inkSoft };
    case 'muted':
      return { background: colors.surfaceChipCool, text: '#6F6A80' };
    case 'primary':
    default:
      return { background: colors.ink, text: colors.white };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    // Fill the parent even when it centres its children (several footers use
    // alignItems:'center' to centre the text links beneath the CTA). Without
    // this the button shrink-wraps its label.
    alignSelf: 'stretch',
  },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
