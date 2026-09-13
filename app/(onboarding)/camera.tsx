import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { CameraIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
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
      title={t('onboarding.camera.title')}
      subtitle={t('onboarding.camera.subtitle')}
      cta={t('onboarding.camera.cta')}
      ctaIcon={<CameraIcon size={24} lensColor={colors.ink} />}
      onNext={next}
      secondary={t('onboarding.camera.later')}
      onSecondary={() => router.push('/(onboarding)/first-glimpse')}
    >
      <HeroPanel source={ART.cameraHero} imageStyle={styles.heroImage} style={styles.hero} />

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text variant="bodyXs" color={colors.inkFaint}>
            {t('onboarding.camera.badge')}
          </Text>
        </View>
      </View>

      <Text variant="body" color={colors.inkFaint} center style={styles.note}>
        {t('onboarding.camera.note')}
      </Text>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: 22 },
  heroImage: { width: 318, height: 240 },
  badgeRow: { marginTop: 22, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceVioletDeep,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purple },
  note: { marginTop: 14 },
});
