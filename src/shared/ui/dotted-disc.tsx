import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Pattern } from 'react-native-svg';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
/**
 * The mock's empty avatar: a purple disc carrying a fine dot pattern.
 *   background-image: radial-gradient(rgba(255,255,255,.55) 1.6px, transparent 1.7px)
 *   background-size: 13px 13px
 * React Native has no background-image, so it is drawn as an SVG pattern.
 *
 * Two callers: the avatar step's picker at 164px, and every avatar of someone
 * who has not set a photo, down to 30px in a chat bubble — hence the insets
 * and the dot grid being fractions of the size rather than the mock's literal
 * pixel values.
 */
interface DottedDiscProps {
  size: number;
  /** Centred initial, drawn when this stands in for a person. */
  letter?: string;
  /** The ring between the dots and the outline: the colour behind the disc. */
  gapColor?: string;
}

export function DottedDisc({ size, letter, gapColor = colors.surfaceVioletDeep }: DottedDiscProps) {
  // Pattern ids are document-global on web, and a story rail draws a dozen of
  // these at once.
  const patternId = `dots-${useId()}`;
  const r = size / 2;
  // 13px and 1.6px at the mock's 164px, in proportion everywhere else.
  const grid = Math.max(6, Math.round(size * 0.079));
  const dot = grid * 0.123;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} className="absolute">
        <Defs>
          <Pattern id={patternId} width={grid} height={grid} patternUnits="userSpaceOnUse">
            <Circle cx={grid / 2} cy={grid / 2} r={dot} fill="rgba(255,255,255,.55)" />
          </Pattern>
        </Defs>
        {/* Disc fill, then the dots on top of it. Radii are inset so the
            outermost stroke sits inside the viewport instead of being clipped. */}
        <Circle cx={r} cy={r} r={r * 0.902} fill={colors.purple} />
        <Circle cx={r} cy={r} r={r * 0.902} fill={`url(#${patternId})`} />
        {/* The mock's gap ring in the surface colour, then the purple outline. */}
        <Circle cx={r} cy={r} r={r * 0.927} stroke={gapColor} strokeWidth={r * 0.049} fill="none" />
        <Circle cx={r} cy={r} r={r * 0.966} stroke={colors.purple} strokeWidth={r * 0.0305} fill="none" />
      </Svg>
      {letter ? (
        <Text
          variant="rowTitle"
          weight="semibold"
          className="text-white"
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {letter}
        </Text>
      ) : null}
    </View>
  );
}
