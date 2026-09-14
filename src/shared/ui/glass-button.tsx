import { ReactNode } from 'react';
import { AccessibilityState, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { cn } from '@/shared/lib/cn';
import { alpha } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
interface GlassButtonProps {
  size?: number;
  onPress?: () => void;
  children: ReactNode;
  /** Frosted-on-photo variant used by the camera and moment viewer. */
  onDark?: boolean;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
}

/**
 * The recurring circular control from the mock.
 *
 * On iOS 26+ this renders the system's real Liquid Glass material via
 * `GlassView`, which refracts and specularly highlights the content behind it —
 * something a blur plus a gradient cannot imitate.
 *
 * Everywhere else (older iOS, Android, web) it falls back to the hand-built
 * approximation of the mock's CSS:
 *   background: linear-gradient(145deg, rgba(255,255,255,.75), rgba(238,231,255,.45))
 *   backdrop-filter: blur(14px) saturate(180%)
 *   border: 1px solid rgba(255,255,255,.75)
 *   box-shadow: 0 4px 12px rgba(76,40,120,.13), inset highlights
 */
export function GlassButton({
  size = 44,
  onPress,
  children,
  onDark = false,
  accessibilityLabel,
  accessibilityState,
}: GlassButtonProps) {
  const native = isLiquidGlassAvailable();
  // The diameter is a prop, so the frame stays a style; everything else is a class.
  const frame = { width: size, height: size, borderRadius: size / 2 };
  const content = <View className="absolute inset-0 items-center justify-center">{children}</View>;
  // Glass refracts what is behind it, so over a flat white screen the system
  // material has nothing to work with and all but disappears; a hairline gives
  // it an edge without fighting it. The fallback always draws its own ring.
  const edge = native
    ? onDark
      ? null
      : 'border-hairline border-[#4C287829]'
    : onDark
      ? 'border border-on-dark-border'
      : 'border border-glass-border';

  return (
    <Pressable
      onPress={onPress}
      // A control with no handler must not announce itself as a live button.
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !onPress, ...accessibilityState }}
      hitSlop={8}
      className="active:opacity-[0.72]"
      // The system material carries its own shadow; ours would double it.
      style={[frame, !onDark && shadow.glass]}
    >
      {native ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={onDark ? 'dark' : 'light'}
          isInteractive
          style={{ flex: 1, overflow: 'hidden', borderRadius: frame.borderRadius }}
        >
          {content}
        </GlassView>
      ) : (
        <View className="flex-1 overflow-hidden" style={{ borderRadius: frame.borderRadius }}>
          <BlurView
            intensity={onDark ? 30 : 24}
            tint={onDark ? 'dark' : 'light'}
            className="absolute inset-0"
          />
          {onDark ? (
            <View className="absolute inset-0 bg-on-dark-fill" />
          ) : (
            <LinearGradient
              colors={[alpha.glassTop, alpha.glassBottom]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              className="absolute inset-0"
            />
          )}
          {/* Stands in for the two inset highlights RN cannot express. */}
          <View
            className="absolute inset-0 border-b-[1.5px] border-t-[1.5px] border-b-[#8B5CF624] border-t-[#FFFFFFF2]"
            style={{ borderRadius: frame.borderRadius }}
          />
          {content}
        </View>
      )}
      {edge ? (
        <View
          className={cn('absolute inset-0', edge)}
          style={{ borderRadius: frame.borderRadius }}
          pointerEvents="none"
        />
      ) : null}
    </Pressable>
  );
}
