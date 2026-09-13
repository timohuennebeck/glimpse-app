import { StyleSheet, View } from 'react-native';
import { Button, Avatar, Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { AVATARS } from '@/shared/lib/fixtures';

/**
 * The stacked-avatars card from screen `05a` — shown when contacts permission
 * has not been granted, so there is no list to render yet.
 */
export function ContactsInvite({ onPress }: { onPress?: () => void }) {
  const faces = [AVATARS.mia, AVATARS.ben, AVATARS.noah];

  return (
    <View style={styles.card}>
      <View style={styles.stack}>
        {faces.map((face, i) => (
          <View key={i} style={i > 0 ? styles.overlap : undefined}>
            <Avatar source={face} size={64} style={styles.face} />
          </View>
        ))}
        <View style={[styles.overlap, styles.more]}>
          <Text variant="rowTitle" color={colors.white}>
            +2
          </Text>
        </View>
      </View>

      <Text variant="cardTitleLg" color={colors.ink} center>
        {t('onboarding.friends.inviteTitle')}
      </Text>
      <Text variant="subtitle" color={colors.purpleMuted} center style={styles.body}>
        {t('onboarding.friends.inviteBody')}
      </Text>

      <Button
        label={t('onboarding.friends.inviteCta')}
        variant="purple"
        size="sm"
        onPress={onPress}
        style={styles.cta}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 22,
    backgroundColor: colors.surfaceVioletDeep,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    gap: 16,
  },
  stack: { flexDirection: 'row', alignItems: 'center' },
  overlap: { marginLeft: -16 },
  face: { borderWidth: 3, borderColor: colors.white, borderRadius: 32 },
  more: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { lineHeight: 14.5 * 1.4 },
  cta: { width: '100%' },
});
