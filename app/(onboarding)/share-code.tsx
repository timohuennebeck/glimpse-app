import { Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { CopyIcon, MoreIcon } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { BloomBackdrop } from '@/features/onboarding/components/bloom-backdrop';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `10b Share your code · after purchase`.
 *
 * The code is the growth loop's second surface: Plus is worth more when the
 * people you trade with also have it, so giving it away is the point.
 */
export default function ShareCodeScreen() {
  const code = 'G7K-4PZ';

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={t('referral.share.cta')}
            size="md"
            onPress={() => router.push('/(onboarding)/heard-about')}
          />
          <Text
            variant="bodyXs"
            color={colors.purpleMuted}
            center
            accessibilityRole="link"
            onPress={() => router.push('/(onboarding)/heard-about')}
          >
            {t('referral.share.later')}
          </Text>
        </View>
      }
      scroll backdrop={<BloomBackdrop />}>
      <CloseRow onPress={() => router.push('/(onboarding)/heard-about')} />

      <Image source={ART.mascotHeart} style={styles.mascot} contentFit="contain" />

      <Text variant="eyebrowAccent" color={colors.purpleDeep} style={styles.eyebrow}>
        {t('referral.share.eyebrow')}
      </Text>
      <Text variant="displayLg" color={colors.ink} style={styles.title}>
        {t('referral.share.title')}
      </Text>
      <Text variant="body" color={colors.purpleMuted} style={styles.subtitle}>
        {t('referral.share.subtitle')}
      </Text>

      <View style={styles.codeCard}>
        <Text variant="eyebrowAccent" color={colors.purpleDeep}>
          {t('referral.share.codeLabel')}
        </Text>
        <Text style={styles.code}>{`${code} `}</Text>
        <Text variant="meta" color={colors.purpleMuted}>
          {t('referral.share.codeNote')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label={t('referral.share.copy')}
          variant="outline"
          size="xs"
          icon={<CopyIcon size={14} color={colors.inkBody} />}
          style={styles.action}
          onPress={() => void Clipboard.setStringAsync(code)}
        />
        <Button
          label={t('referral.share.share')}
          variant="purple"
          size="xs"
          icon={<MoreIcon size={14} color={colors.white} />}
          style={styles.action}
          onPress={() => void Share.share({ message: code })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mascot: { width: 210, height: 190, alignSelf: 'center', marginTop: -18, marginBottom: -12 },
  eyebrow: { marginTop: 14 },
  title: { marginTop: 6 },
  subtitle: { marginTop: 14 },
  codeCard: {
    marginTop: 32,
    borderWidth: 2,
    borderColor: colors.purple,
    borderRadius: radius.cardSm,
    backgroundColor: colors.surfaceVioletTint,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: 32,
    fontWeight: '600',
    // Without an explicit lineHeight the mono face clips its own ascenders and
    // descenders at this size; the trailing space balances the letterSpacing so
    // the string stays optically centred.
    lineHeight: 42,
    letterSpacing: 32 * 0.16,
    textAlign: 'center',
    color: colors.ink,
  },
  actions: { marginTop: 12, flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
  footer: { gap: 14 },
});
