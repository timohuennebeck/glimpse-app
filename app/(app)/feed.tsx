import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { memberSince } from '@/shared/lib/format';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { FeedHeader } from '@/features/feed/components/feed-header';
import { StoryRail, StoryItem } from '@/features/feed/components/story-rail';
import { LockedMomentCard } from '@/features/feed/components/locked-moment-card';
import { EmptyState } from '@/features/feed/components/empty-state';
import { TabScreen } from '@/features/navigation/tab-screen';
import { AVATARS, demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';
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

  const stories = useMemo<StoryItem[]>(
    () => [
      { id: DEMO_USER_ID, name: t('common.you'), avatar: AVATARS.self, waiting: true },
      ...pending.map((m) => ({
        id: m.from.id,
        name: m.from.name,
        avatar: m.from.avatar ?? AVATARS.mia,
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
          avatar={AVATARS.self}
          name={demoProfiles[DEMO_USER_ID].display_name}
          subtitle={memberSince(demoProfiles[DEMO_USER_ID].created_at)}
          onPressAdd={() => router.push('/(app)/friends/search')}
          onPressAvatar={() => router.push('/(app)/friends')}
        />

        <View className="gap-3">
          <SectionLabel
            trailing={pending.length > 0 ? t('feed.storiesTrailing', { count: pending.length }) : undefined}
          >
            {t('feed.storiesLabel')}
          </SectionLabel>
          <StoryRail
            items={stories}
            placeholders={Math.max(0, 3 - pending.length)}
            placeholderLabel={t('feed.addFriend')}
            onPressItem={openProfile}
            onPressPlaceholder={() => router.push('/(app)/friends/search')}
          />
        </View>

        <Text variant="headline" className="text-ink">
          {hasFriends ? greeting : t('feed.empty.headline')}
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

            <SectionHeading title={t('feed.momentsTitle')} />

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
              title={t('feed.empty.title')}
              body={t('feed.empty.body')}
              cta={t('feed.empty.cta')}
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
  if (hour < 11) return t('feed.greetingMorning');
  if (hour >= 18) return t('feed.greetingEvening');
  return t('feed.greetingDay');
}
