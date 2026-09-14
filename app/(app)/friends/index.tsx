import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Clock, Plus } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { avatarSize } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { relativeTime } from '@/shared/lib/format';
import { useMutation } from '@tanstack/react-query';
import { errorMessage } from '@/shared/lib/error-message';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { StoryRail } from '@/features/feed/components/story-rail';
import { ChatsList } from '@/features/chat/components/chats-list';
import { TabScreen } from '@/features/navigation/tab-screen';
import {
  AVATARS,
  demoFriendRequests,
  demoProfiles,
  demoSentRequests,
  demoUnreadCount,
  DEMO_USER_ID,
} from '@/shared/lib/fixtures';
import { respondToFriendRequest } from '@/features/friends/data/friends-api';
import { openProfile } from '@/features/profile/open-profile';
type Tab = 'friends' | 'chats';

/**
 * Screen `08 Freunde` — the story rail, incoming requests, and outgoing requests
 * still waiting. The three sections map 1:1 onto `friendships` rows read from
 * three angles (see docs/database.md §4).
 */
export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  const [requests, setRequests] = useState(demoFriendRequests);
  // Counts on the toggle, so it says how much is waiting behind each tab.
  const badges: Record<Tab, number> = { friends: requests.length, chats: demoUnreadCount };

  const rail = [
    { id: DEMO_USER_ID, name: t('common.you'), avatar: AVATARS.self, waiting: true },
    { id: demoProfiles.mia.id, name: demoProfiles.mia.first_name, avatar: AVATARS.mia, waiting: false },
  ];
  const waiting = rail.filter((item) => item.waiting).length;

  const accept = useMutation({
    mutationFn: (id: string) => respondToFriendRequest(id, 'accepted'),
    onSuccess: (_, id) => setRequests((rs) => rs.filter((r) => r.id !== id)),
  });

  return (
    <TabScreen>
      <View className="h-10 flex-row items-center justify-between">
        <Text variant="screenTitle" className="text-ink">
          {t('friends.title')}
        </Text>
        <GlassButton
          size={38}
          onPress={() => router.push('/(app)/friends/search')}
          accessibilityLabel={t('friends.search.title')}
        >
          <Plus size={18} color={colors.purpleMuted} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View className="mt-4 flex-row gap-1 rounded-pill bg-surface-lilac p-1">
        {(['friends', 'chats'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-[7px] rounded-pill py-2',
              tab === key && 'bg-white',
            )}
          >
            <Text
              variant="bodyXs"
              weight="semibold"
              className={tab === key ? 'text-purple-deep' : 'text-muted-lilac'}
            >
              {t(key === 'friends' ? 'friends.tabFriends' : 'friends.tabChats')}
            </Text>
            {badges[key] > 0 ? (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-pill bg-purple px-1.5">
                <Text variant="captionXs" weight="semibold" className="text-white">
                  {String(badges[key])}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {tab === 'chats' ? (
        <ChatsList />
      ) : (
        <>
          <View className="mt-[22px] gap-3.5">
            <SectionLabel trailing={waiting > 0 ? t('feed.storiesTrailing', { count: waiting }) : undefined}>
              {t('friends.storiesLabel')}
            </SectionLabel>
            <StoryRail
              size={avatarSize.ring}
              items={rail}
              placeholders={2}
              placeholderLabel={t('feed.addFriend')}
              onPressItem={openProfile}
              onPressPlaceholder={() => router.push('/(app)/friends/search')}
            />
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t('friends.requestsSection', { count: requests.length })}</SectionLabel>
            <View className="gap-4">
              {requests.map((r) => (
                <PersonRow
                  key={r.id}
                  avatar={r.profile.photo}
                  name={r.profile.first_name}
                  subtitle={t('friends.search.mutual', { count: r.mutual })}
                  verified={r.verified}
                  trailing={
                    <Pill
                      label={t('friends.accept')}
                      tone={r.verified ? 'filled' : 'outline'}
                      onPress={() => accept.mutate(r.id)}
                    />
                  }
                  onPress={() => router.push(`/profile/${r.profile.id}`)}
                />
              ))}
              {accept.error ? (
                <Text variant="meta" className="text-purple-deep">
                  {errorMessage(accept.error)}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t('friends.sentSection', { count: demoSentRequests.length })}</SectionLabel>
            <View className="gap-4">
              {demoSentRequests.map((r) => (
                <PersonRow
                  key={r.id}
                  avatar={r.profile.photo}
                  name={r.profile.first_name}
                  subtitle={t('friends.sentAgo', { time: relativeTime(r.sentAt) })}
                  subtitleIcon={<Clock size={14} color={colors.placeholderSoft} strokeWidth={2} />}
                  dimmed
                  trailing={<Pill label={t('friends.pending')} tone="muted" />}
                />
              ))}
            </View>
          </View>

          <CtaFooter label={t('friends.addCta')} onPress={() => router.push('/(app)/friends/search')} />
        </>
      )}
    </TabScreen>
  );
}
