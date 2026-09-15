import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { COMMON, FEED } from '@/shared/i18n/keys';
import { memberSince } from '@/shared/lib/format';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { FeedHeader } from '@/features/feed/components/feed-header';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import { StoryRail, StoryItem } from '@/features/feed/components/story-rail';
import { LockedMomentCard } from '@/features/feed/components/locked-moment-card';
import { EmptyState } from '@/features/feed/components/empty-state';
import { TabScreen } from '@/features/navigation/tab-screen';
import { AVATARS, DEMO_USER_ID } from '@/shared/lib/fixtures';
import { openProfile } from '@/features/profile/open-profile';
/**
 * Screens `01 Feed` and `01c Feed · leer`.
 *
 * One component covers both: with no friends the trade card is replaced by the
 * dashed invite card, exactly as the two artboards show.
 */
export default function FeedScreen() {
  const { pending, open, loading } = useInbox();
  const composer = useComposer();
  const { data: me } = useMe();

  const stories = useMemo<StoryItem[]>(
    () => [
      { id: DEMO_USER_ID, name: t(COMMON.YOU), avatar: AVATARS.self, waiting: true },
      ...pending.map((m) => ({
        id: m.from.id,
        name: m.from.name,
        avatar: m.from.avatarUrl,
        waiting: true,
      })),
    ],
    [pending],
  );

  const hasFriends = pending.length > 0 || open.length > 0;
  const greeting = greetingForNow();

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
            trailing={pending.length > 0 ? t(FEED.STORIES_TRAILING, { count: pending.length }) : undefined}
          >
            {t(FEED.STORIES_LABEL)}
          </SectionLabel>
          <StoryRail
            items={stories}
            placeholders={Math.max(0, 3 - pending.length)}
            placeholderLabel={t(FEED.ADD_FRIEND)}
            onPressItem={(id) => openProfile(id, me?.id ?? '')}
            onPressPlaceholder={() => router.push('/(app)/friends/search')}
          />
        </View>

        <Text variant="headline" className="text-ink">
          {hasFriends ? greeting : t(FEED.EMPTY.HEADLINE)}
        </Text>

        {hasFriends ? (
          <>
            {pending.map((moment) => (
              <LockedMomentCard
                key={moment.tradeId}
                moment={moment}
                onPressTrade={() => startTrade(moment.tradeId)}
                onPressCard={() => router.push(`/moment/${moment.tradeId}`)}
              />
            ))}

            <SectionHeading title={t(FEED.MOMENTS_TITLE)} />

            {/* Fixed share rather than flex:1, which would stretch a lone item across the
                full width and render a portrait photo as a letterbox strip. */}
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
        ) : (
          !loading && (
            <EmptyState
              title={t(FEED.EMPTY.TITLE)}
              body={t(FEED.EMPTY.BODY)}
              cta={t(FEED.EMPTY.CTA)}
              onPress={() => router.push('/(app)/friends/search')}
            />
          )
        )}
      </View>
    </TabScreen>
  );
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return t(FEED.GREETING_MORNING);
  if (hour >= 18) return t(FEED.GREETING_EVENING);
  return t(FEED.GREETING_DAY);
}
