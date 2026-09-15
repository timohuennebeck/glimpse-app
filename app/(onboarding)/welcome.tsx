import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { Screen } from '@/shared/ui/screen';
import { StarRow } from '@/shared/ui/star-row';
import { Text } from '@/shared/ui/text';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `00 Welcome`.
 *
 * The headline is the product's whole promise, so it leads: a look, only if you
 * give one back. The hero shows one open and one frosted photo side by side.
 */
export default function WelcomeScreen() {
  return (
    <Screen
      footer={
        <View className="items-center gap-[22px]">
          <View className="flex-row items-center gap-2.5">
            <StarRow size={16} gap={2} />
            <Text variant="bodyXs" weight="semibold" className="text-ink">
              {t(ONBOARDING.WELCOME.RATING)}
            </Text>
            <Text variant="meta" className="text-muted-lilac">
              {t(ONBOARDING.WELCOME.RATING_META)}
            </Text>
          </View>

          <Button
            label={t(ONBOARDING.WELCOME.CTA)}
            size="xl"
            onPress={() => router.push('/(onboarding)/name')}
          />

          <Text variant="body" className="text-center text-ink">
            {t(ONBOARDING.WELCOME.HAS_ACCOUNT)}{' '}
            <Text
              variant="body"
              weight="semibold"
              className="text-ink"
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/(onboarding)/details', params: { mode: 'signin' } })}
            >
              {t(ONBOARDING.WELCOME.SIGN_IN)}
            </Text>
          </Text>

          <View className="flex-row items-center gap-2.5">
            <Text variant="subtitle" className="text-muted-lilac">
              {t(ONBOARDING.WELCOME.LEGAL_PRIVACY)}
            </Text>
            <Text variant="subtitle" className="text-muted-lilac">
              ·
            </Text>
            <Text variant="subtitle" className="text-muted-lilac">
              {t(ONBOARDING.WELCOME.LEGAL_TERMS)}
            </Text>
          </View>
        </View>
      }
      scroll
      gutter={spacing.gutterWide}
      className="bg-transparent"
      // Full-bleed: as a child it would be clipped to the padded content box
      // and leave a white band above the status bar.
      backdrop={
        <LinearGradient
          colors={['#E9DFFB', '#EEE6FC', '#F7F3FE', '#FFFFFF']}
          locations={[0, 0.32, 0.54, 0.66]}
          className="absolute inset-0"
        />
      }
    >
      <View className="items-center">
        {/* Fills the content box and scales down on narrow phones instead of overflowing it. */}
        <Image
          source={ART.welcomeHero}
          className="mt-1.5 aspect-[348/300] w-full max-w-[348px]"
          contentFit="contain"
        />

        <Text variant="displayLg" className="mt-[18px] text-center text-ink">
          {t(ONBOARDING.WELCOME.TITLE)}
        </Text>
        <Text variant="bodyMd" className="mt-3.5 text-center text-muted-violet">
          {t(ONBOARDING.WELCOME.SUBTITLE)}
        </Text>
      </View>
    </Screen>
  );
}
