import { View } from 'react-native';
import { router } from 'expo-router';
import { spacing } from '@/shared/theme/page-structure';
import { memberSince } from '@/shared/lib/format';
import { ProfileView } from '@/features/profile/components/profile-view';
import { TabScreen } from '@/features/navigation/tab-screen';
import { demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';
/** Your own profile — the Profile tab. */
export default function OwnProfileScreen() {
  const me = demoProfiles[DEMO_USER_ID];

  return (
    <TabScreen gutter={spacing.gutterTight}>
      <ProfileView
        profile={me}
        subtitle={memberSince(me.created_at)}
        // Balances the "more" button on the right so the avatar stays centred.
        leading={<View className="w-11" />}
        onPressTrade={() => router.push('/camera')}
      />
    </TabScreen>
  );
}
