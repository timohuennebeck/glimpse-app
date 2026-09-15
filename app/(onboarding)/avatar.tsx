import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Svg, { Circle, Defs, Pattern } from 'react-native-svg';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
/**
 * Screen `03 Avatar · 3 of 7`.
 *
 * The empty avatar in the mock is a purple disc with a fine dot pattern; here it
 * is a flat purple disc plus the same "+" badge, and shows the picked photo once
 * one is chosen.
 */
export default function AvatarScreen() {
  const [photo, setPhoto] = useState<string | null>(null);

  return (
    <OnboardingScreen
      step={3}
      title={t(ONBOARDING.AVATAR.TITLE)}
      subtitle={t(ONBOARDING.AVATAR.SUBTITLE)}
      cta={t(ONBOARDING.AVATAR.CTA)}
      onNext={() => router.push('/(onboarding)/signup')}
      secondary={t(ONBOARDING.AVATAR.SKIP)}
      onSecondary={() => router.push('/(onboarding)/signup')}
    >
      <View className="mt-[22px] h-[276px] items-center justify-center gap-5 rounded-lg bg-surface-violet-deep">
        <Pressable className="h-[164px] w-[164px]" onPress={() => setPhoto(null)}>
          {photo ? (
            <Image
              source={{ uri: photo }}
              className="h-[164px] w-[164px] rounded-[82px]"
              contentFit="cover"
            />
          ) : (
            <DottedDisc size={164} />
          )}
          <View className="absolute bottom-2 right-0.5 h-11 w-11 items-center justify-center rounded-[22px] border-[3px] border-surface-violet-deep bg-purple">
            <Plus size={20} color={colors.white} strokeWidth={2.6} />
          </View>
        </Pressable>

        <Text variant="body" className="text-ink-faint">
          {t(ONBOARDING.AVATAR.PICK)}
        </Text>
      </View>
    </OnboardingScreen>
  );
}

/**
 * The mock's empty avatar is a purple disc carrying a fine dot pattern:
 *   background-image: radial-gradient(rgba(255,255,255,.55) 1.6px, transparent 1.7px)
 *   background-size: 13px 13px
 * React Native has no background-image, so it is drawn as an SVG pattern.
 */
interface DottedDiscProps {
  size: number;
}

function DottedDisc({ size }: DottedDiscProps) {
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <Pattern id="dots" width={13} height={13} patternUnits="userSpaceOnUse">
          <Circle cx={6.5} cy={6.5} r={1.6} fill="rgba(255,255,255,.55)" />
        </Pattern>
      </Defs>
      {/* Disc fill, then the dots on top of it. Radii are inset so the
          outermost stroke sits inside the viewport instead of being clipped. */}
      <Circle cx={r} cy={r} r={r - 8} fill={colors.purple} />
      <Circle cx={r} cy={r} r={r - 8} fill="url(#dots)" />
      {/* The mock's 4px surface-coloured gap ring, then a 2.5px purple outline. */}
      <Circle cx={r} cy={r} r={r - 6} stroke={colors.surfaceVioletDeep} strokeWidth={4} fill="none" />
      <Circle cx={r} cy={r} r={r - 2.75} stroke={colors.purple} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}
