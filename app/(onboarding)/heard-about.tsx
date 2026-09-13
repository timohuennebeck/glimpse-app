import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, CheckIcon, CloseIcon, GlassButton, Screen, Text } from '@/shared/ui';
import { colors, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import {
  AppStoreChannelIcon,
  FriendChannelIcon,
  InstagramChannelIcon,
  OtherChannelIcon,
  SearchChannelIcon,
  TiktokChannelIcon,
  YoutubeChannelIcon,
} from '@/features/onboarding/components/ChannelIcons';

/**
 * Screen `12 Where did you hear`.
 *
 * The answer is stored on `profiles.heard_about`. Per the positioning note, the
 * number that matters is invites-per-install, so this is attribution input, not
 * a vanity question.
 */
export default function HeardAboutScreen() {
  const [choice, setChoice] = useState<string | null>('tiktok');

  const options = [
    { key: 'friend', icon: <FriendChannelIcon /> },
    { key: 'instagram', icon: <InstagramChannelIcon /> },
    { key: 'tiktok', icon: <TiktokChannelIcon /> },
    { key: 'appStore', icon: <AppStoreChannelIcon /> },
    { key: 'youtube', icon: <YoutubeChannelIcon /> },
    { key: 'search', icon: <SearchChannelIcon /> },
    { key: 'other', icon: <OtherChannelIcon /> },
  ];

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.topRow}>
        <GlassButton size={32} onPress={() => router.back()}>
          <CloseIcon size={11} />
        </GlassButton>
      </View>

      <Text variant="display" color={colors.ink} style={styles.title}>
        {t('onboarding.heardAbout.title')}
      </Text>
      <Text variant="bodySm" color={colors.purpleMuted} style={styles.subtitle}>
        {t('onboarding.heardAbout.subtitle')}
      </Text>

      <View style={styles.list}>
        {options.map((option) => {
          const selected = choice === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => setChoice(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View style={styles.iconCircle}>{option.icon}</View>
              <Text
                variant="body"
                color={colors.inkBody}
                style={[styles.label, selected && styles.labelSelected]}
              >
                {t(`onboarding.heardAbout.options.${option.key}`)}
              </Text>
              <View style={[styles.radio, selected && styles.radioOn]}>
                {selected ? <CheckIcon size={12} strokeWidth={2.6} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.heardAbout.cta')}
          disabled={!choice}
          onPress={() => router.replace('/(onboarding)/thank-you')}
        />
        <Text
          variant="buttonSm"
          color={colors.inkSoft}
          center
          onPress={() => router.replace('/(onboarding)/thank-you')}
        >
          {t('onboarding.heardAbout.skip')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', height: 32 },
  title: { marginTop: 26 },
  subtitle: { marginTop: 10 },
  list: { marginTop: 22, gap: 8 },
  row: {
    height: 60,
    borderRadius: radius.thumbSm,
    borderWidth: 1.6,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 12,
    paddingRight: 18,
  },
  rowSelected: { borderWidth: 2, borderColor: colors.purple, backgroundColor: colors.surfaceVioletTint },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceVioletDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontWeight: '500' },
  labelSelected: { fontWeight: '600' },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.8,
    borderColor: colors.swatchGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.purpleDeep, borderColor: colors.purpleDeep },
  footer: { marginTop: 'auto', paddingTop: 28, gap: 22 },
});
