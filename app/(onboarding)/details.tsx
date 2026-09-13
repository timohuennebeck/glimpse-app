import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { CheckIcon, EnvelopeFieldIcon, EyeIcon } from '@/shared/ui/icons';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { radius, spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
/** Screen `04a Your details · 4 of 7` — email + password, with a strength meter. */
export default function DetailsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(true);

  const strength = passwordStrength(password);
  const valid = email.includes('@') && password.length >= 9 && consent;

  return (
    <Screen
      background={colors.surfaceAlt}
      gutter={spacing.gutterWide}
      scroll
      bottomInset={spacing.contentBottom}
    >
      <ProgressHeader step={4} onClose={() => router.back()} />

      <Text variant="display" color={colors.ink} style={styles.title}>
        {t('onboarding.details.title')}
      </Text>
      <Text variant="bodySm" color={colors.muted} style={styles.subtitle}>
        {t('onboarding.details.subtitle')}
      </Text>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Text variant="meta" color={colors.muted}>
            {t('onboarding.details.emailLabel')}
          </Text>
          <View style={[styles.input, email.length > 0 && styles.inputActive]}>
            <EnvelopeFieldIcon size={21} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('onboarding.details.emailPlaceholder')}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.inputText}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="meta" color={colors.muted}>
            {t('onboarding.details.passwordLabel')}
          </Text>
          <View style={styles.inputMuted}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoComplete="new-password"
              style={[styles.inputText, styles.flex]}
            />
            <Pressable onPress={() => setReveal((r) => !r)} hitSlop={8}>
              <EyeIcon size={21} />
            </Pressable>
          </View>

          <View style={styles.meter}>
            <View style={styles.meterBars}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.meterBar, i < strength && styles.meterBarOn]} />
              ))}
            </View>
            <Text variant="metaSm" color={colors.muted}>
              {t('onboarding.details.passwordHint')}
            </Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.consent} onPress={() => setConsent((c) => !c)}>
        <View style={[styles.checkbox, !consent && styles.checkboxOff]}>
          {consent ? <CheckIcon size={14} strokeWidth={2.2} /> : null}
        </View>
        <Text variant="subtitle" color={colors.mutedLilac} style={styles.flex}>
          {t('onboarding.details.consent', {
            terms: t('onboarding.signUp.terms'),
            privacy: t('onboarding.signUp.privacy'),
          })}
        </Text>
      </Pressable>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.details.cta')}
          size="xl"
          disabled={!valid}
          onPress={() => router.push('/(onboarding)/friends')}
        />
        <Text variant="subtitle" color={colors.mutedLilac} center>
          {t('onboarding.details.hasAccount')}{' '}
          <Text variant="subtitle" color={colors.inkBody} style={styles.link}>
            {t('onboarding.details.signIn')}
          </Text>
        </Text>
      </View>
    </Screen>
  );
}

/** 0-4, mapped onto the four segments the mock draws. */
function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 9) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { marginTop: 22 },
  subtitle: { marginTop: 12 },
  fields: { marginTop: 28, gap: 18 },
  field: { gap: 8 },
  input: {
    height: 62,
    borderRadius: radius.input,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  inputActive: { borderColor: colors.purple },
  inputMuted: {
    height: 62,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceVioletWarm,
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  inputText: {
    flex: 1,
    fontSize: 17.5,
    color: colors.inkBody,
    fontFamily: fontFamily.regular,
    padding: 0,
  },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 2 },
  meterBars: { flexDirection: 'row', gap: 4 },
  meterBar: { width: 34, height: 5, borderRadius: 3, backgroundColor: colors.borderLilac },
  meterBarOn: { backgroundColor: colors.purple },
  consent: { marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOff: { backgroundColor: 'transparent', borderWidth: 1.8, borderColor: colors.swatchGrey },
  footer: { marginTop: 'auto', paddingTop: 32, gap: 18 },
  link: { fontWeight: '600' },
});
