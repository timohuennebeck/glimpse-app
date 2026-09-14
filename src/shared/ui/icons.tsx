import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';
import { colors } from '@/shared/theme/colors';
/**
 * Brand marks only. Generic glyphs are used straight from `lucide-react-native`
 * at the call site (`<X size={12} color={colors.white} strokeWidth={2.2} />`);
 * wrapping each one in a component added a file of indirection for nothing.
 *
 * What stays hand-drawn is what no library has: the camera with its punched-out
 * lens, the two-bar lock puck, the verified rosette, the Google mark and the
 * review laurel, all transcribed from the original Claude Design mock.
 */
export interface IconProps {
  size?: number;
  color?: string;
}

export function CameraIcon({
  size = 21,
  color = colors.white,
  lensColor = colors.ink,
}: IconProps & { lensColor?: string }) {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 20 18">
      <Path
        d="M2 5.6A2.6 2.6 0 014.6 3h1.1l.9-1.4A1.5 1.5 0 017.9.9h4.2c.5 0 1 .26 1.3.7L14.3 3h1.1A2.6 2.6 0 0118 5.6v7.8A2.6 2.6 0 0115.4 16H4.6A2.6 2.6 0 012 13.4V5.6z"
        fill={color}
      />
      <Circle cx="10" cy="9.6" r="3.3" fill={lensColor} />
    </Svg>
  );
}

/** The frosted "locked" glyph — two bars, same as a pause button. */
export function LockedIcon({ size = 22, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="7.2" y="5.5" width="3.8" height="13" rx="1.9" fill={color} />
      <Rect x="13" y="5.5" width="3.8" height="13" rx="1.9" fill={color} />
    </Svg>
  );
}

/** Purple verified badge (a rosette with a tick). */
export function VerifiedIcon({ size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9.00 2.40 Q12.56 0.41 13.67 4.33 Q17.59 5.44 15.60 9.00 Q17.59 12.56 13.67 13.67 Q12.56 17.59 9.00 15.60 Q5.44 17.59 4.33 13.67 Q0.41 12.56 2.40 9.00 Q0.41 5.44 4.33 4.33 Q5.44 0.41 9.00 2.40 Z"
        fill={colors.purple}
      />
      <Path
        d="M5.4 9.3l2.5 2.4 5.1-5.1"
        stroke={colors.white}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GoogleIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21.6 12.2c0-.7-.06-1.35-.18-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.75 3-4.3 3-7.3z"
        fill="#4285F4"
      />
      <Path
        d="M12 22c2.7 0 4.96-.9 6.6-2.45l-3.2-2.5c-.9.6-2.05.95-3.4.95-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0012 22z"
        fill="#34A853"
      />
      <Path d="M6.4 13.9a6 6 0 010-3.8V7.5H3.1a10 10 0 000 9l3.3-2.6z" fill="#FBBC05" />
      <Path
        d="M12 5.95c1.47 0 2.8.5 3.84 1.5l2.85-2.85C16.95 2.99 14.7 2 12 2a10 10 0 00-8.9 5.5l3.3 2.6C7.2 7.7 9.4 5.95 12 5.95z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/** Small filled camera used as a chat-row affordance. */
export function CameraBadgeIcon({ size = 14, color = colors.purpleDeep }: IconProps) {
  return (
    <Svg width={size} height={(size * 20) / 22} viewBox="0 0 22 20">
      <Path
        d="M2 6.5A2.5 2.5 0 014.5 4h1.2l.9-1.5h7.8L15.3 4h2.2A2.5 2.5 0 0120 6.5v9A2.5 2.5 0 0117.5 18h-13A2.5 2.5 0 012 15.5v-9z"
        fill={color}
      />
      <Circle cx="11" cy="11" r="3.4" fill={colors.white} />
    </Svg>
  );
}

/** Decorative laurel branch flanking the review rating. */
export function LaurelIcon({ size = 42, flip = false }: IconProps & { flip?: boolean }) {
  /** [cx, cy, rx, ry, rotation] for each leaf, transcribed from the mock. */
  const leaves: Array<[number, number, number, number, number]> = [
    [44.1, 56.8, 7.7, 3.5, -176.7],
    [37.8, 52.6, 7.4, 3.4, -167.3],
    [29.7, 62.7, 5.5, 2.6, -111.3],
    [32.8, 47.8, 7.1, 3.2, -156.8],
    [23.0, 56.3, 5.3, 2.5, -100.8],
    [29.0, 42.3, 6.8, 3.1, -145.7],
    [17.7, 48.8, 5.1, 2.4, -89.7],
    [26.2, 36.2, 6.5, 3.0, -134.7],
    [13.9, 40.4, 4.9, 2.3, -78.7],
    [24.5, 29.2, 6.2, 2.8, -124.7],
    [11.7, 31.1, 4.6, 2.2, -68.7],
    [23.9, 21.1, 5.9, 2.7, -116.1],
    [10.9, 21.2, 4.4, 2.1, -60.1],
    [24.5, 12.1, 5.6, 2.6, -108.8],
    [11.6, 10.5, 4.2, 2.0, -52.8],
  ];
  return (
    <Svg
      width={size}
      height={(size * 72) / 60}
      viewBox="0 0 60 72"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path
        d="M46 66 Q10 50 18 6"
        fill="none"
        stroke={colors.purpleSoft}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <G fill={colors.purpleSoft}>
        {leaves.map(([cx, cy, rx, ry, rot]) => (
          <Ellipse
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            transform={`rotate(${rot} ${cx} ${cy})`}
          />
        ))}
      </G>
    </Svg>
  );
}
