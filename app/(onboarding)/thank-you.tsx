import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `11a Welcome · variant A (mascot)`.
 *
 * The mock also contains a variant B built around a video still. It is not
 * shipped: without an experiment framework an in-app switcher is just a control
 * users can trip over.
 */
export default function ThankYouScreen() {
  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <CloseRow style={styles.topRow} onPress={() => router.replace('/(app)/feed')} />

      <Text variant="display" color={colors.ink} center style={styles.title}>
        {t('onboarding.thankYou.variantA.title')}
      </Text>
      <Text variant="bodyMd" color={colors.purpleMuted} center style={styles.subtitle}>
        {t('onboarding.thankYou.variantA.subtitle')}
      </Text>

      <View style={styles.stage}>
        <LinearGradient
          colors={['rgba(180,140,255,.42)', 'rgba(180,140,255,.14)', 'rgba(180,140,255,0)']}
          locations={[0, 0.45, 0.72]}
          style={styles.halo}
        />
        <Image source={ART.mascotUnlock} style={styles.mascot} contentFit="contain" />
      </View>
      <Text variant="bodyMd" color={colors.purpleMuted} center style={styles.footnote}>
        {t('onboarding.thankYou.variantA.footnote')}
      </Text>

      <View style={styles.footer}>
        <Button label={t('onboarding.thankYou.variantA.cta')} onPress={() => router.replace('/camera')} />
        <Text
          variant="buttonSm"
          color={colors.inkSoft}
          center
          onPress={() => router.replace('/(app)/feed')}
        >
          {t('onboarding.thankYou.variantA.skip')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { height: 36 },
  title: { marginTop: 40 },
  subtitle: { marginTop: 12 },
  stage: { marginTop: 34, height: 280, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  mascot: { width: 250, height: 250 },
  footnote: { marginTop: 44 },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 24 },
});
