import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { colors } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { GlassTabBar } from '@/features/navigation/GlassTabBar';
import {
  FeedTabIcon,
  CameraTabIcon,
  FriendsTabIcon,
  ProfileTabIcon,
} from '@/shared/ui/tabIcons';

/**
 * The signed-in area.
 *
 * Camera is a tab for reachability, but it opens the full-screen capture modal
 * rather than rendering inside the tab shell — a viewfinder with a navigation
 * bar across it would be wrong.
 */
export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.white } }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('nav.feed'),
          tabBarIcon: ({ color, focused }) => <FeedTabIcon color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('nav.camera'),
          tabBarIcon: ({ color, focused }) => <CameraTabIcon color={color} active={focused} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/camera');
          },
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('nav.friends'),
          tabBarIcon: ({ color, focused }) => <FriendsTabIcon color={color} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} active={focused} />,
        }}
      />
    </Tabs>
  );
}
