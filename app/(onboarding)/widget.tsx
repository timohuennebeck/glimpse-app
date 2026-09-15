import { router } from 'expo-router';
import { t } from '@/shared/i18n/i18n';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { HomescreenPreview } from '@/features/widget/components/homescreen-preview';
/**
 * Screen `07 Widget · 7 of 7`.
 *
 * The mock also draws a 4x2 layout as an alternative. Only the 2x2 is shown:
 * the step's job is to get the widget onto the homescreen, and asking someone to
 * pick a size before they have ever seen one is a decision too early.
 * `HomescreenPreview` still supports `size="large"` for when that changes.
 */
export default function WidgetScreen() {
  return (
    <OnboardingScreen
      step={7}
      title={t('onboarding.widget.title')}
      subtitle={t('onboarding.widget.subtitle')}
      cta={t('onboarding.widget.cta')}
      onNext={() => router.push('/(onboarding)/reviews')}
      secondary={t('onboarding.widget.skip')}
      onSecondary={() => router.push('/(onboarding)/reviews')}
      footnote={t('onboarding.widget.note')}
    >
      <HomescreenPreview size="small" />
    </OnboardingScreen>
  );
}
