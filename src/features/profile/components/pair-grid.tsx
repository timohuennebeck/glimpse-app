import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { BLUR, LockedImage } from '@/shared/ui/locked-image';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { pairDate } from '@/shared/lib/format';
import type { MomentPair } from '@/features/moments/interfaces';
interface PairGridProps {
  pairs: MomentPair[];
  onPressPhoto?: (momentId: string) => void;
}

/**
 * A completed trade rendered as what it is: two photos taken the same day, kept
 * together — two pairs per row, as on screen 07b. This is the "something to
 * keep" layer from the positioning note, the artefact the month-end export is
 * eventually built from.
 */
export function PairGrid({ pairs, onPressPhoto }: PairGridProps) {
  return (
    <View style={styles.list}>
      {chunk(pairs, 2).map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((pair) => (
            <Pair key={pair.tradeId} pair={pair} onPressPhoto={onPressPhoto} />
          ))}
          {/* Keep a lone trailing pair at half width instead of stretching it. */}
          {row.length === 1 ? <View style={styles.flex} /> : null}
        </View>
      ))}
    </View>
  );
}

interface PairProps {
  pair: MomentPair;
  onPressPhoto?: (momentId: string) => void;
}

function Pair({ pair, onPressPhoto }: PairProps) {
  return (
    <View style={styles.pair}>
      <View style={styles.pairImages}>
        <Pressable style={styles.flex} onPress={() => onPressPhoto?.(pair.leftMomentId)}>
          {pair.locked ? (
            <LockedImage
              source={pair.left}
              radius={radius.tile}
              blur={BLUR.tile}
              puckSize={38}
              style={styles.locked}
            />
          ) : (
            <Image source={pair.left} style={styles.photo} contentFit="cover" />
          )}
        </Pressable>

        <Pressable style={styles.flex} onPress={() => onPressPhoto?.(pair.rightMomentId)}>
          <Image source={pair.right} style={styles.photo} contentFit="cover" />
        </Pressable>
      </View>

      <Text variant="metaSm" color={colors.mutedGrey} center>
        {pairDate(pair.date)}
      </Text>
    </View>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const TILE_HEIGHT = 111;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  pair: { flex: 1, gap: 8 },
  pairImages: { flexDirection: 'row', gap: 5 },
  locked: { height: TILE_HEIGHT },
  photo: { width: '100%', height: TILE_HEIGHT, borderRadius: radius.tile },
});
