import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { friendsOf } from '@/features/friends/relationships';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { waitingBySender } from '@/features/moments/selectors';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { FeedHeader } from '@/features/feed/components/feed-header';
import { StoryRail, StoryItem } from '@/features/feed/components/story-rail';
import { LockedMomentCard } from '@/features/feed/components/locked-moment-card';
import { OutboxLine } from '@/features/feed/components/outbox-line';
import { EmptyState } from '@/features/feed/components/empty-state';
import { TabScreen } from '@/features/navigation/tab-screen';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import { openProfile } from '@/features/profile/open-profile';
/**
 * Screens `01 Feed` and `01c Feed · leer`.
 *
 * One component covers both: with nobody to trade with and nothing waiting, the
 * cards are replaced by the dashed invite card, exactly as the two artboards
 * show. Having friends but no moments is not empty — it is a quiet day.
 */
export default function FeedScreen() {
  const { pending, open, loading } = useInbox();
  const { data: me } = useMe();
  const {
    data: friendships = [],
    isPending: friendsPending,
    isError: friendsFailed,
  } = useQuery(queries.friends.all);
  const composer = useComposer();
  const myId = me?.id ?? '';

  const waitingSenders = useMemo(() => waitingBySender(pending), [pending]);

  const stories = useMemo<StoryItem[]>(
    () => [
      {
        id: myId,
        name: t('common.you'),
        avatar: avatarUrl(me?.avatar_storage_path ?? null),
        waiting: true,
      },
      // One tile per person, not per trade: two unanswered moments from the
      // same sender would otherwise render two tiles under one React key.
      ...waitingSenders.map((entry) => ({
        id: entry.person.id,
        name: entry.person.name,
        avatar: entry.person.avatarUrl,
        waiting: true,
      })),
    ],
    [me, myId, waitingSenders],
  );

  // A failed or still-loading friends query means "we do not know yet", not
  // "you have nobody". Treating it as nobody replaced the whole feed with the
  // invite card for someone with twenty friends, and said nothing about why.
  const friendsUnknown = friendsPending || friendsFailed;
  const hasPeople = friendsUnknown || friendsOf(friendships, myId).length > 0;
  const hasMoments = pending.length > 0 || open.length > 0;
  // Nobody to trade with AND nothing waiting. Either one on its own is a feed.
  const empty = !loading && !hasPeople && !hasMoments;

  function startTrade(tradeId: string) {
    // Capture answers this specific frosted moment; the camera reads it back.
    composer.set({ replyToTradeId: tradeId });
    router.push('/camera');
  }

  return (
    <TabScreen>
      <View className="flex-1 gap-4">
        <FeedHeader
          avatar={avatarUrl(me?.avatar_storage_path ?? null)}
          name={me?.first_name ?? ''}
          subtitle={me ? memberSince(me.created_at) : ''}
          onPressAdd={() => router.push('/(app)/friends/search')}
          onPressAvatar={() => router.push('/(app)/friends')}
        />

        <View className="gap-3">
          <SectionLabel
            // People, not trades — the same thing the rail draws a tile for.
            trailing={
              waitingSenders.length > 0
                ? t('feed.storiesTrailing', { count: waitingSenders.length })
                : undefined
            }
          >
            {t('feed.storiesLabel')}
          </SectionLabel>
          <StoryRail
            items={stories}
            placeholders={Math.max(0, 3 - waitingSenders.length)}
            placeholderLabel={t('feed.addFriend')}
            onPressItem={(id) => openProfile(id, myId)}
            onPressPlaceholder={() => router.push('/(app)/friends/search')}
          />
        </View>

        <Text variant="headline" className="text-ink">
          {empty ? t('feed.empty.headline') : greetingForNow()}
        </Text>

        {empty ? (
          <EmptyState
            title={t('feed.empty.title')}
            body={t('feed.empty.body')}
            cta={t('feed.empty.cta')}
            onPress={() => router.push('/(app)/friends/search')}
          />
        ) : (
          <>
            <OutboxLine />

            {pending.map((moment) => (
              <LockedMomentCard
                key={moment.tradeId}
                moment={moment}
                onPressTrade={() => startTrade(moment.tradeId)}
                onPressCard={() => router.push(`/moment/${moment.tradeId}`)}
              />
            ))}

            {open.length > 0 ? (
              <>
                <SectionHeading title={t('feed.momentsTitle')} />

                {/* Fixed share rather than flex:1, which would stretch a lone item across
                    the full width and render a portrait photo as a letterbox strip. */}
                <View className="flex-row flex-wrap gap-[13px]">
                  {open.map((moment) => (
                    <Pressable
                      key={moment.tradeId}
                      className="w-[48%]"
                      onPress={() => router.push(`/photo/${moment.momentId}`)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={moment.from.name}
                    >
                      <Image
                        source={moment.photo}
                        className="aspect-[4/5] w-full rounded-thumb"
                        contentFit="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </View>
    </TabScreen>
  );
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return t('feed.greetingMorning');
  if (hour >= 18) return t('feed.greetingEvening');
  return t('feed.greetingDay');
}
