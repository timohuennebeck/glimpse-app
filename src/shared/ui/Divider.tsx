import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors } from '@/shared/theme';

/** Hairline with an optional centred label ("oder teilen"). */
export function Divider({ label }: { label?: string }) {
  if (!label) return <View style={styles.line} />;
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
