import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Button, Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';
import { ART } from '@/shared/lib/fixtures';

type EmptyStateProps = {
  title: string;
  body: string;
  cta: string;
  onPress?: () => void;
  art?: number;
  /** Dashed border = "nothing here yet" (feed empty, recipients empty). */
  dashed?: boolean;
  artSize?: number;
};

export function EmptyState({
  title,
  body,
  cta,
  onPress,
  art = ART.mascotUnlock,
  dashed = true,
  artSize = 132,
}: EmptyStateProps) {
  return (
    <View style={[styles.card, dashed ? styles.dashed : styles.solid]}>
      <Image source={art} style={{ width: artSize, height: artSize }} contentFit="contain" />
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
  },
  dashed: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  solid: { backgroundColor: colors.surfaceVioletDeep },
  body: { maxWidth: 270 },
  cta: { width: '100%', marginTop: 2 },
});
