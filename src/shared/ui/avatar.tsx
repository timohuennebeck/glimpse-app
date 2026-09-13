import { StyleSheet, View, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { colors } from '@/shared/theme/colors';
interface AvatarProps {
  source: ImageSource | string | number;
  size?: number;
  /**
   * Ring styles from the mock:
   *  - `none`    plain circle
   *  - `halo`    2px white border + 1.5px #DCD0F7 outer ring (feed header, profile)
   *  - `active`  solid purple ring with a white gap (you / unread story)
   *  - `idle`    grey ring with a white gap (read story)
   */
  ring?: 'none' | 'halo' | 'active' | 'idle';
  dimmed?: boolean;
  style?: ViewStyle;
}

export function Avatar({ source, size = 52, ring = 'none', dimmed = false, style }: AvatarProps) {
  const img = typeof source === 'string' ? { uri: source } : source;

  if (ring === 'active' || ring === 'idle') {
    // Mock: a coloured disc with 2.4px padding, and the photo carries a white border.
    const pad = size * 0.041;
    const inner = size * 0.041;
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            padding: pad,
            backgroundColor: ring === 'active' ? colors.purple : colors.avatarRingIdle,
          },
          style,
        ]}
      >
        <Image
          source={img}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size / 2,
            borderWidth: inner,
            borderColor: colors.white,
            opacity: dimmed ? 0.55 : 1,
          }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={img}
        style={[
          { width: size, height: size, borderRadius: size / 2, opacity: dimmed ? 0.55 : 1 },
          ring === 'halo' && styles.halo,
        ]}
        contentFit="cover"
      />
      {ring === 'halo' ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: size / 2, borderWidth: 1.5, borderColor: colors.purpleHalo, margin: -1.5 },
          ]}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { borderWidth: 2, borderColor: colors.white },
});
