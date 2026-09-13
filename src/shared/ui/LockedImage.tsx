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
   * Blur strength, from `BLUR`. The mock's CSS radii do not translate directly —
   * expo-image's blurRadius is far weaker at the same number, which left faces
   * clearly recognisable through a "locked" photo.
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
/**
 * Blur strengths per surface. Tuned so the subject is unreadable rather than
 * merely softened: a locked moment should give away nothing but colour.
 *
 * Presentation only — the real guarantee is that the server serves a separately
 * stored, pre-blurred rendition and never signs the original until the trade
 * opens. See docs/database.md §3.
 */
export const BLUR = {
  /** Small tiles in the profile pair grid. */
  tile: 16,
  /** The feed's trade card. */
  card: 32,
  /** Full-screen moment viewer. */
  full: 60,
} as const;

export function LockedImage({
  source,
  radius = 18,
  blur = BLUR.card,
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
