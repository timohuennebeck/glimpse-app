import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { TypeToken } from '@/shared/theme/fonts';
import { shadow } from '@/shared/theme/page-structure';
type Variant = 'primary' | 'purple' | 'outline' | 'ghost';
type Size = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

interface SizeSpec {
  className: string;
  variant: TypeToken;
}

const SIZE: Record<Size, SizeSpec> = {
  xl: { className: 'h-xl', variant: 'buttonXl' },
  lg: { className: 'h-lg', variant: 'button' },
  md: { className: 'h-md', variant: 'button' },
  sm: { className: 'h-sm', variant: 'buttonSm' },
  xs: { className: 'h-xs', variant: 'buttonSm' },
};

interface Palette {
  className: string;
  textClassName: string;
  spinner: string;
}

/**
 * The mock only ever uses three fills: near-black for the primary CTA, purple
 * for in-card actions, and a hairline outline.
 */
const PALETTE: Record<Variant, Palette> = {
  primary: { className: 'bg-ink', textClassName: 'text-white', spinner: colors.white },
  purple: { className: 'bg-purple', textClassName: 'text-white', spinner: colors.white },
  outline: {
    className: 'bg-white border-[1.6px] border-border',
    textClassName: 'text-ink-body',
    spinner: colors.inkBody,
  },
  ghost: { className: 'bg-transparent', textClassName: 'text-ink-soft', spinner: colors.inkSoft },
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
  className?: string;
}

/** Pill button. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const palette = PALETTE[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      className={cn(
        // `self-stretch` fills the parent even when it centres its children;
        // without it the button shrink-wraps its label.
        'flex-row items-center justify-center gap-3 self-stretch rounded-pill',
        SIZE[size].className,
        palette.className,
        // The mock renders the disabled CTA at 35% opacity (screen 10a).
        inactive ? 'opacity-35' : 'active:opacity-[0.88]',
        className,
      )}
      // Shadows stay as a style: RN's shadow props have no CSS equivalent NativeWind maps.
      style={variant === 'purple' ? shadow.cta : undefined}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinner} />
      ) : (
        <>
          {icon ? <View className="items-center justify-center">{icon}</View> : null}
          <Text variant={SIZE[size].variant} className={palette.textClassName}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
