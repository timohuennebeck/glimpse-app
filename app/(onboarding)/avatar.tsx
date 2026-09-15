import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Plus } from 'lucide-react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
import { DottedDisc } from '@/shared/ui/dotted-disc';
/**
 * Screen `03 Avatar · 3 of 7`.
 *
 * The picked photo is held on the onboarding draft, not uploaded: there is no
 * account to hang it on until step 4. The details screen uploads it after
 * sign-up returns a session.
 */
export default function AvatarScreen() {
  const draft = useOnboardingDraft();

  async function pick() {
    // Cropped square here rather than centre-cropped later, so the person
    // chooses which part of the photo is their face.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    draft.set({ avatar: { uri: asset.uri, width: asset.width, height: asset.height } });
  }

  return (
    <OnboardingScreen
      step={3}
      title={t('onboarding.avatar.title')}
      subtitle={t('onboarding.avatar.subtitle')}
      cta={t('onboarding.avatar.cta')}
      onNext={() => router.push('/(onboarding)/signup')}
      secondary={t('onboarding.avatar.skip')}
      onSecondary={() => {
        // "Add later" means without one — not with whatever was picked and
        // then reconsidered.
        draft.set({ avatar: null });
        router.push('/(onboarding)/signup');
      }}
    >
      <View className="mt-[22px] h-[276px] items-center justify-center gap-5 rounded-lg bg-surface-violet-deep">
        <Pressable
          className="h-[164px] w-[164px]"
          onPress={() => void pick()}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.avatar.pick')}
        >
          {draft.avatar ? (
            <Image
              source={{ uri: draft.avatar.uri }}
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
          {t('onboarding.avatar.pick')}
        </Text>
      </View>
    </OnboardingScreen>
  );
}
