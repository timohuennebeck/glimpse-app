import { router, useLocalSearchParams } from 'expo-router';
import { CloseIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { memberSince } from '@/shared/lib/format';
import { ProfileView } from '@/features/profile/components/profile-view';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { demoProfiles } from '@/shared/lib/fixtures';
/**
 * Screen `07b Profil` — a friend's profile, pushed from the feed or a list.
 * Trading from here pre-selects them as the recipient.
 */
export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const profile = demoProfiles[userId ?? 'mia'] ?? demoProfiles.mia;
  const composer = useComposer();

  return (
    <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
      <ProfileView
        profile={profile}
        subtitle={profile.tagline || memberSince(profile.created_at)}
        leading={
          <GlassButton size={44} onPress={() => router.back()}>
            <CloseIcon size={15} color={colors.inkSoft} />
          </GlassButton>
        }
        onPressTrade={() => {
          composer.set({ recipientIds: [profile.id] });
          router.push('/camera');
        }}
      />
    </Screen>
  );
}
