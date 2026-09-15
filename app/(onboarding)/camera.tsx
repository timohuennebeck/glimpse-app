import { View } from 'react-native';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { CameraIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { HeroPanel } from '@/features/onboarding/components/hero-panel';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { ART } from '@/shared/lib/fixtures';
/** Screen `02 Camera · 2 of 7` — the camera permission ask. */
export default function CameraIntroScreen() {
  const [, requestPermission] = useCameraPermissions();

  async function next() {
    await requestPermission();
    router.push('/(onboarding)/first-glimpse');
  }

  return (
    <OnboardingScreen
      step={2}
      title={t(ONBOARDING.CAMERA.TITLE)}
      subtitle={t(ONBOARDING.CAMERA.SUBTITLE)}
      cta={t(ONBOARDING.CAMERA.CTA)}
      ctaIcon={<CameraIcon size={24} lensColor={colors.ink} />}
      onNext={next}
      secondary={t(ONBOARDING.CAMERA.LATER)}
      onSecondary={() => router.push('/(onboarding)/first-glimpse')}
    >
      <HeroPanel source={ART.cameraHero} className="mt-[22px]" imageClassName="h-[240px] w-[318px]" />

      <View className="mt-[22px] items-center">
        <View className="flex-row items-center gap-2 rounded-pill bg-surface-violet-deep px-[18px] py-[9px]">
          <View className="h-2 w-2 rounded-full bg-purple" />
          <Text variant="bodyXs" className="text-ink-faint">
            {t(ONBOARDING.CAMERA.BADGE)}
          </Text>
        </View>
      </View>

      <Text variant="body" className="mt-3.5 text-center text-ink-faint">
        {t(ONBOARDING.CAMERA.NOTE)}
      </Text>
    </OnboardingScreen>
  );
}
