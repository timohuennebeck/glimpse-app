import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
interface CheckCircleProps {
  checked: boolean;
  size?: number;
  className?: string;
}

/** Circular selection mark: a grey ring when off, a purple disc with a tick when on. */
export function CheckCircle({ checked, size = 26, className }: CheckCircleProps) {
  return (
    <View
      className={cn(
        'items-center justify-center border-[1.8px]',
        checked ? 'border-purple-deep bg-purple-deep' : 'border-swatch-grey',
        className,
      )}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {checked ? <Check size={12} color={colors.white} strokeWidth={2.6} /> : null}
    </View>
  );
}
