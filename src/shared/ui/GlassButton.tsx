import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
 * The recurring circular control from the mock:
 *   background: linear-gradient(145deg, rgba(255,255,255,.75), rgba(238,231,255,.45))
 *   backdrop-filter: blur(14px) saturate(180%)
 *   border: 1px solid rgba(255,255,255,.75)
 *   box-shadow: 0 4px 12px rgba(76,40,120,.13),
 *               inset 0 1px 1.5px rgba(255,255,255,.95),
 *               inset 0 -1.5px 2px rgba(139,92,246,.14)
 *
 * React Native has no inset shadow, so the two inner highlights are approximated
 * with a hairline top/bottom overlay inside the circle.
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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: radius, opacity: pressed ? 0.72 : 1 },
        !onDark && shadow.glass,
        style,
      ]}
    >
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
        {/* Inner highlight along the top edge (inset 0 1px 1.5px rgba(255,255,255,.95)). */}
        <View style={[styles.innerTop, { borderRadius: radius }]} />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: { flex: 1, overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  innerTop: {
    ...StyleSheet.absoluteFill,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,.95)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(139,92,246,.14)',
  },
  ring: { borderWidth: 1 },
});
