import { View } from 'react-native';
import { Text } from '@/shared/ui/text';
interface SectionLabelProps {
  /** Uppercase tracked eyebrow, e.g. "DEINE FREUNDE". */
  children: string;
  /** Optional purple counter on the right ("2 offen"). */
  trailing?: string;
}

export function SectionLabel({ children, trailing }: SectionLabelProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="eyebrow" className="text-muted-lilac">
        {children}
      </Text>
      {trailing ? (
        <Text variant="meta" weight="semibold" className="text-purple-deep">
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}
