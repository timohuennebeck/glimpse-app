import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/shared/theme/colors';
/** Channel glyphs for screen `12 Where did you hear`, matching the mock's SVGs. */
const C = colors.purpleMuted;

interface ChannelIconProps {
  size?: number;
}

export function FriendChannelIcon({ size = 26 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={C}>
      <Circle cx="9" cy="8" r="3.4" />
      <Circle cx="16.5" cy="9" r="2.7" />
      <Path d="M2.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6v.5H2.5V19z" />
      <Path d="M16.5 13.5c2.9 0 5 1.9 5 4.7v1.3h-4.3v-.5c0-2-.7-3.8-2-5.1.4-.3.8-.4 1.3-.4z" />
    </Svg>
  );
}

export function InstagramChannelIcon({ size = 24 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={2}>
      <Rect x="3" y="3" width="18" height="18" rx="5" />
      <Circle cx="12" cy="12" r="4" />
      <Circle cx="17.3" cy="6.7" r="1.1" fill={C} stroke="none" />
    </Svg>
  );
}

export function TiktokChannelIcon({ size = 26 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={2.6} strokeLinecap="round">
      <Path d="M14.2 4.2L5.8 18.8" />
      <Path d="M10.4 4.6l3 5.2" />
      <Path d="M12.6 9.6l5.6 9.7" />
      <Path d="M2.8 15.4h18.4" />
      <Path d="M4.4 20.2l1-1.7" />
    </Svg>
  );
}

export function AppStoreChannelIcon({ size = 24 }: ChannelIconProps) {
  return (
    <Svg width={size} height={(size * 20) / 26} viewBox="0 0 26 20" fill="none" stroke={C} strokeWidth={1.9} strokeLinejoin="round">
      <Rect x="1" y="1" width="24" height="18" rx="3.5" />
      <Path d="M2 3l11 8 11-8" />
    </Svg>
  );
}

export function YoutubeChannelIcon({ size = 24 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={C}>
      <Rect x="2" y="5" width="20" height="14" rx="4" />
      <Path d="M10 9v6l5-3z" fill={colors.surfaceVioletDeep} />
    </Svg>
  );
}

export function SearchChannelIcon({ size = 24 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={C}>
      <Path d="M11 2.5l1.75 5.15L17.9 9.4l-5.15 1.75L11 16.3l-1.75-5.15L4.1 9.4l5.15-1.75z" />
      <Path d="M18.4 14.4l.85 2.4 2.4.85-2.4.85-.85 2.4-.85-2.4-2.4-.85 2.4-.85z" />
    </Svg>
  );
}

export function OtherChannelIcon({ size = 26 }: ChannelIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={C}>
      <Circle cx="6" cy="12" r="2" />
      <Circle cx="12" cy="12" r="2" />
      <Circle cx="18" cy="12" r="2" />
    </Svg>
  );
}
