import { ReactNode } from 'react';
import { router } from 'expo-router';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
interface OnboardingScreenProps {
  /** 1-based index in the 7-step flow. */
  step: number;
  title: string;
  subtitle: string;
  children?: ReactNode;
  /** Primary CTA. */
  cta: string;
  onNext: () => void;
  /** Secondary text action under the CTA ("Später", "Überspringen"). */
  secondary?: string;
  onSecondary?: () => void;
  ctaIcon?: ReactNode;
  /** Extra copy rendered between the content and the CTA. */
  footnote?: string;
}

/**
 * Shared chrome for the onboarding steps: progress header at the top, a
 * headline/subtitle block, free-form middle, and the CTA stack pinned in the
 * screen's footer slot. Every
 * `N of 7` artboard in the mock follows this skeleton.
 */
export function OnboardingScreen({
  step,
  title,
  subtitle,
  children,
  cta,
  onNext,
  secondary,
  onSecondary,
  ctaIcon,
  footnote,
}: OnboardingScreenProps) {
  return (
    <Screen
      scroll
      footer={
        <CtaFooter
          label={cta}
          onPress={onNext}
          icon={ctaIcon}
          secondary={secondary}
          onSecondary={onSecondary}
        />
      }
    >
      <ProgressHeader step={step} onClose={() => router.back()} />

      <Text variant="display" className="mt-[26px] text-ink">
        {title}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {subtitle}
      </Text>

      {children}

      {footnote ? (
        <Text variant="bodyXs" className="mt-5 text-center text-muted">
          {footnote}
        </Text>
      ) : null}
    </Screen>
  );
}
