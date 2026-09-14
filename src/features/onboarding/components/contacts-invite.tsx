import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/ui/button';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { AVATARS } from '@/shared/lib/fixtures';
interface ContactsInviteProps {
  onPress?: () => void;
}

// Illustrative: three faces shown, "+2" more implied. Fixture data, not a count
// of the user's contacts (contacts import is not built).
const FACES = [AVATARS.mia, AVATARS.ben, AVATARS.noah];
const HIDDEN_FACES = 2;

/**
 * The stacked-avatars card from screen `05a` — shown when contacts permission
 * has not been granted, so there is no list to render yet.
 */
export function ContactsInvite({ onPress }: ContactsInviteProps) {

  return (
    <View style={styles.card}>
      <View style={styles.stack}>
        {FACES.map((face, i) => (
          <View key={i} style={i > 0 ? styles.overlap : undefined}>
            <Avatar source={face} size={64} style={styles.face} />
          </View>
        ))}
        <View style={[styles.overlap, styles.more]}>
          <Text variant="rowTitle" color={colors.white}>
            {t('onboarding.friends.moreCount', { count: HIDDEN_FACES })}
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
