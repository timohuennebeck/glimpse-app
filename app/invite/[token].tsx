import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { CameraIcon } from '@/shared/ui/icons';
import { LockedImage } from '@/shared/ui/locked-image';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { INVITE, MOMENT } from '@/shared/i18n/keys';
import { relativeTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
import { claimInvite } from '@/features/invites/data/invites-api';
import { usePendingInvite } from '@/features/invites/hooks/use-pending-invite';
/**
 * Screen `E Einladung annehmen · Deeplink`.
 *
 * Someone has sent you a moment before you have an account. The photo is shown
 * frosted — the rule applies before signup too, which is exactly what makes the
 * invite worth opening.
 *
 * Reached via `glimpse://invite/<token>`; the token is the capability (see the
 * `invites` table). Signed in, opening the link claims it. Signed out, the
 * token waits on the onboarding store until step 4 creates the account.
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const inviteToken = token ?? '';
  const queryClient = useQueryClient();
  const { status } = useSession();
  const pending = usePendingInvite();

  const { data: preview, isPending } = useQuery({
    ...queries.invites.preview(inviteToken),
    enabled: inviteToken.length > 0,
  });

  const claim = useMutation({
    mutationFn: () => claimInvite(inviteToken),
    onSuccess: (result) => {
      if (!result) return;
      // A friendship and possibly a trade appeared; nothing cached knows yet.
      void queryClient.invalidateQueries();
      usePendingInvite.reset();
      // The feed has to be underneath, or closing the camera has nowhere to go.
      router.replace('/(app)/feed');
      if (result.tradeId) router.push({ pathname: '/camera', params: { trade: result.tradeId } });
    },
  });

  const signedIn = status === 'signed-in';
  const { mutate: claimNow, isIdle } = claim;
  useEffect(() => {
    // Claiming is the whole point of opening the link with an account.
    if (signedIn && inviteToken.length > 0 && isIdle) claimNow();
  }, [signedIn, inviteToken, isIdle, claimNow]);

  const dead = (!isPending && !preview) || (claim.isSuccess && claim.data === null);

  /**
   * Leaving an invite means going back to whatever you already had. Every exit
   * used to `replace` to the signed-out Welcome screen, which discards the back
   * stack — a signed-in person who opened a spent link landed on Welcome with
   * no route back to their own feed, recoverable only by relaunching.
   */
  const leave = () => router.replace(signedIn ? '/(app)/feed' : '/(onboarding)/welcome');

  if (dead) {
    return (
      <Screen>
        <CloseRow onPress={leave} />
        <Text variant="bodyMd" className="mt-10 text-center text-muted">
          {t(MOMENT.NOT_FOUND)}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View className="items-center gap-5">
          {claim.error ? (
            <Text variant="subtitle" className="text-center text-purple-deep">
              {errorMessage(claim.error)}
            </Text>
          ) : null}
          <Button
            label={t(INVITE.CTA)}
            size="lg"
            icon={<CameraIcon size={21} lensColor={colors.ink} />}
            loading={claim.isPending}
            onPress={() => {
              // Signed in, the effect above already claims it; this is the
              // retry when that failed. Signed out, the account has to exist
              // before the token can be spent, so it waits here for step 4.
              if (signedIn) {
                claimNow();
                return;
              }
              pending.set({ token: inviteToken });
              router.push('/(onboarding)/name');
            }}
          />
          <Text
            variant="buttonSm"
            className="text-center text-ink-soft"
            accessibilityRole="link"
            onPress={leave}
          >
            {t(INVITE.SECONDARY)}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow onPress={leave} />

      <View className="mt-[26px] items-center gap-3.5">
        <Avatar
          source={preview?.inviterAvatarUrl ?? null}
          name={preview?.inviterName}
          size={76}
          ring="halo"
        />
        <Text variant="headlineSm" className="text-center text-ink">
          {t(INVITE.TITLE, { name: preview?.inviterName ?? '' })}
        </Text>
        <Text variant="bodySm" className="max-w-[280px] text-center text-muted">
          {t(INVITE.BODY)}
        </Text>
      </View>

      {/* An invite with no moment is name and avatar only — there is nothing to
          withhold, just somebody asking you to trade. */}
      {preview?.photo ? (
        <LockedImage
          source={preview.photo}
          radius={radius.lg}
          puckSize={62}
          className="mt-6 aspect-[4/5] w-full"
        >
          <View className="absolute bottom-[18px] left-[18px] right-[18px] gap-1">
            <Text variant="meta" className="text-[rgba(255,255,255,.78)]">
              {relativeTime(preview.createdAt)}
            </Text>
          </View>
        </LockedImage>
      ) : null}
    </Screen>
  );
}
