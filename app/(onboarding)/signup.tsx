import { View } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { Divider } from '@/shared/ui/divider';
import { GoogleIcon } from '@/shared/ui/icons';
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
      className="bg-surface-alt"
      gutter={spacing.gutterWide}
      scroll
      footer={
        <View className="gap-[22px]">
          <View className="gap-4">
            <Button
              label={t('onboarding.signUp.email')}
              size="xl"
              icon={<Mail size={26} color={colors.white} strokeWidth={1.9} />}
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
          <Divider label={t('onboarding.signUp.divider')} />
          {/* 14.5 * 1.6 */}
          <Text variant="subtitle" className="text-center leading-[23.2px] text-muted-lilac">
            {t('onboarding.signUp.legal', {
              terms: t('onboarding.signUp.terms'),
              privacy: t('onboarding.signUp.privacy'),
            })}
          </Text>
        </View>
      }
    >
      <ProgressHeader step={4} onClose={() => router.back()} />

      <Text variant="displayXl" className="mt-3.5 text-ink">
        {t('onboarding.signUp.title')}
      </Text>
      <Text variant="bodyMd" className="mt-3.5 text-muted-violet">
        {t('onboarding.signUp.subtitle')}
      </Text>

      <HeroPanel source={ART.signupKey} imageClassName="h-[250px] w-[308px]" className="mt-1.5" />
    </Screen>
  );
}
