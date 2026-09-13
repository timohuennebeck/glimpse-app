import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LockedImage, Text } from '@/shared/ui';
import { BLUR } from '@/shared/ui/LockedImage';
import { colors, radius } from '@/shared/theme';
import { pairDate } from '@/shared/lib/format';
import type { MomentPair } from '@/features/moments';

type PairGridProps = {
  pairs: MomentPair[];
  /**
   * `1` renders one pair per row at full width (screen 07), `2` renders two
   * pairs per row (screen 07b). Both artboards exist in the mock as
   * alternatives; the denser one is the default.
   */
  perRow?: 1 | 2;
  onPressPhoto?: (pairId: string, side: 'left' | 'right') => void;
};

/**
 * A completed trade rendered as what it is: two photos taken the same day, kept
 * together. This is the "something to keep" layer from the positioning note —
 * the artefact the month-end export is eventually built from.
 */
export function PairGrid({ pairs, perRow = 2, onPressPhoto }: PairGridProps) {
  const rows = perRow === 1 ? pairs.map((p) => [p]) : chunk(pairs, 2);

  return (
    <View style={perRow === 1 ? styles.listWide : styles.list}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((pair) => (
            <Pair key={pair.tradeId} pair={pair} perRow={perRow} onPressPhoto={onPressPhoto} />
          ))}
          {/* Keep a lone trailing pair at half width instead of stretching it. */}
          {perRow === 2 && row.length === 1 ? <View style={styles.flex} /> : null}
        </View>
      ))}
    </View>
  );
}

function Pair({
  pair,
  perRow,
  onPressPhoto,
}: {
  pair: MomentPair;
  perRow: 1 | 2;
  onPressPhoto?: (pairId: string, side: 'left' | 'right') => void;
}) {
  const wide = perRow === 1;
  const height = wide ? 304 : 111;
  const tile = wide ? radius.chip : radius.tile;

  return (
    <View style={styles.pair}>
      <View style={[styles.pairImages, { gap: wide ? 14 : 5 }]}>
        <Pressable style={styles.flex} onPress={() => onPressPhoto?.(pair.tradeId, 'left')}>
          {pair.locked ? (
            <LockedImage
              source={pair.left}
              radius={tile}
              blur={wide ? BLUR.card : BLUR.tile}
              puckSize={wide ? 56 : 38}
              style={{ height }}
            />
          ) : (
            <Image source={pair.left} style={[styles.image, { height, borderRadius: tile }]} contentFit="cover" />
          )}
        </Pressable>

        <Pressable style={styles.flex} onPress={() => onPressPhoto?.(pair.tradeId, 'right')}>
          <Image source={pair.right} style={[styles.image, { height, borderRadius: tile }]} contentFit="cover" />
        </Pressable>
      </View>

      <Text variant={wide ? 'bodyXs' : 'metaSm'} color={colors.mutedGrey} center>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 16 },
  listWide: { gap: 18 },
  row: { flexDirection: 'row', gap: 12 },
  pair: { flex: 1, gap: 8 },
  pairImages: { flexDirection: 'row' },
  image: { width: '100%' },
});
