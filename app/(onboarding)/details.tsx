import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { errorMessage } from '@/shared/lib/error-message';
import { signIn, signUp } from '@/features/auth/data/auth-api';
import { uploadAvatar } from '@/features/profile/data/profile-api';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
import { claimInvite } from '@/features/invites/data/invites-api';
import { usePendingInvite } from '@/features/invites/hooks/use-pending-invite';
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

  const queryClient = useQueryClient();

  /**
   * The invite that brought them here, spent as soon as there is a session —
   * from either branch, because whoever opened the link may well already have
   * an account and reach for "Sign in".
   *
   * Deliberately non-fatal: a claim that fails must not strand somebody outside
   * an account they just signed into. The token survives a failure, so
   * re-opening the link is the retry.
   */
  async function spendPendingInvite() {
    const pendingToken = usePendingInvite.getState().token;
    if (!pendingToken) return;
    try {
      await claimInvite(pendingToken);
      usePendingInvite.reset();
      // prefetchForUser fires the moment the session flips, so the friends
      // list can already be cached — and empty — by the time the claim lands.
      await queryClient.invalidateQueries();
    } catch {
      // Keeping the token is the point: the link still works.
    }
  }

  const submit = useMutation({
    mutationFn: async (): Promise<'signed-in' | 'confirmation-required' | 'already-registered'> => {
      if (!signingUp) {
        await signIn({ email, password });
        await spendPendingInvite();
        return 'signed-in';
      }
      const outcome = await signUp({ email, password, firstName: draft.firstName, locale: getLocale() });
      if (outcome.kind === 'signed-in') {
        // The account exists now, so the picture finally has somewhere to go.
        if (draft.avatar) await uploadAvatar(draft.avatar);
        // And the invite that brought them here can be spent.
        await spendPendingInvite();
        useOnboardingDraft.reset();
      }
      return outcome.kind;
    },
    onSuccess: (kind) => {
      if (kind !== 'signed-in') {
        setNotice(
          t(
            kind === 'already-registered'
              ? 'onboarding.details.errors.alreadyRegistered'
              : 'onboarding.details.errors.confirmationRequired',
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

  // `as const` keeps these literal dot paths rather than widening to string,
  // which `t()` does not accept.
  const copy = signingUp
    ? ({
        title: 'onboarding.details.title',
        subtitle: 'onboarding.details.subtitle',
        cta: 'onboarding.details.cta',
        prompt: 'onboarding.details.hasAccount',
        action: 'onboarding.details.signIn',
      } as const)
    : ({
        title: 'onboarding.details.signInTitle',
        subtitle: 'onboarding.details.signInSubtitle',
        cta: 'onboarding.details.signInCta',
        prompt: 'onboarding.details.noAccount',
        action: 'onboarding.details.createAccount',
      } as const);

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
              autoComplete={signingUp ? 'new-password' : 'current-password'}
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
                {t('onboarding.details.passwordHint')}
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
            {t('onboarding.details.consent', {
              terms: t('onboarding.signUp.terms'),
              privacy: t('onboarding.signUp.privacy'),
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
