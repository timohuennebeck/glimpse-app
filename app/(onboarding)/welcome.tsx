import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button, Screen, StarIcon, Text } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { ART } from '@/shared/lib/fixtures';

/**
 * Screen `00 Welcome`.
 *
 * The headline is the product's whole promise, so it leads: a look, only if you
 * give one back. The hero shows one open and one frosted photo side by side.
 */
export default function WelcomeScreen() {
  return (
    <Screen
      scroll
      bottomInset={spacing.contentBottom}
      gutter={spacing.gutterWide}
      background="transparent"
      // Full-bleed: as a child it would be clipped to the padded content box
      // and leave a white band above the status bar.
      backdrop={
        <LinearGradient
          colors={['#E9DFFB', '#EEE6FC', '#F7F3FE', '#FFFFFF']}
          locations={[0, 0.32, 0.54, 0.66]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <View style={styles.body}>
        <Image source={ART.welcomeHero} style={styles.hero} contentFit="contain" />

        <Text variant="displayLg" color={colors.ink} center style={styles.title}>
          {t('onboarding.welcome.title')}
        </Text>
        <Text variant="bodyMd" color={colors.mutedViolet} center style={styles.subtitle}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.rating}>
          <View style={styles.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} size={16} />
            ))}
          </View>
          <Text variant="bodyXs" color={colors.ink} style={styles.ratingText}>
            {t('onboarding.welcome.rating')}
          </Text>
          <Text variant="meta" color={colors.mutedLilac}>
            {t('onboarding.welcome.ratingMeta')}
          </Text>
        </View>

        <Button
          label={t('onboarding.welcome.cta')}
          size="xl"
          onPress={() => router.push('/(onboarding)/name')}
        />

        <Text variant="body" color={colors.ink} center>
          {t('onboarding.welcome.hasAccount')}{' '}
          <Text
            variant="body"
            color={colors.ink}
            style={styles.link}
            onPress={() => router.push('/(onboarding)/details')}
          >
            {t('onboarding.welcome.signIn')}
          </Text>
        </Text>

        <View style={styles.legal}>
          <Text variant="subtitle" color={colors.mutedLilac}>
            {t('onboarding.welcome.legalPrivacy')}
          </Text>
          <Text variant="subtitle" color={colors.mutedLilac}>
            ·
          </Text>
          <Text variant="subtitle" color={colors.mutedLilac}>
            {t('onboarding.welcome.legalTerms')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center' },
  hero: { width: 348, height: 300, marginTop: 6 },
  title: { marginTop: 18 },
  subtitle: { marginTop: 14 },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 22, alignItems: 'center' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stars: { flexDirection: 'row', gap: 2 },
  ratingText: { fontWeight: '600' },
  link: { fontWeight: '600' },
  legal: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
