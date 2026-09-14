import { StyleSheet, View } from 'react-native';
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
        <View style={styles.footer}>
          <Button
            label={t('invite.cta')}
            size="lg"
            icon={<CameraIcon size={21} lensColor={colors.ink} />}
            onPress={() => router.push('/camera')}
          />
          <Text
            variant="buttonSm"
            color={colors.inkSoft}
            center
            accessibilityRole="link"
            onPress={() => router.replace('/(onboarding)/welcome')}
          >
            {t('invite.secondary')}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow onPress={() => router.back()} />

      <View style={styles.intro}>
        <Avatar source={AVATARS.mia} size={76} ring="halo" />
        <Text variant="headlineSm" color={colors.ink} center>
          {t('invite.title', { name: 'Mia' })}
        </Text>
        <Text variant="bodySm" color={colors.muted} center style={styles.body}>
          {t('invite.body')}
        </Text>
      </View>

      <LockedImage source={PHOTOS.momentOpen} radius={radius.lg} puckSize={62} style={styles.preview}>
        <View style={styles.previewMeta}>
          <Text variant="meta" color="rgba(255,255,255,.78)">
            {relativeTime(sentAt)}
          </Text>
        </View>
      </LockedImage>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', gap: 14, marginTop: 26 },
  body: { maxWidth: 280 },
  preview: { width: '100%', aspectRatio: 4 / 5, marginTop: 24 },
  previewMeta: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 4 },
  footer: { gap: 20, alignItems: 'center' },
});
