import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ProgressHeader, Screen, Text } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme';

type OnboardingScreenProps = {
  /** Omit to hide the progress header (welcome, reviews, paywall). */
  step?: number;
  total?: number;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  /** Primary CTA. */
  cta: string;
  onNext: () => void;
  /** Secondary text action under the CTA ("Später", "Überspringen"). */
  secondary?: string;
  onSecondary?: () => void;
  ctaIcon?: ReactNode;
  ctaDisabled?: boolean;
  background?: string;
  gutter?: number;
  scroll?: boolean;
  /** Extra content rendered between the CTA and the bottom edge. */
  footnote?: string;
};

/**
 * Shared chrome for the onboarding steps: progress header at the top, a
 * headline/subtitle block, free-form middle, and a pinned CTA stack. Every
 * `N of 7` artboard in the mock follows this skeleton.
 */
export function OnboardingScreen({
  step,
  total = 7,
  title,
  subtitle,
  children,
  cta,
  onNext,
  secondary,
  onSecondary,
  ctaIcon,
  ctaDisabled,
  background = colors.white,
  gutter = spacing.gutter,
  scroll = true,
  footnote,
}: OnboardingScreenProps) {
  return (
    <Screen background={background} gutter={gutter} scroll={scroll} bottomInset={spacing.contentBottom}>
      {step ? <ProgressHeader step={step} total={total} onClose={() => router.back()} /> : null}

      {title ? (
        <Text variant="display" color={colors.ink} style={styles.title}>
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text variant="bodySm" color={colors.muted} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}

      {children}

      {footnote ? (
        <Text variant="bodyXs" color={colors.muted} center style={styles.footnote}>
          {footnote}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button label={cta} onPress={onNext} size="lg" icon={ctaIcon} disabled={ctaDisabled} />
        {secondary ? (
          <Text variant="buttonSm" color={colors.inkSoft} center onPress={onSecondary}>
            {secondary}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 26 },
  subtitle: { marginTop: 12 },
  footnote: { marginTop: 20 },
  footer: { marginTop: 'auto', paddingTop: 28, gap: 22, alignItems: 'stretch' },
});
