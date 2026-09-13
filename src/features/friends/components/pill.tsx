import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
interface PillProps {
  label: string;
  /** filled = purple CTA, outline = hairline, muted = grey "Ausstehend". */
  tone?: 'filled' | 'outline' | 'muted' | 'quiet';
  onPress?: () => void;
  compact?: boolean;
}

/** The small trailing action on a person row. */
export function Pill({ label, tone = 'filled', onPress, compact = false }: PillProps) {
  const palette = {
    filled: { bg: colors.purple, fg: colors.white, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.inkBody, border: colors.border },
    muted: { bg: colors.surfaceChipCool, fg: '#6F6A80', border: 'transparent' },
    quiet: { bg: 'transparent', fg: colors.mutedLilac, border: colors.border },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pill,
        compact ? styles.compact : styles.regular,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border === 'transparent' ? 0 : 1.5,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text variant="bodyXs" color={palette.fg} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  regular: { paddingHorizontal: 18, paddingVertical: 11 },
  compact: { paddingHorizontal: 16, height: 38 },
  label: { fontWeight: '600' },
});
