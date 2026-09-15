import { View } from 'react-native';
import { router } from 'expo-router';
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
import { INVITE } from '@/shared/i18n/keys';
import { relativeTime } from '@/shared/lib/format';
import { AVATARS, PHOTOS } from '@/shared/lib/fixtures';
/**
 * Screen `E Einladung annehmen · Deeplink`.
 *
 * The growth loop's front door: someone has sent you a moment before you have an
 * account. The photo is shown frosted — the rule applies before signup too,
 * which is what makes the invite worth opening.
 *
 * Reached via the `glimpse://invite/<token>` scheme and the matching universal
 * link; the token is the capability (see the `invites` table). Until the
 * `invites` lookup is wired, the screen renders the fixture moment.
 */
export default function InviteScreen() {
  const sentAt = new Date(Date.now() - 4 * 60_000).toISOString();

  return (
    <Screen
      footer={
        <View className="items-center gap-5">
          <Button
            label={t(INVITE.CTA)}
            size="lg"
            icon={<CameraIcon size={21} lensColor={colors.ink} />}
            onPress={() => router.push('/camera')}
          />
          <Text
            variant="buttonSm"
            className="text-center text-ink-soft"
            accessibilityRole="link"
            onPress={() => router.replace('/(onboarding)/welcome')}
          >
            {t(INVITE.SECONDARY)}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow onPress={() => router.back()} />

      <View className="mt-[26px] items-center gap-3.5">
        <Avatar source={AVATARS.mia} size={76} ring="halo" />
        <Text variant="headlineSm" className="text-center text-ink">
          {t(INVITE.TITLE, { name: 'Mia' })}
        </Text>
        <Text variant="bodySm" className="max-w-[280px] text-center text-muted">
          {t(INVITE.BODY)}
        </Text>
      </View>

      <LockedImage
        source={PHOTOS.momentOpen}
        radius={radius.lg}
        puckSize={62}
        className="mt-6 aspect-[4/5] w-full"
      >
        <View className="absolute bottom-[18px] left-[18px] right-[18px] gap-1">
          <Text variant="meta" className="text-[rgba(255,255,255,.78)]">
            {relativeTime(sentAt)}
          </Text>
        </View>
      </LockedImage>
    </Screen>
  );
}
