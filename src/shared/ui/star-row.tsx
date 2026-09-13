import { StyleSheet, View } from 'react-native';
import { StarIcon } from '@/shared/ui/icons';
interface StarRowProps {
  size: number;
  gap?: number;
}

/** Five filled stars in a row — the rating motif on welcome and reviews. */
export function StarRow({ size, gap = 3 }: StarRowProps) {
  return (
    <View style={[styles.row, { gap }]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row' } });
