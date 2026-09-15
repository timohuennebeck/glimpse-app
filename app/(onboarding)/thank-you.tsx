import { View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { ART } from '@/shared/lib/assets';
/**
 * Screen `11a Welcome · variant A (mascot)`.
 *
 * The mock also contains a variant B built around a video still. It is not
 * shipped: without an experiment framework an in-app switcher is just a control
 * users can trip over.
 */
export default function ThankYouScreen() {
  return (
    <Screen
      footer={
        <View className="gap-6">
          <Button
            label={t('onboarding.thankYou.variantA.cta')}
            onPress={() => {
              // The feed has to be underneath, or closing the camera has nowhere to go.
              router.replace('/(app)/feed');
              router.push('/camera');
            }}
          />
          <Text
            variant="buttonSm"
            className="text-center text-ink-soft"
            accessibilityRole="link"
            onPress={() => router.replace('/(app)/feed')}
          >
            {t('onboarding.thankYou.variantA.skip')}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow className="h-9" onPress={() => router.replace('/(app)/feed')} />

      <Text variant="display" className="mt-10 text-center text-ink">
        {t('onboarding.thankYou.variantA.title')}
      </Text>
      <Text variant="bodyMd" className="mt-3 text-center text-purple-muted">
        {t('onboarding.thankYou.variantA.subtitle')}
      </Text>

      <View className="mt-[34px] h-[280px] items-center justify-center">
        <LinearGradient
          colors={['rgba(180,140,255,.42)', 'rgba(180,140,255,.14)', 'rgba(180,140,255,0)']}
          locations={[0, 0.45, 0.72]}
          className="absolute h-[260px] w-[260px] rounded-[130px]"
        />
        <Image source={ART.mascotUnlock} className="h-[250px] w-[250px]" contentFit="contain" />
      </View>
      <Text variant="bodyMd" className="mt-11 text-center text-purple-muted">
        {t('onboarding.thankYou.variantA.footnote')}
      </Text>
    </Screen>
  );
}
