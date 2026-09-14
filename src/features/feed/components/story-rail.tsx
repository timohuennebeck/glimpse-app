import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { avatarSize } from '@/shared/theme/page-structure';
export interface StoryItem {
  id: string;
  name: string;
  avatar: string | number;
  /** Purple ring = they are waiting on you, grey = nothing new. */
  waiting: boolean;
}

interface StoryRailProps {
  items: StoryItem[];
  /** How many dashed "invite" placeholders to pad the rail with. */
  placeholders?: number;
  placeholderLabel: string;
  size?: number;
  onPressItem?: (id: string) => void;
  onPressPlaceholder?: () => void;
}

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
  // The cell width follows the `size` prop, so it stays a style.
  const cell = { width: size + 14 };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-[18px] pr-5"
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          // Capped so a long name cannot widen the cell past its avatar.
          className="items-center gap-[7px]"
          style={cell}
          onPress={() => onPressItem?.(item.id)}
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <Avatar source={item.avatar} size={size} ring={item.waiting ? 'active' : 'idle'} />
          <Text variant="metaXs" className="text-ink-faint" numberOfLines={1}>
            {item.name}
          </Text>
        </Pressable>
      ))}

      {Array.from({ length: placeholders }).map((_, i) => (
        <Pressable
          key={`ph-${i}`}
          className="items-center gap-[7px]"
          style={cell}
          onPress={onPressPlaceholder}
          accessibilityRole="button"
          accessibilityLabel={placeholderLabel}
        >
          <View
            className="items-center justify-center border-2 border-dashed border-border-dashed"
            style={{ width: size, height: size, borderRadius: size / 2 }}
          >
            <Svg width={size * 0.36} height={size * 0.36} viewBox="0 0 20 20" fill="none">
              <Path d="M10 4v12M4 10h12" stroke={colors.dashedIdle} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text variant="metaXs" className="text-muted-lilac" numberOfLines={1}>
            {placeholderLabel}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
