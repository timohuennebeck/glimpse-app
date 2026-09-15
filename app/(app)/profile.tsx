import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { spacing } from '@/shared/theme/page-structure';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { useMe } from '@/features/profile/hooks/use-me';
import { ProfileView } from '@/features/profile/components/profile-view';
import { ProfileActionsSheet } from '@/features/profile/components/profile-actions-sheet';
import { TabScreen } from '@/features/navigation/tab-screen';
/** Your own profile — the Profile tab. */
export default function OwnProfileScreen() {
  const { data: me } = useMe();
  const [actionsOpen, setActionsOpen] = useState(false);
  const { data: pairs = [] } = useQuery({ ...queries.moments.pairs(null), enabled: me != null });
  const { data: locked = [] } = useQuery({ ...queries.moments.outgoingLocked, enabled: me != null });
  // One sequence, newest first: a moment you sent an hour ago belongs above a
  // pair you completed yesterday.
  const grid = useMemo(
    () => [...locked, ...pairs].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [locked, pairs],
  );

  return (
    <TabScreen gutter={spacing.gutterTight}>
      {me ? (
        <>
          <ProfileView
            profile={me}
            subtitle={memberSince(me.created_at)}
            // Balances the "more" button on the right so the avatar stays centred.
            leading={<View className="w-11" />}
            pairs={grid}
            onPressTrade={() => router.push('/camera')}
            onPressMore={() => setActionsOpen(true)}
          />
          <ProfileActionsSheet visible={actionsOpen} onClose={() => setActionsOpen(false)} />
        </>
      ) : null}
    </TabScreen>
  );
}
