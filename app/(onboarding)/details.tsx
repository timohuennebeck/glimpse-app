import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Check, Eye, Mail } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { getLocale, t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { errorMessage } from '@/shared/lib/error-message';
import { signIn, signUp } from '@/features/auth/data/auth-api';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Screen `04a Your details · 4 of 7`, and the sign-in form.
 *
 * One form in two modes: they differ by four strings and one request, and a
 * separate screen would duplicate the field layout and the strength meter.
 *
 * This is the one action in the app that is not optimistic. Everywhere else the
 * UI can assume the write lands; here there is nothing to assume until the
 * server has said who this is.
 */
type Mode = 'signup' | 'signin';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(true);
  /** Set for the two sign-up answers that are neither success nor an error. */
  const [notice, setNotice] = useState<string | null>(null);
  const draft = useOnboardingDraft();

  const signingUp = mode === 'signup';
  const strength = passwordStrength(password);
  const valid = email.includes('@') && password.length >= 9 && (!signingUp || consent);

  const submit = useMutation({
    mutationFn: async (): Promise<'signed-in' | 'confirmation-required' | 'already-registered'> => {
      if (!signingUp) {
        await signIn({ email, password });
        return 'signed-in';
      }
      const outcome = await signUp({ email, password, firstName: draft.firstName, locale: getLocale() });
      return outcome.kind;
    },
    onSuccess: (kind) => {
      if (kind !== 'signed-in') {
        setNotice(
          t(
            kind === 'already-registered'
              ? ONBOARDING.DETAILS.ERRORS.ALREADY_REGISTERED
              : ONBOARDING.DETAILS.ERRORS.CONFIRMATION_REQUIRED,
          ),
        );
        setMode('signin');
        return;
      }
      // A new account carries on at step 5. An existing one goes through the
      // entry point, which knows whether it ever finished onboarding.
      router.replace(signingUp ? '/(onboarding)/friends' : '/');
    },
  });

  function onSubmit() {
    setNotice(null);
    if (signingUp && draft.firstName.trim().length === 0) {
      // Reached by deep link or a reload. The signup trigger needs a name to
      // build the profile row and generate the username.
      router.push('/(onboarding)/name');
      return;
    }
    submit.mutate();
  }

  function switchMode() {
    setNotice(null);
    submit.reset();
    setMode(signingUp ? 'signin' : 'signup');
  }

  const copy = signingUp
    ? {
        title: ONBOARDING.DETAILS.TITLE,
        subtitle: ONBOARDING.DETAILS.SUBTITLE,
        cta: ONBOARDING.DETAILS.CTA,
        prompt: ONBOARDING.DETAILS.HAS_ACCOUNT,
        action: ONBOARDING.DETAILS.SIGN_IN,
      }
    : {
        title: ONBOARDING.DETAILS.SIGN_IN_TITLE,
        subtitle: ONBOARDING.DETAILS.SIGN_IN_SUBTITLE,
        cta: ONBOARDING.DETAILS.SIGN_IN_CTA,
        prompt: ONBOARDING.DETAILS.NO_ACCOUNT,
        action: ONBOARDING.DETAILS.CREATE_ACCOUNT,
      };

  const message = notice ?? (submit.error ? errorMessage(submit.error) : null);

  return (
    <Screen
      footer={
        <View className="gap-[18px]">
          {message ? (
            <Text variant="subtitle" className="text-center text-purple-deep">
              {message}
            </Text>
          ) : null}
          <Button
            label={t(copy.cta)}
            size="xl"
            disabled={!valid}
            loading={submit.isPending}
            onPress={onSubmit}
          />
          <Text variant="subtitle" className="text-center text-muted-lilac">
            {t(copy.prompt)}{' '}
            <Text
              variant="subtitle"
              weight="semibold"
              className="text-ink-body"
              accessibilityRole="link"
              onPress={switchMode}
            >
              {t(copy.action)}
            </Text>
          </Text>
        </View>
      }
      className="bg-surface-alt"
      gutter={spacing.gutterWide}
      scroll
    >
      {/* Signing in is not step 4 of anything — it is reached from the welcome
          screen as often as from the flow. */}
      {signingUp ? (
        <ProgressHeader step={4} onClose={() => router.back()} />
      ) : (
        <CloseRow onPress={() => router.back()} />
      )}

      <Text variant="display" className="mt-[22px] text-ink">
        {t(copy.title)}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t(copy.subtitle)}
      </Text>

      <View className="mt-7 gap-[18px]">
        <View className="gap-2">
          <Text variant="meta" className="text-muted">
            {t(ONBOARDING.DETAILS.EMAIL_LABEL)}
          </Text>
          <View className={cn(INPUT, email.length > 0 && 'border-purple')}>
            <Mail size={21} color={colors.purple} strokeWidth={1.6} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t(ONBOARDING.DETAILS.EMAIL_PLACEHOLDER)}
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
            {t(ONBOARDING.DETAILS.PASSWORD_LABEL)}
          </Text>
          <View className={cn(INPUT, 'bg-surface-violet-warm')}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              className={INPUT_TEXT}
            />
            <Pressable
              onPress={() => setReveal((r) => !r)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                reveal ? t(ONBOARDING.DETAILS.HIDE_PASSWORD) : t(ONBOARDING.DETAILS.SHOW_PASSWORD)
              }
            >
              <Eye size={21} color={colors.muted} strokeWidth={1.6} />
            </Pressable>
          </View>

          {/* A strength meter on the way in would be rating a password that is
              already set. */}
          {signingUp ? (
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
                {t(ONBOARDING.DETAILS.PASSWORD_HINT)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {signingUp ? (
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
            {t(ONBOARDING.DETAILS.CONSENT, {
              terms: t(ONBOARDING.SIGN_UP.TERMS),
              privacy: t(ONBOARDING.SIGN_UP.PRIVACY),
            })}
          </Text>
        </Pressable>
      ) : null}
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
