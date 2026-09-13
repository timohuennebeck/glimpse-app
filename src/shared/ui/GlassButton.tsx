import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { alpha, shadow } from '@/shared/theme';

type GlassButtonProps = {
  size?: number;
  onPress?: () => void;
  children: ReactNode;
  /** Frosted-on-photo variant used by the camera and moment viewer. */
  onDark?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

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
  style,
  accessibilityLabel,
}: GlassButtonProps) {
  const radius = size / 2;
  const native = isLiquidGlassAvailable();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: radius, opacity: pressed ? 0.72 : 1 },
        // The system material carries its own shadow; ours would double it.
        !onDark && !native && shadow.glass,
        style,
      ]}
    >
      {native ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={onDark ? 'dark' : 'light'}
          isInteractive
          style={[styles.fill, { borderRadius: radius }]}
        >
          <View style={styles.center}>{children}</View>
        </GlassView>
      ) : (
        <>
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
            <View style={styles.center}>{children}</View>
          </View>
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.ring,
              { borderRadius: radius, borderColor: onDark ? alpha.onDarkBorder : alpha.glassBorder },
            ]}
            pointerEvents="none"
          />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  clip: { flex: 1, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  innerEdges: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(139,92,246,.14)',
  },
  ring: { borderWidth: 1 },
});
