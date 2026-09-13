import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Tab bar glyphs. Drawn as outline/filled pairs so the active tab reads at a
 * glance without relying on colour alone.
 */
import type { ColorValue } from 'react-native';

/** `color` is ColorValue because react-navigation hands us its own token type. */
type Props = { size?: number; color?: ColorValue; active?: boolean };

export function FeedTabIcon({ size = 24, color = '#fff', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3.5" width="18" height="13" rx="3.4" stroke={color} strokeWidth={active ? 2.4 : 1.9}
        fill={active ? color : 'none'} fillOpacity={active ? 0.18 : 0} />
      <Circle cx="8.6" cy="8.4" r="1.7" fill={color} />
      <Path d="M3.6 14.2l4.3-3.6a2 2 0 0 1 2.6 0l4.2 3.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M6.5 20h11" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function CameraTabIcon({ size = 24, color = '#fff', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8.4A2.9 2.9 0 0 1 5.9 5.5h1.3l1-1.6h7.6l1 1.6h1.3A2.9 2.9 0 0 1 21 8.4v8.2a2.9 2.9 0 0 1-2.9 2.9H5.9A2.9 2.9 0 0 1 3 16.6z"
        stroke={color}
        strokeWidth={active ? 2.2 : 1.9}
        fill={active ? color : 'none'}
        fillOpacity={active ? 0.18 : 0}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12.4" r="3.6" stroke={color} strokeWidth={1.9} fill={active ? color : 'none'} />
    </Svg>
  );
}

export function FriendsTabIcon({ size = 24, color = '#fff', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.5" stroke={color} strokeWidth={active ? 2.2 : 1.9}
        fill={active ? color : 'none'} fillOpacity={active ? 0.18 : 0} />
      <Path d="M2.8 19.4c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx="17.2" cy="9.6" r="2.6" stroke={color} strokeWidth={1.7} />
      <Path d="M17 14.2c2.6 0 4.2 1.8 4.2 4.1" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileTabIcon({ size = 24, color = '#fff', active }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="4" stroke={color} strokeWidth={active ? 2.2 : 1.9}
        fill={active ? color : 'none'} fillOpacity={active ? 0.18 : 0} />
      <Path d="M4.5 20c0-4 3.4-6.4 7.5-6.4s7.5 2.4 7.5 6.4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}
