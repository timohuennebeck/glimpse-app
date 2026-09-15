import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, Plus } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { avatarSize } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, ERRORS, FEED, FRIENDS } from '@/shared/i18n/keys';
import { relativeTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { useAcceptFriendRequest, useRemoveFriendship } from '@/features/friends/data/friends-mutations';
import { friendsOf, incomingRequests, otherParty, sentRequests } from '@/features/friends/relationships';
import { StoryRail } from '@/features/feed/components/story-rail';
import { ChatsList } from '@/features/chat/components/chats-list';
import { useUnreadTotal } from '@/features/chat/hooks/use-unread-total';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { TabScreen } from '@/features/navigation/tab-screen';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useMe } from '@/features/profile/hooks/use-me';
import { openProfile } from '@/features/profile/open-profile';
import { shareInvite } from '@/features/invites/share-invite';
type Tab = 'friends' | 'chats';

/**
 * Screen `08 Freunde` — the story rail, incoming requests, and outgoing
 * requests still waiting. The three sections are three readings of one list of
 * `friendships` rows (see `relationships.ts`).
 */
export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  /** Withdrawing takes two taps; there is no undo for a deleted row. */
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);
  // This screen has no share row to say "Copied", so the CTA says it instead —
  // and says so too when createInvite never came back.
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const { pending } = useInbox();

  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();

  const requests = useMemo(() => incomingRequests(friendships, myId), [friendships, myId]);
  const sent = useMemo(() => sentRequests(friendships, myId), [friendships, myId]);
  // "3 mutual" is what makes a request from a near-stranger legible. Sorted, so
  // it shares its cache entry with the search screen's copy of the same ask.
  const requestIds = useMemo(
    () => requests.map((friendship) => otherParty(friendship, myId).id).sort(),
    [requests, myId],
  );
  const { data: mutual = {} } = useQuery({
    ...queries.friends.mutual(requestIds),
    enabled: requestIds.length > 0,
  });
  const rail = useMemo(
    () => [
      { id: myId, name: t(COMMON.YOU), avatar: avatarUrl(me?.avatar_storage_path ?? null), waiting: true },
      ...friendsOf(friendships, myId).map((person) => ({
        id: person.id,
        name: person.name,
        avatar: person.avatarUrl,
        // A purple ring means they are waiting on me.
        waiting: pending.some((moment) => moment.from.id === person.id),
      })),
    ],
    [friendships, myId, me, pending],
  );
  // rail[0] is the "You" tile, whose `waiting` is decoration, not a person
  // waiting on you — counting it made a brand-new account read "1 waiting".
  const waiting = rail.slice(1).filter((item) => item.waiting).length;

  // Counts on the toggle, so it says how much is waiting behind each tab.
  const unreadTotal = useUnreadTotal();
  const badges: Record<Tab, number> = { friends: requests.length, chats: unreadTotal };
  const error = accept.error ?? remove.error;

  return (
    <TabScreen>
      <View className="h-10 flex-row items-center justify-between">
        <Text variant="screenTitle" className="text-ink">
          {t(FRIENDS.TITLE)}
        </Text>
        <GlassButton
          size={38}
          onPress={() => router.push('/(app)/friends/search')}
          accessibilityLabel={t(FRIENDS.SEARCH.TITLE)}
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
              {t(key === 'friends' ? FRIENDS.TAB_FRIENDS : FRIENDS.TAB_CHATS)}
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
            <SectionLabel trailing={waiting > 0 ? t(FEED.STORIES_TRAILING, { count: waiting }) : undefined}>
              {t(FRIENDS.STORIES_LABEL)}
            </SectionLabel>
            <StoryRail
              size={avatarSize.ring}
              items={rail}
              placeholders={Math.max(0, 3 - rail.length)}
              placeholderLabel={t(FEED.ADD_FRIEND)}
              onPressItem={(id) => openProfile(id, myId)}
              onPressPlaceholder={() => router.push('/(app)/friends/search')}
            />
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t(FRIENDS.REQUESTS_SECTION, { count: requests.length })}</SectionLabel>
            <View className="gap-4">
              {requests.map((friendship) => {
                const person = otherParty(friendship, myId);
                return (
                  <PersonRow
                    key={friendship.id}
                    avatar={person.avatarUrl}
                    name={person.name}
                    subtitle={t(FRIENDS.SEARCH.MUTUAL, { count: mutual[person.id] ?? 0 })}
                    trailing={
                      <Pill
                        label={t(FRIENDS.ACCEPT)}
                        tone="filled"
                        onPress={() => accept.mutate(friendship.id)}
                      />
                    }
                    onPress={() => router.push(`/profile/${person.id}`)}
                  />
                );
              })}
            </View>
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t(FRIENDS.SENT_SECTION, { count: sent.length })}</SectionLabel>
            <View className="gap-4">
              {sent.map((friendship) => {
                const person = otherParty(friendship, myId);
                const confirming = confirmWithdraw === friendship.id;
                return (
                  <PersonRow
                    key={friendship.id}
                    avatar={person.avatarUrl}
                    name={person.name}
                    subtitle={t(FRIENDS.SENT_AGO, { time: relativeTime(friendship.createdAt) })}
                    subtitleIcon={<Clock size={14} color={colors.placeholderSoft} strokeWidth={2} />}
                    dimmed
                    trailing={
                      <Pill
                        label={confirming ? t(FRIENDS.WITHDRAW) : t(FRIENDS.PENDING)}
                        tone={confirming ? 'filled' : 'muted'}
                        onPress={() =>
                          confirming ? remove.mutate(friendship.id) : setConfirmWithdraw(friendship.id)
                        }
                      />
                    }
                  />
                );
              })}
            </View>
          </View>

          {error ? (
            <Text variant="meta" className="mt-4 text-center text-purple-deep">
              {errorMessage(error)}
            </Text>
          ) : null}

          <CtaFooter
            label={
              shareState === 'copied'
                ? t(COMMON.COPIED)
                : shareState === 'failed'
                  ? t(ERRORS.GENERIC)
                  : t(FRIENDS.ADD_CTA)
            }
            onPress={() => {
              void shareInvite(me?.first_name ?? '').then(
                (outcome) => setShareState(outcome === 'copied' ? 'copied' : 'idle'),
                () => setShareState('failed'),
              );
            }}
          />
        </>
      )}
    </TabScreen>
  );
}
