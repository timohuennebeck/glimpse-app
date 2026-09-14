import { View } from 'react-native';
import { Text } from '@/shared/ui/text';
interface DividerProps {
  /** Centred label between the two hairlines ("or share"). */
  label: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-px flex-1 bg-border-soft" />
      <Text variant="meta" className="text-muted-lilac">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border-soft" />
    </View>
  );
}
