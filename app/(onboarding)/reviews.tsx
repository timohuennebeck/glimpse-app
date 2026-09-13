import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Avatar,
  Button,
  CloseIcon,
  GlassButton,
  LaurelIcon,
  Screen,
  StarIcon,
  Text,
  VerifiedIcon,
} from '@/shared/ui';
import { colors, radius, spacing } from '@/shared/theme';
import { t, tList } from '@/shared/i18n';
import { AVATARS } from '@/shared/lib/fixtures';

type Review = { name: string; since: string; score: string; quote: string };

/** Screen `08 Reviews` — social proof between onboarding and the paywall. */
export default function ReviewsScreen() {
  const reviews = tList<Review>('onboarding.reviews.items');
  const faces = [AVATARS.mia, AVATARS.ben, AVATARS.lina];

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.back()}>
          <CloseIcon size={11} />
        </GlassButton>
      </View>

      <Text variant="display" color={colors.ink} style={styles.title}>
        {t('onboarding.reviews.title')}
      </Text>
      <Text variant="body" color={colors.mutedViolet} style={styles.subtitle}>
        {t('onboarding.reviews.subtitle')}
      </Text>

      <View style={styles.ratingRow}>
        <LaurelIcon size={42} />
        <View style={styles.ratingCenter}>
          <View style={styles.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} size={21} />
            ))}
          </View>
          <Text variant="bodyXs" color={colors.ink} style={styles.ratingText}>
            {t('onboarding.reviews.rating')}
          </Text>
          <Text variant="metaXs" color={colors.mutedLilac}>
            {t('onboarding.reviews.ratingMeta')}
          </Text>
        </View>
        <LaurelIcon size={42} flip />
      </View>

      <View style={styles.list}>
        {reviews.map((review, i) => (
          <View key={review.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar source={faces[i % faces.length]} size={48} ring="idle" />
              <View style={styles.cardText}>
                <View style={styles.cardTitleRow}>
                  <Text variant="cardTitle" color={colors.ink}>
                    {review.name}
                  </Text>
                  <View style={styles.verifiedChip}>
                    <VerifiedIcon size={15} />
                    <Text variant="captionXs" color={colors.purpleMuted}>
                      {t('onboarding.reviews.verified')}
                    </Text>
                  </View>
                </View>
                <Text variant="metaXs" color={colors.mutedLilac}>
                  {review.since}
                </Text>
                <View style={styles.cardStars}>
                  <View style={styles.stars}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <StarIcon key={s} size={13} />
                    ))}
                  </View>
                  <Text variant="metaSm" color={colors.inkBody} style={styles.ratingText}>
                    {review.score}
                  </Text>
                </View>
              </View>
            </View>
            <Text variant="metaSm" color={colors.inkSoft} style={styles.quote}>
              {review.quote}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.dots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>

      <View style={styles.footer}>
        <Button label={t('onboarding.reviews.cta')} onPress={() => router.push('/(onboarding)/paywall')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  title: { marginTop: 20 },
  subtitle: { marginTop: 12 },
  ratingRow: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ratingCenter: { alignItems: 'center', gap: 4 },
  stars: { flexDirection: 'row', gap: 3 },
  ratingText: { fontWeight: '600' },
  list: { marginTop: 10, gap: 8 },
  card: {
    backgroundColor: colors.surfaceLilac,
    borderRadius: radius.cardSm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1, minWidth: 0, gap: 2 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceVioletChip,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  cardStars: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quote: { lineHeight: 13.5 * 1.3 },
  dots: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.dotIdle },
  dotActive: { width: 14, backgroundColor: colors.purple },
  footer: { marginTop: 'auto', paddingTop: 28 },
});
