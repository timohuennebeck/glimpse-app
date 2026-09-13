import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, CloseIcon, GlassButton, Screen, Text } from '@/shared/ui';
import { colors, fontFamily, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';

const LENGTH = 6;

/**
 * Screen `10a Redeem partner code` — six character boxes backed by one hidden
 * field, which is how OTP-style inputs behave correctly with autofill and
 * backspace.
 */
export default function RedeemScreen() {
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const complete = code.length === LENGTH;

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.back()}>
          <CloseIcon size={11} />
        </GlassButton>
      </View>

      <Text variant="eyebrowAccent" color={colors.purpleDeep} style={styles.eyebrow}>
        {t('referral.redeem.eyebrow')}
      </Text>
      <Text variant="displayLg" color={colors.ink} style={styles.title}>
        {t('referral.redeem.title')}
      </Text>
      <Text variant="body" color={colors.purpleMuted} style={styles.subtitle}>
        {t('referral.redeem.subtitle')}
      </Text>

      <Pressable style={styles.boxes} onPress={() => setFocused(true)}>
        {Array.from({ length: LENGTH }).map((_, i) => {
          const char = code[i];
          const isCursor = focused && i === code.length;
          return (
            <View key={i} style={[styles.box, (char || isCursor) && styles.boxActive]}>
              {char ? (
                <Text style={styles.boxChar}>{char}</Text>
              ) : isCursor ? (
                <View style={styles.cursor} />
              ) : null}
            </View>
          );
        })}
      </Pressable>

      {/* Off-screen: the real input driving the boxes above. */}
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={LENGTH}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
      />

      <View style={styles.footer}>
        <Button
          label={t('referral.redeem.cta')}
          size="md"
          disabled={!complete}
          onPress={() => router.push('/(onboarding)/heard-about')}
        />
        <Text variant="bodyXs" color={colors.purpleMuted} center>
          {t('referral.redeem.note')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  eyebrow: { marginTop: 36 },
  title: { marginTop: 6 },
  subtitle: { marginTop: 14 },
  boxes: { marginTop: 36, flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    height: 64,
    borderRadius: radius.chip,
    borderWidth: 1.6,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderWidth: 2, borderColor: colors.purple, backgroundColor: colors.surfaceVioletTint },
  boxChar: { fontFamily: fontFamily.mono, fontSize: 24, fontWeight: '600', color: colors.ink },
  cursor: { width: 2, height: 28, borderRadius: 1, backgroundColor: colors.purpleDeep },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  footer: { marginTop: 'auto', paddingTop: 34, gap: 14 },
});
