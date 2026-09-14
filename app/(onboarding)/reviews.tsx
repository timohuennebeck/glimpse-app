import { View } from 'react-native';
import { router } from 'expo-router';
import { cn } from '@/shared/lib/cn';
import { Avatar } from '@/shared/ui/avatar';
import { CloseRow } from '@/shared/ui/close-row';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { LaurelIcon, VerifiedIcon } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/screen';
import { StarRow } from '@/shared/ui/star-row';
import { Text } from '@/shared/ui/text';
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

      <Text variant="display" className="mt-5 text-ink">
        {t('onboarding.reviews.title')}
      </Text>
      <Text variant="body" className="mt-3 text-muted-violet">
        {t('onboarding.reviews.subtitle')}
      </Text>

      <View className="mb-3 mt-[22px] flex-row items-center justify-center gap-2.5">
        <LaurelIcon size={42} />
        <View className="items-center gap-1">
          <StarRow size={21} />
          <Text variant="bodyXs" weight="semibold" className="text-ink">
            {t('onboarding.reviews.rating')}
          </Text>
          <Text variant="metaXs" className="text-muted-lilac">
            {t('onboarding.reviews.ratingMeta')}
          </Text>
        </View>
        <LaurelIcon size={42} flip />
      </View>

      <View className="mt-2.5 gap-2">
        {reviews.map((review, i) => (
          <View key={review.name} className="gap-1.5 rounded-card-sm bg-surface-lilac px-3.5 py-2.5">
            <View className="flex-row items-center gap-3">
              <Avatar source={faces[i % faces.length]} size={48} ring="idle" />
              <View className="min-w-0 flex-1 gap-0.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text variant="cardTitle" className="text-ink">
                    {review.name}
                  </Text>
                  <View className="flex-row items-center gap-[5px] rounded-pill bg-surface-violet-chip px-[9px] py-[3px]">
                    <VerifiedIcon size={15} />
                    <Text variant="captionXs" className="text-purple-muted">
                      {t('onboarding.reviews.verified')}
                    </Text>
                  </View>
                </View>
                <Text variant="metaXs" className="text-muted-lilac">
                  {review.since}
                </Text>
                <View className="flex-row items-center gap-2">
                  <StarRow size={13} />
                  <Text variant="metaSm" weight="semibold" className="text-ink-body">
                    {review.score}
                  </Text>
                </View>
              </View>
            </View>
            {/* 13.5 * 1.3 */}
            <Text variant="metaSm" className="leading-[17.55px] text-ink-soft">
              {review.quote}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-center gap-2">
        {[false, true, false].map((active, i) => (
          <View
            key={i}
            className={cn('h-[7px] w-[7px] rounded-[4px] bg-dot-idle', active && 'w-3.5 bg-purple')}
          />
        ))}
      </View>
    </Screen>
  );
}
