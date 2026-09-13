import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
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
    <View style={styles.card}>
      <Image source={ART.mascotUnlock} style={{ width: artSize, height: artSize }} contentFit="contain" />
      <Text variant="cardTitleLg" color={colors.ink} center>
        {title}
      </Text>
      <Text variant="bodyXs" color={colors.muted} center style={styles.body}>
        {body}
      </Text>
      <Button label={cta} variant="purple" size="sm" onPress={onPress} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  body: { maxWidth: 270 },
  cta: { width: '100%', marginTop: 2 },
});
