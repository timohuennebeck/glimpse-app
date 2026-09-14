import { StyleSheet, View, ViewStyle } from 'react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { FilterIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
interface SectionHeadingProps {
  title: string;
  style?: ViewStyle;
}

/** "Your moments" heading with the filter control on the right (feed, profile). */
export function SectionHeading({ title, style }: SectionHeadingProps) {
  return (
    <View style={[styles.row, style]}>
      <Text variant="section" color={colors.ink}>
        {title}
      </Text>
      <GlassButton size={36} accessibilityLabel={t('common.filter')}>
        <FilterIcon size={20} />
      </GlassButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
