import { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
interface CtaFooterProps {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** Secondary text action under the CTA ("Later", "Skip"). */
  secondary?: string;
  onSecondary?: () => void;
}

/** The CTA stack for a screen's `footer` slot: primary button plus an optional text action. */
export function CtaFooter({ label, onPress, icon, disabled, secondary, onSecondary }: CtaFooterProps) {
  return (
    <View className="gap-[22px]">
      <Button label={label} onPress={onPress} icon={icon} disabled={disabled} />
      {secondary ? (
        <Text
          variant="buttonSm"
          className="text-center text-ink-soft"
          onPress={onSecondary}
          accessibilityRole="link"
        >
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}
