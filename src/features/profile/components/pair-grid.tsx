import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { BLUR, LockedImage } from '@/shared/ui/locked-image';
import { Text } from '@/shared/ui/text';
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
    <View className="gap-4">
      {chunk(pairs, 2).map((row, i) => (
        <View key={i} className="flex-row gap-3">
          {row.map((pair) => (
            <Pair key={pair.tradeId} pair={pair} onPressPhoto={onPressPhoto} />
          ))}
          {/* Keep a lone trailing pair at half width instead of stretching it. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

interface PairProps {
  pair: MomentPair;
  onPressPhoto?: (momentId: string) => void;
}

/** Both tiles of a pair share the 111px height. */
function Pair({ pair, onPressPhoto }: PairProps) {
  return (
    <View className="flex-1 gap-2">
      <View className="flex-row gap-[5px]">
        <Pressable className="flex-1" onPress={() => onPressPhoto?.(pair.leftMomentId)}>
          {pair.locked ? (
            <LockedImage
              source={pair.left}
              radius={radius.tile}
              blur={BLUR.tile}
              puckSize={38}
              className="h-[111px]"
            />
          ) : (
            <Image source={pair.left} className="h-[111px] w-full rounded-tile" contentFit="cover" />
          )}
        </Pressable>

        <Pressable className="flex-1" onPress={() => onPressPhoto?.(pair.rightMomentId)}>
          <Image source={pair.right} className="h-[111px] w-full rounded-tile" contentFit="cover" />
        </Pressable>
      </View>

      <Text variant="metaSm" className="text-center text-muted-grey">
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
