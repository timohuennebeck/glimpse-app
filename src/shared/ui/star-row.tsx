import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '@/shared/theme/colors';
interface StarRowProps {
  size: number;
  gap?: number;
}

/** Five filled stars in a row — the rating motif on welcome and reviews. */
export function StarRow({ size, gap = 3 }: StarRowProps) {
  return (
    <View className="flex-row" style={{ gap }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} color={colors.purple} fill={colors.purple} strokeWidth={0} />
      ))}
    </View>
  );
}
