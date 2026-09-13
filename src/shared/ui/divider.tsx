import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
interface DividerProps {
  /** Centred label between the two hairlines ("or share"). */
  label: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.line, styles.flex]} />
      <Text variant="meta" color={colors.mutedLilac}>
        {label}
      </Text>
      <View style={[styles.line, styles.flex]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  line: { height: 1, backgroundColor: colors.borderSoft },
  flex: { flex: 1 },
});
