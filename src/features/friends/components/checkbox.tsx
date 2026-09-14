import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
interface CheckboxProps {
  checked: boolean;
}

/** The 28px circular selection control on the recipients screen. */
export function Checkbox({ checked }: CheckboxProps) {
  return (
    <View
      className={cn(
        'h-7 w-7 items-center justify-center rounded-[14px]',
        checked ? 'bg-purple' : 'border-[1.8px] border-border-strong',
      )}
    >
      {checked ? <Check size={13} color={colors.white} strokeWidth={2.6} /> : null}
    </View>
  );
}
