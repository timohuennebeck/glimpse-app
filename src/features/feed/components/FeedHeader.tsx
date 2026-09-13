import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, GlassButton, PlusIcon, Text } from '@/shared/ui';
import { colors } from '@/shared/theme';

type FeedHeaderProps = {
  avatar: string | number;
  name: string;
  subtitle: string;
  onPressAdd?: () => void;
  onPressAvatar?: () => void;
};

export function FeedHeader({ avatar, name, subtitle, onPressAdd, onPressAvatar }: FeedHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPressAvatar} hitSlop={6}>
        <Avatar source={avatar} size={52} ring="halo" />
      </Pressable>
      <View style={styles.text}>
        <Text variant="cardTitleLg" color={colors.inkStrong}>
          {name}
        </Text>
        <Text variant="subtitle" color={colors.mutedGrey}>
          {subtitle}
        </Text>
      </View>
      <GlassButton size={44} onPress={onPressAdd}>
        <PlusIcon size={19} />
      </GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  text: { flex: 1, gap: 2 },
});
