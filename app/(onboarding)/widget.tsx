import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';
import { HomescreenPreview } from '@/features/widget/components/HomescreenPreview';

/**
 * Screens `07 Widget · 7 of 7` and `07b Widget · large layout`.
 *
 * The mock presents the two widget sizes as alternatives; both are shown here
 * behind a segmented control so the step doubles as a size picker.
 */
export default function WidgetScreen() {
  const [size, setSize] = useState<'small' | 'large'>('small');

  return (
    <OnboardingScreen
      step={7}
      title={t('onboarding.widget.title')}
      subtitle={t('onboarding.widget.subtitle')}
      cta={t('onboarding.widget.cta')}
      onNext={() => router.push('/(onboarding)/reviews')}
      secondary={t('onboarding.widget.skip')}
      onSecondary={() => router.push('/(onboarding)/reviews')}
      footnote={t('onboarding.widget.note')}
    >
      <HomescreenPreview size={size} />

      <View style={styles.segment}>
        {(['small', 'large'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setSize(option)}
            style={[styles.segmentItem, size === option && styles.segmentItemActive]}
          >
            <Text
              variant="metaSm"
              color={size === option ? colors.purpleDeep : colors.mutedLilac}
              style={styles.segmentLabel}
            >
              {option === 'small' ? '2 × 2' : '4 × 2'}
            </Text>
          </Pressable>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  segment: {
    marginTop: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: colors.surfaceLilac,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill },
  segmentItemActive: { backgroundColor: colors.white },
  segmentLabel: { fontWeight: '600' },
});
