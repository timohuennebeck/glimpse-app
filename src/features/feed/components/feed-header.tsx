import { Pressable, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { FRIENDS } from '@/shared/i18n/keys';
interface FeedHeaderProps {
  avatar: string | number | null;
  name: string;
  subtitle: string;
  onPressAdd?: () => void;
  onPressAvatar?: () => void;
}

export function FeedHeader({ avatar, name, subtitle, onPressAdd, onPressAvatar }: FeedHeaderProps) {
  return (
    <View className="flex-row items-center gap-[13px]">
      <Pressable onPress={onPressAvatar} hitSlop={6} accessibilityRole="button" accessibilityLabel={name}>
        <Avatar source={avatar} name={name} size={52} ring="halo" />
      </Pressable>
      <View className="flex-1 gap-0.5">
        <Text variant="cardTitleLg" className="text-ink-strong">
          {name}
        </Text>
        <Text variant="subtitle" className="text-muted-grey">
          {subtitle}
        </Text>
      </View>
      <GlassButton size={44} onPress={onPressAdd} accessibilityLabel={t(FRIENDS.SEARCH.TITLE)}>
        <Plus size={19} color="#1b1b1f" strokeWidth={2} />
      </GlassButton>
    </View>
  );
}
