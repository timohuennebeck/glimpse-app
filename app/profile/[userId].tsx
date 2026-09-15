import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON } from '@/shared/i18n/keys';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { ProfileView } from '@/features/profile/components/profile-view';
import { useComposer } from '@/features/moments/hooks/use-composer';
/**
 * Screen `07b Profil` — a friend's profile, pushed from the feed or a list.
 * Trading from here pre-selects them as the recipient.
 */
export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const composer = useComposer();
  const { data: profile } = useQuery({
    ...queries.profile.byId(userId ?? ''),
    enabled: Boolean(userId),
  });
  const { data: pairs = [] } = useQuery({
    ...queries.moments.pairs(userId ?? ''),
    enabled: Boolean(userId),
  });

  return (
    <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
      {profile ? (
        <ProfileView
          profile={profile}
          subtitle={profile.tagline || memberSince(profile.created_at)}
          leading={
            <GlassButton size={44} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
              <X size={15} color={colors.inkSoft} strokeWidth={2.2} />
            </GlassButton>
          }
          pairs={pairs}
          onPressTrade={() => {
            composer.set({ recipientIds: [profile.id] });
            router.push('/camera');
          }}
        />
      ) : null}
    </Screen>
  );
}
