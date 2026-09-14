import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
interface CtaFooterProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** Secondary text action under the CTA ("Later", "Skip"). */
  secondary?: string;
  onSecondary?: () => void;
}

/** The CTA stack pinned to the bottom of a full-height screen. */
export function CtaFooter({ label, onPress, icon, disabled, secondary, onSecondary }: CtaFooterProps) {
  return (
    <View style={styles.footer}>
      <Button label={label} onPress={onPress} icon={icon} disabled={disabled} />
      {secondary ? (
        <Text variant="buttonSm" color={colors.inkSoft} center onPress={onSecondary} accessibilityRole="link">
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { marginTop: 'auto', paddingTop: 28, gap: 22 },
});
