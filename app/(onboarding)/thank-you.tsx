import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button, CloseIcon, GlassButton, LockedIcon, Screen, Text } from '@/shared/ui';
import { alpha, colors, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { ART, PHOTOS } from '@/shared/lib/fixtures';

type Variant = 'a' | 'b';

/**
 * Screens `11a Welcome · variant A (mascot)` and `11b · variant B (video)`.
 *
 * The mock labels these an A/B test, so both are built and the variant is a
 * single value — swap it for your experiment flag when one exists.
 */
export default function ThankYouScreen() {
  const [variant, setVariant] = useState<Variant>('a');
  const copy = variant === 'a' ? 'onboarding.thankYou.variantA' : 'onboarding.thankYou.variantB';

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.replace('/(app)/feed')}>
          <CloseIcon size={11} />
        </GlassButton>

        {/* Variant switch — stands in for the experiment flag. */}
        <View style={styles.segment}>
          {(['a', 'b'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setVariant(v)}
              style={[styles.segmentItem, variant === v && styles.segmentItemActive]}
            >
              <Text
                variant="captionXs"
                color={variant === v ? colors.purpleDeep : colors.mutedLilac}
                style={styles.segmentLabel}
              >
                {v.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text variant="display" color={colors.ink} center style={styles.title}>
        {t(`${copy}.title`)}
      </Text>
      <Text variant="bodyMd" color={colors.purpleMuted} center style={styles.subtitle}>
        {t(`${copy}.subtitle`)}
      </Text>

      {variant === 'a' ? (
        <>
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
        </>
      ) : (
        <View style={styles.video}>
          <Image source={PHOTOS.videoStill} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,.62)']}
            style={styles.videoScrim}
          />
          <View style={styles.playButton}>
            <LockedIcon size={26} />
          </View>
          <View style={styles.videoFooter}>
            <Text variant="bodyXs" color="rgba(255,255,255,.88)">
              {t('onboarding.thankYou.variantB.caption')}
            </Text>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>
      )}

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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLilac,
    borderRadius: radius.pill,
    padding: 3,
    gap: 3,
  },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  segmentItemActive: { backgroundColor: colors.white },
  segmentLabel: { fontWeight: '600' },
  title: { marginTop: 40 },
  subtitle: { marginTop: 12 },
  stage: { marginTop: 34, height: 280, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  mascot: { width: 250, height: 250 },
  footnote: { marginTop: 44 },
  video: {
    marginTop: 28,
    width: '100%',
    aspectRatio: 9 / 12.2,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.widgetMid,
  },
  videoScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%' },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -37,
    marginLeft: -37,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: alpha.onDarkFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoFooter: { position: 'absolute', left: 20, right: 20, bottom: 22, gap: 10 },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,.22)',
    overflow: 'hidden',
  },
  progressFill: { width: '38%', height: '100%', borderRadius: radius.pill, backgroundColor: '#B79CFF' },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 24 },
});
