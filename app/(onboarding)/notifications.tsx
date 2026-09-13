import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius, shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
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
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      cta={t('onboarding.notifications.cta')}
      onNext={next}
      secondary={t('onboarding.notifications.skip')}
      onSecondary={() => router.push('/(onboarding)/widget')}
      footnote={t('onboarding.notifications.note')}
    >
      <View style={styles.stage}>
        <View style={styles.art}>
          <Image source={ART.bell} style={styles.bell} contentFit="contain" />
          <Image source={ART.mascot} style={styles.mascot} contentFit="contain" />
          <View style={styles.chip}>
            <Text variant="meta" color={colors.inkFaint}>
              {t('onboarding.notifications.badge')}
            </Text>
          </View>
        </View>

        {/* A realistic push preview, so the ask is concrete. */}
        <View style={styles.preview}>
          <View style={styles.appIcon}>
            <Image source={ART.mascot} style={styles.appIconImage} contentFit="contain" />
          </View>
          <View style={styles.previewText}>
            <View style={styles.previewHeader}>
              <Text variant="bodyXs" color={colors.ink} style={styles.previewApp}>
                {t('onboarding.notifications.previewApp')}
              </Text>
              <Text variant="metaSm" color={colors.mutedGrey}>
                {t('onboarding.notifications.previewTime')}
              </Text>
            </View>
            <Text variant="bodyXs" color={colors.inkSoft}>
              {t('onboarding.notifications.previewBody')}
            </Text>
          </View>
        </View>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  stage: {
    marginTop: 20,
    backgroundColor: colors.surfaceVioletDeep,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 6,
  },
  art: { height: 210 },
  bell: { position: 'absolute', left: 150, top: 12, width: 160, height: 160 },
  mascot: {
    position: 'absolute',
    left: 4,
    top: 100,
    width: 96,
    height: 96,
    transform: [{ scaleX: -1 }],
  },
  chip: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.notificationChip,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  preview: {
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...shadow.raised,
  },
  appIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.tile,
    backgroundColor: colors.notificationTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconImage: { width: 36, height: 36 },
  previewText: { flex: 1, gap: 3 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  previewApp: { fontWeight: '600' },
});
