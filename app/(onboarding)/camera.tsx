import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { CameraIcon, Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
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
      <LinearGradient
        colors={['#F4EDFE', '#EDE2FD']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        <Image source={ART.cameraHero} style={styles.heroImage} contentFit="contain" />
      </LinearGradient>

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
  hero: {
    marginTop: 22,
    height: 300,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
