import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Eye, Mail } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
/** Screen `04a Your details · 4 of 7` — email + password, with a strength meter. */
export default function DetailsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(true);

  const strength = passwordStrength(password);
  const valid = email.includes('@') && password.length >= 9 && consent;

  return (
    <Screen
      footer={
        <View className="gap-[18px]">
          <Button
            label={t('onboarding.details.cta')}
            size="xl"
            disabled={!valid}
            onPress={() => router.push('/(onboarding)/friends')}
          />
          <Text variant="subtitle" className="text-center text-muted-lilac">
            {t('onboarding.details.hasAccount')}{' '}
            {/* Until auth is wired this form doubles as sign-in, so the link
                simply clears the flow above it. */}
            <Text
              variant="subtitle"
              weight="semibold"
              className="text-ink-body"
              accessibilityRole="link"
              onPress={() => router.dismissTo('/(onboarding)/welcome')}
            >
              {t('onboarding.details.signIn')}
            </Text>
          </Text>
        </View>
      }
      className="bg-surface-alt"
      gutter={spacing.gutterWide}
      scroll
    >
      <ProgressHeader step={4} onClose={() => router.back()} />

      <Text variant="display" className="mt-[22px] text-ink">
        {t('onboarding.details.title')}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t('onboarding.details.subtitle')}
      </Text>

      <View className="mt-7 gap-[18px]">
        <View className="gap-2">
          <Text variant="meta" className="text-muted">
            {t('onboarding.details.emailLabel')}
          </Text>
          <View className={cn(INPUT, email.length > 0 && 'border-purple')}>
            <Mail size={21} color={colors.purple} strokeWidth={1.6} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('onboarding.details.emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className={INPUT_TEXT}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text variant="meta" className="text-muted">
            {t('onboarding.details.passwordLabel')}
          </Text>
          <View className={cn(INPUT, 'bg-surface-violet-warm')}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoComplete="new-password"
              className={INPUT_TEXT}
            />
            <Pressable
              onPress={() => setReveal((r) => !r)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                reveal ? t('onboarding.details.hidePassword') : t('onboarding.details.showPassword')
              }
            >
              <Eye size={21} color={colors.muted} strokeWidth={1.6} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2.5 pl-0.5">
            <View className="flex-row gap-1">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={cn(
                    'h-[5px] w-[34px] rounded-[3px]',
                    i < strength ? 'bg-purple' : 'bg-border-lilac',
                  )}
                />
              ))}
            </View>
            <Text variant="metaSm" className="text-muted">
              {t('onboarding.details.passwordHint')}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        className="mt-[22px] flex-row items-start gap-3"
        onPress={() => setConsent((c) => !c)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
      >
        <View
          className={cn(
            'mt-px h-6 w-6 items-center justify-center rounded-[8px]',
            consent ? 'bg-purple' : 'border-[1.8px] border-swatch-grey bg-transparent',
          )}
        >
          {consent ? <Check size={14} color={colors.white} strokeWidth={2.2} /> : null}
        </View>
        <Text variant="subtitle" className="flex-1 text-muted-lilac">
          {t('onboarding.details.consent', {
            terms: t('onboarding.signUp.terms'),
            privacy: t('onboarding.signUp.privacy'),
          })}
        </Text>
      </Pressable>
    </Screen>
  );
}

/** 0-4, mapped onto the four segments the mock draws. */
function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 9) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const INPUT =
  'h-[62px] flex-row items-center gap-3 rounded-input border-[1.5px] border-border-input bg-white px-[18px]';
const INPUT_TEXT = 'flex-1 p-0 font-sans text-[17.5px] text-ink-body';
