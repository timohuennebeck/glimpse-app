import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Svg, { Circle, Defs, Pattern } from 'react-native-svg';
import { PlusIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
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
      title={t('onboarding.avatar.title')}
      subtitle={t('onboarding.avatar.subtitle')}
      cta={t('onboarding.avatar.cta')}
      onNext={() => router.push('/(onboarding)/signup')}
      secondary={t('onboarding.avatar.skip')}
      onSecondary={() => router.push('/(onboarding)/signup')}
    >
      <View style={styles.stage}>
        <Pressable style={styles.avatarWrap} onPress={() => setPhoto(null)}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
          ) : (
            <DottedDisc size={164} />
          )}
          <View style={styles.badge}>
            <PlusIcon size={20} color={colors.white} strokeWidth={2.6} />
          </View>
        </Pressable>

        <Text variant="body" color={colors.inkFaint}>
          {t('onboarding.avatar.pick')}
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

const styles = StyleSheet.create({
  stage: {
    marginTop: 22,
    backgroundColor: colors.surfaceVioletDeep,
    borderRadius: radius.lg,
    height: 276,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  avatarWrap: { width: 164, height: 164 },
  avatar: { width: 164, height: 164, borderRadius: 82 },
  badge: {
    position: 'absolute',
    right: 2,
    bottom: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    borderWidth: 3,
    borderColor: colors.surfaceVioletDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
