import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar, Text } from '@/shared/ui';
import { colors, avatarSize } from '@/shared/theme';

export type StoryItem = {
  id: string;
  name: string;
  avatar: string | number;
  /** Purple ring = they are waiting on you, grey = nothing new. */
  waiting: boolean;
};

type StoryRailProps = {
  items: StoryItem[];
  /** How many dashed "invite" placeholders to pad the rail with. */
  placeholders?: number;
  placeholderLabel: string;
  size?: number;
  onPressItem?: (id: string) => void;
  onPressPlaceholder?: () => void;
};

/**
 * The horizontal avatar rail under the feed header. The mock renders it at 58px
 * on the feed and 74px on the friends screen, hence the `size` prop.
 */
export function StoryRail({
  items,
  placeholders = 0,
  placeholderLabel,
  size = avatarSize.ringSm,
  onPressItem,
  onPressPlaceholder,
}: StoryRailProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <Pressable key={item.id} style={styles.cell} onPress={() => onPressItem?.(item.id)}>
          <Avatar source={item.avatar} size={size} ring={item.waiting ? 'active' : 'idle'} />
          <Text variant="metaXs" color={colors.inkFaint} numberOfLines={1}>
            {item.name}
          </Text>
        </Pressable>
      ))}

      {Array.from({ length: placeholders }).map((_, i) => (
        <Pressable key={`ph-${i}`} style={styles.cell} onPress={onPressPlaceholder}>
          <View style={[styles.dashed, { width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.36} height={size * 0.36} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10 4v12M4 10h12"
                stroke={colors.dashedIdle}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text variant="metaXs" color={colors.mutedLilac}>
            {placeholderLabel}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 18, paddingRight: 20 },
  cell: { alignItems: 'center', gap: 7 },
  dashed: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
