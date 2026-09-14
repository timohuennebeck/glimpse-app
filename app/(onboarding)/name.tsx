import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily, type as typeScale } from '@/shared/theme/fonts';
import { radius, spacing } from '@/shared/theme/page-structure';
import { t, tList } from '@/shared/i18n/i18n';
/**
 * Screen `01 Name · 1 of 7`.
 *
 * The mock renders the headline with two inline chips — one filled purple, one
 * grey — where the grey chip is the live name field. Typing fills it in place,
 * which is why this screen does not use the shared OnboardingScreen headline.
 */
/**
 * The headline has two inline chips in the middle of a translated sentence.
 * The locale string carries `%{friends}` and `%{placeholder}`; those are
 * interpolated with sentinel markers, then the string is split on them so the
 * chips render as real components at the right spot in either language.
 */
const FRIENDS_SLOT = '\u2063friends\u2063';
const NAME_SLOT = '\u2063name\u2063';
const SLOT_SPLIT = /(\u2063friends\u2063|\u2063name\u2063)/;

export default function NameScreen() {
  const [name, setName] = useState('');
  const suggestions = tList<string>('onboarding.name.suggestions');
  const headlineParts = t('onboarding.name.title', { friends: FRIENDS_SLOT, placeholder: NAME_SLOT }).split(SLOT_SPLIT);

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <ProgressHeader step={1} onClose={() => router.back()} />

      {/* The chips are inline Views: a borderRadius on a nested Text is ignored
          by both platforms, which rendered them as hard-cornered blocks. */}
      <Text variant="headlineChips" color={colors.ink} style={styles.headline}>
        {headlineParts.map((part, i) =>
          part === FRIENDS_SLOT ? (
            <View key={i} style={[styles.chip, styles.chipFilled]}>
              <Text variant="headlineChips" color={colors.purpleInkAlt} style={styles.chipText}>
                {t('onboarding.name.friendsChip')}
              </Text>
            </View>
          ) : part === NAME_SLOT ? (
            <View key={i} style={[styles.chip, styles.chipIdle]}>
              <Text variant="headlineChips" color={colors.dashedIdle} style={styles.chipText}>
                {name || t('onboarding.name.placeholderChip')}
              </Text>
            </View>
          ) : (
            part
          ),
        )}
      </Text>

      <Text variant="bodySm" color={colors.muted} style={styles.subtitle}>
        {t('onboarding.name.subtitle')}
      </Text>

      {/* Visually hidden field: the chip above is the rendered value. */}
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.name.placeholderChip')}
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        autoFocus
        maxLength={24}
        returnKeyType="done"
      />

      <View style={styles.chips}>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            style={styles.suggestion}
            onPress={() => setName(s.replace('+ ', ''))}
            accessibilityRole="button"
            accessibilityLabel={s.replace('+ ', '')}
          >
            <Text variant="bodyXs" color={colors.mutedChip}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <CtaFooter
        label={t('onboarding.name.cta')}
        onPress={() => router.push('/(onboarding)/camera')}
        disabled={name.trim().length === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { marginTop: 34 },
  chip: { borderRadius: radius.tile, paddingHorizontal: 10, paddingVertical: 2 },
  chipFilled: { backgroundColor: colors.surfaceVioletChip },
  chipIdle: { backgroundColor: colors.surfaceViolet },
  // Tighter than the headline's loose leading, so the pill hugs the word.
  chipText: { lineHeight: Math.round(typeScale.headlineChips.fontSize * 1.2) },
  subtitle: { marginTop: 18 },
  input: {
    marginTop: 24,
    height: 62,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    fontSize: 17.5,
    color: colors.inkBody,
    fontFamily: fontFamily.regular,
  },
  chips: { marginTop: 26, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  suggestion: {
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
