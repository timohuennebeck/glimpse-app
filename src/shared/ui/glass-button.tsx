import { ReactNode } from 'react';
import { AccessibilityState, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
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
  const radius = size / 2;
  const native = isLiquidGlassAvailable();
  const content = <View style={styles.center}>{children}</View>;
  // Glass refracts what is behind it, so over a flat white screen the system
  // material has nothing to work with and all but disappears; a hairline gives
  // it an edge without fighting it. The fallback always draws its own ring.
  const edge = native
    ? onDark
      ? null
      : styles.lightEdge
    : { borderWidth: 1, borderColor: onDark ? alpha.onDarkBorder : alpha.glassBorder };

  return (
    <Pressable
      onPress={onPress}
      // A control with no handler must not announce itself as a live button.
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !onPress, ...accessibilityState }}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: radius, opacity: pressed ? 0.72 : 1 },
        // The system material carries its own shadow; ours would double it.
        !onDark && shadow.glass,
      ]}
    >
      {native ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={onDark ? 'dark' : 'light'}
          isInteractive
          style={[styles.clip, { borderRadius: radius }]}
        >
          {content}
        </GlassView>
      ) : (
        <View style={[styles.clip, { borderRadius: radius }]}>
          <BlurView
            intensity={onDark ? 30 : 24}
            tint={onDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          {onDark ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha.onDarkFill }]} />
          ) : (
            <LinearGradient
              colors={[alpha.glassTop, alpha.glassBottom]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Stands in for the two inset highlights RN cannot express. */}
          <View style={[styles.innerEdges, { borderRadius: radius }]} />
          {content}
        </View>
      )}
      {edge ? (
        <View style={[StyleSheet.absoluteFill, edge, { borderRadius: radius }]} pointerEvents="none" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  innerEdges: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(139,92,246,.14)',
  },
  lightEdge: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(76,40,120,.16)' },
});
