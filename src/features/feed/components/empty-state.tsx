import { View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { ART } from '@/shared/lib/fixtures';
interface EmptyStateProps {
  title: string;
  body: string;
  cta: string;
  onPress?: () => void;
  artSize?: number;
}

/** Dashed "nothing here yet" card with the mascot (empty feed, recipients). */
export function EmptyState({ title, body, cta, onPress, artSize = 132 }: EmptyStateProps) {
  return (
    <View className="items-center gap-3.5 rounded-card border-[1.5px] border-dashed border-border-strong bg-surface px-5 pb-[22px] pt-[26px]">
      {/* The art size is a prop, so it stays a style. */}
      <Image source={ART.mascotUnlock} style={{ width: artSize, height: artSize }} contentFit="contain" />
      <Text variant="cardTitleLg" className="text-center text-ink">
        {title}
      </Text>
      <Text variant="bodyXs" className="max-w-[270px] text-center text-muted">
        {body}
      </Text>
      <Button label={cta} variant="purple" size="sm" onPress={onPress} className="mt-0.5 w-full" />
    </View>
  );
}
