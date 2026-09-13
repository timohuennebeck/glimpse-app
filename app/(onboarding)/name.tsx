import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { radius, spacing } from '@/shared/theme/page-structure';
import { t, tList } from '@/shared/i18n/i18n';
/**
 * Screen `01 Name · 1 of 7`.
 *
 * The mock renders the headline with two inline chips — one filled purple, one
 * grey — where the grey chip is the live name field. Typing fills it in place,
 * which is why this screen does not use the shared OnboardingScreen headline.
 */
export default function NameScreen() {
  const [name, setName] = useState('');
  const suggestions = tList<string>('onboarding.name.suggestions');

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <ProgressHeader step={1} onClose={() => router.back()} />

      <Text variant="headlineChips" color={colors.ink} style={styles.headline}>
        {'Wie sollen dich deine '}
        <Text variant="headlineChips" color={colors.purpleInkAlt} style={styles.chipFilled}>
          {` ${t('onboarding.name.friendsChip')} `}
        </Text>
        {' nennen, '}
        <Text variant="headlineChips" color={colors.dashedIdle} style={styles.chipIdle}>
          {` ${name || t('onboarding.name.placeholderChip')} `}
        </Text>
        {'?'}
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
          <Pressable key={s} style={styles.suggestion} onPress={() => setName(s.replace('+ ', ''))}>
            <Text variant="bodyXs" color="#6F6A80">
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.name.cta')}
          onPress={() => router.push('/(onboarding)/camera')}
          disabled={name.trim().length === 0}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: { marginTop: 34 },
  chipFilled: { backgroundColor: colors.surfaceVioletChip, borderRadius: radius.tile },
  chipIdle: { backgroundColor: colors.surfaceViolet, borderRadius: radius.tile },
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
  footer: { marginTop: 'auto', paddingTop: 28 },
});
