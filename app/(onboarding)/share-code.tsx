import { Share, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, MoreHorizontal } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { BloomBackdrop } from '@/features/onboarding/components/bloom-backdrop';
import { ART } from '@/shared/lib/fixtures';
/**
 * Screen `10b Share your code · after purchase`.
 *
 * The code is the growth loop's second surface: Plus is worth more when the
 * people you trade with also have it, so giving it away is the point.
 */
export default function ShareCodeScreen() {
  const code = 'G7K-4PZ';

  return (
    <Screen
      footer={
        <View className="gap-3.5">
          <Button
            label={t('referral.share.cta')}
            size="md"
            onPress={() => router.push('/(onboarding)/heard-about')}
          />
          <Text
            variant="bodyXs"
            className="text-center text-purple-muted"
            accessibilityRole="link"
            onPress={() => router.push('/(onboarding)/heard-about')}
          >
            {t('referral.share.later')}
          </Text>
        </View>
      }
      scroll
      backdrop={<BloomBackdrop />}
    >
      <CloseRow onPress={() => router.push('/(onboarding)/heard-about')} />

      <Image
        source={ART.mascotHeart}
        className="-mb-3 -mt-[18px] h-[190px] w-[210px] self-center"
        contentFit="contain"
      />

      <Text variant="eyebrowAccent" className="mt-3.5 text-purple-deep">
        {t('referral.share.eyebrow')}
      </Text>
      <Text variant="displayLg" className="mt-1.5 text-ink">
        {t('referral.share.title')}
      </Text>
      <Text variant="body" className="mt-3.5 text-purple-muted">
        {t('referral.share.subtitle')}
      </Text>

      <View className="mt-8 items-center gap-1.5 rounded-card-sm border-2 border-purple bg-surface-violet-tint px-5 py-[22px]">
        <Text variant="eyebrowAccent" className="text-purple-deep">
          {t('referral.share.codeLabel')}
        </Text>
        {/*
          Without an explicit lineHeight the mono face clips its own ascenders and
          descenders at this size; the trailing space balances the letterSpacing so
          the string stays optically centred.
        */}
        <Text
          weight="semibold"
          className="android:font-mono-android text-center font-mono text-[32px] font-semibold leading-[42px] tracking-[5.12px] text-ink"
        >
          {`${code} `}
        </Text>
        <Text variant="meta" className="text-purple-muted">
          {t('referral.share.codeNote')}
        </Text>
      </View>

      <View className="mt-3 flex-row gap-3">
        <Button
          label={t('referral.share.copy')}
          variant="outline"
          size="xs"
          icon={<Copy size={14} color={colors.inkBody} strokeWidth={2} />}
          className="flex-1"
          onPress={() => void Clipboard.setStringAsync(code)}
        />
        <Button
          label={t('referral.share.share')}
          variant="purple"
          size="xs"
          icon={<MoreHorizontal size={14} color={colors.white} strokeWidth={2.4} />}
          className="flex-1"
          onPress={() => void Share.share({ message: code })}
        />
      </View>
    </Screen>
  );
}
