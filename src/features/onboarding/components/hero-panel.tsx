import { ImageStyle, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '@/shared/theme/page-structure';
interface HeroPanelProps {
  source: number;
  imageStyle: ImageStyle;
  style?: ViewStyle;
}

/** The lilac gradient panel with a piece of hero art in it (camera ask, sign-up). */
export function HeroPanel({ source, imageStyle, style }: HeroPanelProps) {
  return (
    <LinearGradient
      colors={['#F4EDFE', '#EDE2FD']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.panel, style]}
    >
      <Image source={source} style={imageStyle} contentFit="contain" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  panel: { height: 300, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});
