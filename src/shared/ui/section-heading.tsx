import { View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { GlassButton } from '@/shared/ui/glass-button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON } from '@/shared/i18n/keys';
interface SectionHeadingProps {
  title: string;
  className?: string;
}

/** "Your moments" heading with the filter control on the right (feed, profile). */
export function SectionHeading({ title, className }: SectionHeadingProps) {
  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <Text variant="section" className="text-ink">
        {title}
      </Text>
      <GlassButton size={36} accessibilityLabel={t(COMMON.FILTER)}>
        <SlidersHorizontal size={20} color={colors.inkFaint} strokeWidth={1.9} />
      </GlassButton>
    </View>
  );
}
