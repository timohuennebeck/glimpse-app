import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
interface SectionLabelProps {
  /** Uppercase tracked eyebrow, e.g. "DEINE FREUNDE". */
  children: string;
  /** Optional purple counter on the right ("2 offen"). */
  trailing?: string;
}

export function SectionLabel({ children, trailing }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <Text variant="eyebrow" color={colors.mutedLilac}>
        {children}
      </Text>
      {trailing ? (
        <Text variant="meta" color={colors.purpleDeep} style={styles.trailing}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trailing: { fontWeight: '600' },
});
