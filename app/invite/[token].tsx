import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar,
  Button,
  CameraIcon,
  CloseIcon,
  GlassButton,
  LockedImage,
  Screen,
  Text,
} from '@/shared/ui';
import { colors, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
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
 * link; the token is the capability (see the `invites` table).
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const sentAt = new Date(Date.now() - 4 * 60_000).toISOString();

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.back()}>
          <CloseIcon size={11} />
        </GlassButton>
      </View>

      <View style={styles.intro}>
        <Avatar source={AVATARS.mia} size={76} ring="halo" />
        <Text variant="headlineSm" color={colors.ink} center>
          {t('invite.title', { name: 'Mia' })}
        </Text>
        <Text variant="bodySm" color={colors.muted} center style={styles.body}>
          {t('invite.body')}
        </Text>
      </View>

      <LockedImage source={PHOTOS.momentOpen} radius={radius.lg} blur={8} puckSize={62} style={styles.preview}>
        <View style={styles.previewMeta}>
          <Text variant="meta" color="rgba(255,255,255,.78)">
            {relativeTime(sentAt)}
          </Text>
        </View>
      </LockedImage>

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
          onPress={() => router.replace('/(onboarding)/welcome')}
        >
          {t('invite.secondary')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  intro: { alignItems: 'center', gap: 14, marginTop: 26 },
  body: { maxWidth: 280 },
  preview: { width: '100%', aspectRatio: 4 / 5, marginTop: 24 },
  previewMeta: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 4 },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 20, alignItems: 'center' },
});
