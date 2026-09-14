import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle } from '@/shared/ui/check-circle';
import { CloseRow } from '@/shared/ui/close-row';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius, spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import type { Translations } from '@/shared/i18n/locales/de';
import { AppStoreChannelIcon, FriendChannelIcon, InstagramChannelIcon, OtherChannelIcon, SearchChannelIcon, TiktokChannelIcon, YoutubeChannelIcon } from '@/features/onboarding/components/channel-icons';
type ChannelKey = keyof Translations['onboarding']['heardAbout']['options'];

interface ChannelOption {
  key: ChannelKey;
  icon: ReactNode;
}

// Typed against the locale, so a renamed key fails to compile instead of
// rendering "missing translation" in a list.
const OPTIONS: ChannelOption[] = [
  { key: 'friend', icon: <FriendChannelIcon /> },
  { key: 'instagram', icon: <InstagramChannelIcon /> },
  { key: 'tiktok', icon: <TiktokChannelIcon /> },
  { key: 'appStore', icon: <AppStoreChannelIcon /> },
  { key: 'youtube', icon: <YoutubeChannelIcon /> },
  { key: 'search', icon: <SearchChannelIcon /> },
  { key: 'other', icon: <OtherChannelIcon /> },
];

/**
 * Screen `12 Where did you hear`.
 *
 * The answer is stored on `profiles.heard_about`. Per the positioning note, the
 * number that matters is invites-per-install, so this is attribution input, not
 * a vanity question.
 */
export default function HeardAboutScreen() {
  const [choice, setChoice] = useState<ChannelKey | null>('tiktok');

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <CloseRow onPress={() => router.back()} />

      <Text variant="display" color={colors.ink} style={styles.title}>
        {t('onboarding.heardAbout.title')}
      </Text>
      <Text variant="bodySm" color={colors.purpleMuted} style={styles.subtitle}>
        {t('onboarding.heardAbout.subtitle')}
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((option) => {
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
              <CheckCircle checked={selected} />
            </Pressable>
          );
        })}
      </View>

      <CtaFooter
        label={t('onboarding.heardAbout.cta')}
        disabled={!choice}
        onPress={() => router.replace('/(onboarding)/thank-you')}
        secondary={t('onboarding.heardAbout.skip')}
        onSecondary={() => router.replace('/(onboarding)/thank-you')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 26 },
  subtitle: { marginTop: 10 },
  list: { marginTop: 22, gap: 8 },
  row: {
    height: 60,
    borderRadius: radius.thumbSm,
    // Constant width: swapping 1.6 -> 2 on selection would change the row's
    // height and shift every row below it.
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 12,
    paddingRight: 18,
  },
  rowSelected: { borderColor: colors.purple, backgroundColor: colors.surfaceVioletTint },
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
});
