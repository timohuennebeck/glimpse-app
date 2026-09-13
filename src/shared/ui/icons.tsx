import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg';
import { colors } from '@/shared/theme';

/**
 * Icons transcribed path-for-path from the inline SVGs in
 * `project/Glimpse App Screens.dc.html` so stroke weights and proportions match
 * the mock exactly rather than approximating with an icon font.
 */
export type IconProps = { size?: number; color?: string };

export function CameraIcon({ size = 21, color = colors.white, lensColor = colors.ink }: IconProps & { lensColor?: string }) {
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

export function CloseIcon({ size = 12, color = colors.inkFaint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 19, color = '#1b1b1f', strokeWidth = 1.9 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 2.6v10.8M2.6 8h10.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 13, color = colors.white, strokeWidth = 2.2 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={(size * 11) / 14} viewBox="0 0 14 11" fill="none">
      <Path d="M1.5 5.6l3.6 3.6L12.5 1.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
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

export function SearchIcon({ size = 19, color = colors.mutedViolet, strokeWidth = 2 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="8.8" cy="8.8" r="6" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M13.2 13.2L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 19, color = colors.inkFaint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="5" cy="12" r="1.9" fill={color} />
      <Circle cx="12" cy="12" r="1.9" fill={color} />
      <Circle cx="19" cy="12" r="1.9" fill={color} />
    </Svg>
  );
}

/** Mixer / filter glyph used beside "Deine Momente". */
export function FilterIcon({ size = 20, color = colors.inkFaint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7h14M20 7h1M3 12h4M10 12h11M3 17h10M16 17h5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Circle cx="18.5" cy="7" r="2.1" stroke={color} strokeWidth={1.9} />
      <Circle cx="8.5" cy="12" r="2.1" stroke={color} strokeWidth={1.9} />
      <Circle cx="14.5" cy="17" r="2.1" stroke={color} strokeWidth={1.9} />
    </Svg>
  );
}

export function FlipCameraIcon({ size = 22, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 2v11M7 13l-4-4M17 22V11M17 11l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FlashIcon({ size = 22, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function RetakeIcon({ size = 17, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M3 10a7 7 0 1 1 2.3 5.2" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 5.6V10h4.4" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 15, color = 'rgba(255,255,255,.82)' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13.6 3.4l3 3L7.4 15.6 3.6 16.4l.8-3.8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <Path d="M5.4 9.3l2.5 2.4 5.1-5.1" stroke={colors.white} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon({ size = 16, color = colors.purple }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2.4l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" fill={color} />
    </Svg>
  );
}

export function ClockIcon({ size = 14, color = colors.placeholderSoft }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Path d="M12 7.5V12l3 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function LinkIcon({ size = 16, color = colors.mutedLilac }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function QrIcon({ size = 22, color = colors.inkFaint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.8" stroke={color} strokeWidth={2} />
      <Rect x="14" y="3" width="7" height="7" rx="1.8" stroke={color} strokeWidth={2} />
      <Rect x="3" y="14" width="7" height="7" rx="1.8" stroke={color} strokeWidth={2} />
      <Path d="M14 14h3.5v3.5M21 17.5V21h-3.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CopyIcon({ size = 22, color = colors.inkFaint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="12" height="12" rx="2.5" stroke={color} strokeWidth={2} />
      <Path
        d="M5 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3h9A1.5 1.5 0 0115 4.5V5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MailIcon({ size = 26, color = colors.white, strokeWidth = 1.9 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={(size * 20) / 26} viewBox="0 0 26 20" fill="none">
      <Rect x="1" y="1" width="24" height="18" rx="3.5" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M2 3l11 8 11-8" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function GoogleIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21.6 12.2c0-.7-.06-1.35-.18-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.75 3-4.3 3-7.3z" fill="#4285F4" />
      <Path d="M12 22c2.7 0 4.96-.9 6.6-2.45l-3.2-2.5c-.9.6-2.05.95-3.4.95-2.6 0-4.8-1.75-5.6-4.1H3.1v2.6A10 10 0 0012 22z" fill="#34A853" />
      <Path d="M6.4 13.9a6 6 0 010-3.8V7.5H3.1a10 10 0 000 9l3.3-2.6z" fill="#FBBC05" />
      <Path d="M12 5.95c1.47 0 2.8.5 3.84 1.5l2.85-2.85C16.95 2.99 14.7 2 12 2a10 10 0 00-8.9 5.5l3.3 2.6C7.2 7.7 9.4 5.95 12 5.95z" fill="#EA4335" />
    </Svg>
  );
}

export function EyeIcon({ size = 21, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.2 12c2.4-4.3 5.7-6.4 8.8-6.4s6.4 2.1 8.8 6.4c-2.4 4.3-5.7 6.4-8.8 6.4S5.6 16.3 3.2 12z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="2.5" fill={color} />
    </Svg>
  );
}

export function EnvelopeFieldIcon({ size = 21, color = colors.purple }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.2" y="5.2" width="17.6" height="13.6" rx="3.6" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path
        d="M6.6 9.4l4.05 3.04a2.25 2.25 0 0 0 2.7 0L17.4 9.4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SendIcon({ size = 17, color = colors.white }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M10 16V4M4 10l6-6 6 6" stroke={color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PaperclipIcon({ size = 19, color = colors.inkBody }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 11.6l-8.7 8.7a5.4 5.4 0 01-7.6-7.6l8.1-8.1a3.6 3.6 0 015.1 5.1l-8.1 8.1a1.8 1.8 0 01-2.6-2.6l7.6-7.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
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
      <Path d="M46 66 Q10 50 18 6" fill="none" stroke={colors.purpleSoft} strokeWidth={2.4} strokeLinecap="round" />
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
