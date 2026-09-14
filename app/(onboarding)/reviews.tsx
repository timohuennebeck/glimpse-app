import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '@/shared/ui/avatar';
import { CloseRow } from '@/shared/ui/close-row';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { LaurelIcon, VerifiedIcon } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/screen';
import { StarRow } from '@/shared/ui/star-row';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t, tList } from '@/shared/i18n/i18n';
import { AVATARS } from '@/shared/lib/fixtures';
interface Review {
  name: string;
  since: string;
  score: string;
  quote: string;
}

/** Screen `08 Reviews` — social proof between onboarding and the paywall. */
export default function ReviewsScreen() {
  const reviews = tList<Review>('onboarding.reviews.items');
  const faces = [AVATARS.mia, AVATARS.ben, AVATARS.lina];

  return (
    <Screen
      footer={
        <CtaFooter label={t('onboarding.reviews.cta')} onPress={() => router.push('/(onboarding)/paywall')} />
      }
      scroll
    >
      <CloseRow onPress={() => router.back()} />

      <Text variant="display" color={colors.ink} style={styles.title}>
        {t('onboarding.reviews.title')}
      </Text>
      <Text variant="body" color={colors.mutedViolet} style={styles.subtitle}>
        {t('onboarding.reviews.subtitle')}
      </Text>

      <View style={styles.ratingRow}>
        <LaurelIcon size={42} />
        <View style={styles.ratingCenter}>
          <StarRow size={21} />
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
                  <StarRow size={13} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
