import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { PlusIcon, Text } from '@/shared/ui';
import { colors, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { OnboardingScreen } from '@/features/onboarding/components/OnboardingScreen';

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
            <View style={styles.avatarEmpty} />
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
  avatarEmpty: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: colors.purple,
    borderWidth: 4,
    borderColor: colors.surfaceVioletDeep,
  },
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
