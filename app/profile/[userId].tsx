import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { View } from 'react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, PROFILE } from '@/shared/i18n/keys';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { ProfileView } from '@/features/profile/components/profile-view';
import { relationshipWith } from '@/features/friends/relationships';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Screen `07b Profil` — a friend's profile, pushed from the feed or a list.
 * Trading from here pre-selects them as the recipient.
 */
export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const composer = useComposer();
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const {
    data: profile,
    isPending,
    isError,
  } = useQuery({
    ...queries.profile.byId(userId ?? ''),
    enabled: Boolean(userId),
  });
  const { data: pairs = [] } = useQuery({
    ...queries.moments.pairs(userId ?? ''),
    enabled: Boolean(userId),
  });

  // Search lists everyone, not just friends, so this screen is reachable for a
  // stranger. `send_moment` would refuse them after a full upload and blur, so
  // the CTA is simply not offered — there is no trade to start here.
  const areFriends = relationshipWith(friendships, me?.id ?? '', userId ?? '').kind === 'friends';

  const close = (
    <GlassButton size={44} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
      <X size={15} color={colors.inkSoft} strokeWidth={2.2} />
    </GlassButton>
  );

  // A blocked pair, a deleted account and a bogus deep-link id all land here.
  // The close button lives inside `leading`, so without this branch the screen
  // renders completely empty with no way back out of a root-stack route.
  if (!profile) {
    return (
      <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
        <View className="flex-row">{close}</View>
        {!isPending || isError ? (
          <Text variant="bodyXs" className="mt-6 text-center text-muted">
            {t(PROFILE.NOT_FOUND)}
          </Text>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
      <ProfileView
        profile={profile}
        subtitle={profile.tagline || memberSince(profile.created_at)}
        leading={close}
        pairs={pairs}
        onPressTrade={
          areFriends
            ? () => {
                composer.set({ recipientIds: [profile.id] });
                router.push('/camera');
              }
            : undefined
        }
      />
    </Screen>
  );
}
