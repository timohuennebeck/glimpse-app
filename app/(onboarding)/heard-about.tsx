import { ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { cn } from '@/shared/lib/cn';
import { CheckCircle } from '@/shared/ui/check-circle';
import { CloseRow } from '@/shared/ui/close-row';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import type { Translations } from '@/shared/i18n/locales/de';
import {
  AppStoreChannelIcon,
  FriendChannelIcon,
  InstagramChannelIcon,
  OtherChannelIcon,
  SearchChannelIcon,
  TiktokChannelIcon,
  YoutubeChannelIcon,
} from '@/features/onboarding/components/channel-icons';
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
    <Screen
      footer={
        <CtaFooter
          label={t('onboarding.heardAbout.cta')}
          disabled={!choice}
          onPress={() => router.replace('/(onboarding)/thank-you')}
          secondary={t('onboarding.heardAbout.skip')}
          onSecondary={() => router.replace('/(onboarding)/thank-you')}
        />
      }
      scroll
    >
      <CloseRow onPress={() => router.back()} />

      <Text variant="display" className="mt-[26px] text-ink">
        {t('onboarding.heardAbout.title')}
      </Text>
      <Text variant="bodySm" className="mt-2.5 text-purple-muted">
        {t('onboarding.heardAbout.subtitle')}
      </Text>

      <View className="mt-[22px] gap-2">
        {OPTIONS.map((option) => {
          const selected = choice === option.key;
          return (
            <Pressable
              key={option.key}
              className={cn(
                // Constant border width: swapping 1.6 -> 2 on selection would
                // change the row's height and shift every row below it.
                'h-[60px] flex-row items-center gap-3.5 rounded-thumb-sm border-2 pl-3 pr-[18px]',
                selected ? 'border-purple bg-surface-violet-tint' : 'border-border bg-white',
              )}
              onPress={() => setChoice(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View className="h-12 w-12 items-center justify-center rounded-full bg-surface-violet-deep">
                {option.icon}
              </View>
              <Text variant="body" weight={selected ? 'semibold' : 'medium'} className="flex-1 text-ink-body">
                {t(`onboarding.heardAbout.options.${option.key}`)}
              </Text>
              <CheckCircle checked={selected} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
