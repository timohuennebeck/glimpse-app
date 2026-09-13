import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Screen, SectionLabel, Text, GlassButton, FilterIcon } from '@/shared/ui';
import { colors, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { useInbox, useComposer } from '@/features/moments';
import { FeedHeader } from '@/features/feed/components/FeedHeader';
import { StoryRail, StoryItem } from '@/features/feed/components/StoryRail';
import { LockedMomentCard } from '@/features/feed/components/LockedMomentCard';
import { EmptyState } from '@/features/feed/components/EmptyState';
import { AVATARS, demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';

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
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.stack}>
        <FeedHeader
          avatar={AVATARS.self}
          name={demoProfiles[DEMO_USER_ID].display_name}
          subtitle={demoProfiles[DEMO_USER_ID].tagline ?? ''}
          onPressAdd={() => router.push('/(app)/friends/search')}
          onPressAvatar={() => router.push('/(app)/friends')}
        />

        <View style={styles.gap12}>
          <SectionLabel trailing={t('feed.storiesTrailing', { count: pending.length })}>
            {t('feed.storiesLabel')}
          </SectionLabel>
          <StoryRail
            items={stories}
            placeholders={Math.max(0, 3 - pending.length)}
            placeholderLabel={t('feed.addFriend')}
            onPressItem={(id) => router.push(`/profile/${id}`)}
            onPressPlaceholder={() => router.push('/(app)/friends/search')}
          />
        </View>

        <Text variant="headline" color={colors.ink}>
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

            {pending.length > 1 ? <Dots count={pending.length} /> : null}

            <View style={styles.sectionRow}>
              <Text variant="section" color={colors.ink}>
                {t('feed.momentsTitle')}
              </Text>
              <GlassButton size={36}>
                <FilterIcon size={20} />
              </GlassButton>
            </View>

            <View style={styles.grid}>
              {open.map((moment) => (
                <Pressable
                  key={moment.tradeId}
                  style={styles.gridCell}
                  onPress={() => router.push(`/photo/${moment.momentId}`)}
                >
                  <Image source={moment.photo} style={styles.gridImage} contentFit="cover" />
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
    </Screen>
  );
}

/** Pagination dots under the trade card stack. */
function Dots({ count }: { count: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
      ))}
    </View>
  );
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return t('feed.greetingMorning');
  if (hour >= 18) return t('feed.greetingEvening');
  return t('feed.greetingDay');
}

const styles = StyleSheet.create({
  stack: { gap: 16, flex: 1 },
  gap12: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', gap: 13, flexWrap: 'wrap' },
  gridCell: { flex: 1, minWidth: '45%' },
  gridImage: { width: '100%', height: 112, borderRadius: radius.thumb },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -6 },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.borderStrong },
  dotActive: { width: 16, backgroundColor: colors.purple },
});
