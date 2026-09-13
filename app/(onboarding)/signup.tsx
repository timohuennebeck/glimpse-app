import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { GoogleIcon, MailIcon } from '@/shared/ui/icons';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { HeroPanel } from '@/features/onboarding/components/hero-panel';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `04 Sign up · 4 of 7`.
 *
 * Google sign-in is designed but deliberately inert for now: turning it on is
 * Supabase console configuration plus `signInWithOAuth`, not new UI.
 */
export default function SignUpScreen() {
  return (
    <Screen
      background={colors.surfaceAlt}
      gutter={spacing.gutterWide}
      scroll
      bottomInset={spacing.contentBottom}
    >
      <ProgressHeader step={4} onClose={() => router.back()} />

      <Text variant="displayXl" color={colors.ink} style={styles.title}>
        {t('onboarding.signUp.title')}
      </Text>
      <Text variant="bodyMd" color={colors.mutedViolet} style={styles.subtitle}>
        {t('onboarding.signUp.subtitle')}
      </Text>

      <HeroPanel source={ART.signupKey} imageStyle={styles.heroImage} style={styles.hero} />

      <View style={styles.actions}>
        <Button
          label={t('onboarding.signUp.email')}
          size="xl"
          icon={<MailIcon size={26} />}
          onPress={() => router.push('/(onboarding)/details')}
        />
        <Button
          label={t('onboarding.signUp.google')}
          variant="outline"
          size="xl"
          icon={<GoogleIcon size={24} />}
          // Not wired: see the note in docs/database.md §6.
          onPress={() => router.push('/(onboarding)/details')}
        />
      </View>

      <View style={styles.divider}>
        <Divider label={t('onboarding.signUp.divider')} />
      </View>

      <Text variant="subtitle" color={colors.mutedLilac} center style={styles.legal}>
        {t('onboarding.signUp.legal', {
          terms: t('onboarding.signUp.terms'),
          privacy: t('onboarding.signUp.privacy'),
        })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 14 },
  subtitle: { marginTop: 14 },
  hero: { marginTop: 6 },
  heroImage: { width: 308, height: 250 },
  actions: { marginTop: 14, gap: 16 },
  divider: { marginTop: 26 },
  legal: { marginTop: 'auto', paddingTop: 32, lineHeight: 14.5 * 1.6 },
});
