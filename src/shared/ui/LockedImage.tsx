import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha } from '@/shared/theme';
import { LockedIcon } from './icons';

type LockedImageProps = {
  source: ImageSource | string | number;
  /** Corner radius; the mock varies this by context (12 / 16 / 18 / 26). */
  radius?: number;
  /**
   * Blur strength. The mock uses different CSS blur radii per surface:
   * 3.5px in the small profile grid, 7-8px on cards, 26px on the full viewer.
   * expo-image takes a 0-100 scale, so these are mapped rather than copied.
   */
  blur?: number;
  /** Size of the frosted lock puck. `0` hides it. */
  puckSize?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * A moment you have received but not yet traded for: the photo is rendered
 * frosted with a darkening scrim and a lock puck.
 *
 * NOTE: this is presentation only. The blur here must never be the sole thing
 * keeping a locked photo private — the server hands out a separately stored,
 * pre-blurred rendition and only signs a URL for the original once the trade
 * unlocks. See `supabase/migrations` and `docs/database.md`.
 */
export function LockedImage({
  source,
  radius = 18,
  blur = 8,
  puckSize = 56,
  style,
  children,
}: LockedImageProps) {
  const img = typeof source === 'string' ? { uri: source } : source;

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, styles.container, style]}>
      <Image
        source={img}
        style={[StyleSheet.absoluteFill, styles.scaled]}
        contentFit="cover"
        blurRadius={blur}
      />
      <LinearGradient
        colors={['rgba(0,0,0,.1)', 'rgba(0,0,0,.26)']}
        style={StyleSheet.absoluteFill}
      />
      {/* inset 0 0 0 1px rgba(255,255,255,.18) */}
      <View
        style={[StyleSheet.absoluteFill, styles.hairline, { borderRadius: radius }]}
        pointerEvents="none"
      />
      {puckSize > 0 ? (
        <View
          style={[
            styles.puck,
            { width: puckSize, height: puckSize, borderRadius: puckSize / 2 },
          ]}
        >
          <LockedIcon size={puckSize * 0.39} />
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  // The mock scales the blurred image 1.08x so the blur never reveals the edge.
  scaled: { transform: [{ scale: 1.08 }] },
  hairline: { borderWidth: 1, borderColor: 'rgba(255,255,255,.18)' },
  puck: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha.lockScrim,
    borderWidth: 1,
    borderColor: alpha.lockBorder,
  },
});
