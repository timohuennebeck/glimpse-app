import { View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Text } from '@/shared/ui/text';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `06 Notifications · 6 of 7`.
 *
 * Push matters more here than in most apps: it is what tells the app to refresh
 * the widget when a frosted moment lands. See `widgets/README.md`.
 */
export default function NotificationsScreen() {
  async function next() {
    await Notifications.requestPermissionsAsync();
    router.push('/(onboarding)/widget');
  }

  return (
    <OnboardingScreen
      step={6}
      title={t(ONBOARDING.NOTIFICATIONS.TITLE)}
      subtitle={t(ONBOARDING.NOTIFICATIONS.SUBTITLE)}
      cta={t(ONBOARDING.NOTIFICATIONS.CTA)}
      onNext={next}
      secondary={t(ONBOARDING.NOTIFICATIONS.SKIP)}
      onSecondary={() => router.push('/(onboarding)/widget')}
      footnote={t(ONBOARDING.NOTIFICATIONS.NOTE)}
    >
      <View className="mt-5 gap-1.5 rounded-lg bg-surface-violet-deep px-[18px] pb-5 pt-2">
        <View className="h-[210px]">
          <Image source={ART.bell} className="absolute left-[150px] top-3 h-40 w-40" contentFit="contain" />
          <Image
            source={ART.mascot}
            className="absolute left-1 top-[100px] h-24 w-24 -scale-x-100"
            contentFit="contain"
          />
          <View className="absolute bottom-0 right-0 rounded-pill bg-notification-chip px-3.5 py-1.5">
            <Text variant="meta" className="text-ink-faint">
              {t(ONBOARDING.NOTIFICATIONS.BADGE)}
            </Text>
          </View>
        </View>

        {/* A realistic push preview, so the ask is concrete. */}
        <View
          className="mt-2.5 flex-row items-center gap-3.5 rounded-input bg-white p-3.5"
          // Shadows stay as a style: RN's shadow props have no NativeWind mapping.
          style={shadow.raised}
        >
          <View className="h-[46px] w-[46px] items-center justify-center rounded-tile bg-notification-tint">
            <Image source={ART.mascot} className="h-9 w-9" contentFit="contain" />
          </View>
          <View className="flex-1 gap-[3px]">
            <View className="flex-row items-baseline justify-between">
              <Text variant="bodyXs" weight="semibold" className="text-ink">
                {t(ONBOARDING.NOTIFICATIONS.PREVIEW_APP)}
              </Text>
              <Text variant="metaSm" className="text-muted-grey">
                {t(ONBOARDING.NOTIFICATIONS.PREVIEW_TIME)}
              </Text>
            </View>
            <Text variant="bodyXs" className="text-ink-soft">
              {t(ONBOARDING.NOTIFICATIONS.PREVIEW_BODY)}
            </Text>
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}
