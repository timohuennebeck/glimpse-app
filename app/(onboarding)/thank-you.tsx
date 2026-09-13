import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button, CloseIcon, GlassButton, Screen, Text } from '@/shared/ui';
import { colors, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { ART } from '@/shared/lib/fixtures';

/**
 * Screen `11a Welcome · variant A (mascot)`.
 *
 * The mock also contains a variant B built around a video still. It is not
 * shipped: without an experiment framework an in-app switcher is just a control
 * users can trip over. The copy for it is still in the locale file under
 * `onboarding.thankYou.variantB`, so reinstating it is a routing change.
 */
export default function ThankYouScreen() {
  const copy = 'onboarding.thankYou.variantA';

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.replace('/(app)/feed')}>
          <CloseIcon size={11} />
        </GlassButton>

      </View>

      <Text variant="display" color={colors.ink} center style={styles.title}>
        {t(`${copy}.title`)}
      </Text>
      <Text variant="bodyMd" color={colors.purpleMuted} center style={styles.subtitle}>
        {t(`${copy}.subtitle`)}
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
        <Button label={t(`${copy}.cta`)} onPress={() => router.replace('/camera')} />
        <Text
          variant="buttonSm"
          color={colors.inkSoft}
          center
          onPress={() => router.replace('/(app)/feed')}
        >
          {t(`${copy}.skip`)}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  title: { marginTop: 40 },
  subtitle: { marginTop: 12 },
  stage: { marginTop: 34, height: 280, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  mascot: { width: 250, height: 250 },
  footnote: { marginTop: 44 },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 24 },
});
