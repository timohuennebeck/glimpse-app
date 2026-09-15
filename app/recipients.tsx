import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, COMPOSE } from '@/shared/i18n/keys';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { PersonRow } from '@/features/friends/components/person-row';
import { Checkbox } from '@/features/friends/components/checkbox';
import { friendsOf } from '@/features/friends/relationships';
import { EmptyState } from '@/features/feed/components/empty-state';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { enqueueSend } from '@/features/moments/hooks/use-outbox';
import { splitSelection, waitingBySender } from '@/features/moments/selectors';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Screen `03c Senden · Empfänger wählen`.
 *
 * One list of selected people, two jobs. Picking someone from "Waiting on you"
 * answers their frosted moment — never opens a second lock back at them.
 * Picking anyone else opens a new one. Sending queues the work and returns to
 * the feed; the upload runs behind it.
 */
export default function RecipientsScreen() {
  const composer = useComposer();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: friendships = [], error: friendsError } = useQuery(queries.friends.all);
  const { data: inbox } = useInbox();

  const waiting = useMemo(() => waitingBySender(inbox), [inbox]);
  const friends = useMemo(() => {
    // They are already on the list above; one person, one row.
    const waitingIds = new Set(waiting.map((entry) => entry.person.id));
    return friendsOf(friendships, me?.id ?? '').filter((person) => !waitingIds.has(person.id));
  }, [friendships, me?.id, waiting]);

  // A friend's profile pre-selects them; otherwise start empty.
  const [selected, setSelected] = useState<string[]>(composer.recipientIds);

  const nameById = useMemo(
    () =>
      new Map<string, string>([
        ...waiting.map((entry) => [entry.person.id, entry.person.name] as const),
        ...friends.map((person) => [person.id, person.name] as const),
      ]),
    [waiting, friends],
  );

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function send() {
    if (!composer.uri || composer.width === null || composer.height === null) return;
    const { replyToTradeIds, recipientIds } = splitSelection(selected, waiting);
    enqueueSend(
      {
        localUri: composer.uri,
        width: composer.width,
        height: composer.height,
        caption: composer.caption || null,
        replyToTradeIds,
        recipientIds,
        names: selected.map((id) => nameById.get(id) ?? '').filter((name) => name.length > 0),
      },
      queryClient,
    );
    composer.reset();
    router.dismissAll();
    router.replace('/(app)/feed');
  }

  const ctaLabel =
    selected.length === 0
      ? t(COMPOSE.SEND_NONE)
      : selected.length === 1
        ? t(COMPOSE.SEND_TO, { name: nameById.get(selected[0]) ?? '' })
        : t(COMPOSE.SEND_TO_MANY, { count: selected.length });

  return (
    <Screen gutter={0} bottomInset={spacing.contentBottom}>
      <View className="flex-row items-center gap-3.5 px-gutter">
        <GlassButton size={38} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={12} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Text variant="cardTitleLg" className="text-ink">
          {t(COMPOSE.RECIPIENTS_TITLE)}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-[26px] px-gutter pb-6 pt-[30px]"
        showsVerticalScrollIndicator={false}
      >
        {waiting.length > 0 ? (
          <View className="gap-3.5">
            <SectionLabel>{t(COMPOSE.WAITING_SECTION)}</SectionLabel>
            <View className="gap-4">
              {waiting.map(({ person }) => (
                <PersonRow
                  key={person.id}
                  avatar={person.avatarUrl}
                  name={person.name}
                  subtitle={person.username ? `@${person.username}` : undefined}
                  size={46}
                  onPress={() => toggle(person.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.includes(person.id) }}
                  trailing={<Checkbox checked={selected.includes(person.id)} />}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-3.5">
          <SectionLabel>{t(COMPOSE.FRIENDS_SECTION)}</SectionLabel>
          <View className="gap-4">
            {friends.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={person.tagline ?? undefined}
                size={46}
                onPress={() => toggle(person.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected.includes(person.id) }}
                trailing={<Checkbox checked={selected.includes(person.id)} />}
              />
            ))}
          </View>
        </View>

        <View className="gap-3.5">
          <EmptyState
            title={t(COMPOSE.INVITE_TITLE)}
            body={t(COMPOSE.INVITE_BODY)}
            cta={t(COMPOSE.INVITE_CTA)}
            artSize={112}
            onPress={() => router.push('/(app)/friends/search')}
          />
        </View>

        {friendsError ? (
          <Text variant="meta" className="mt-2 text-center text-purple-deep">
            {errorMessage(friendsError)}
          </Text>
        ) : null}
      </ScrollView>

      <View className="px-gutter pt-3">
        <Button label={ctaLabel} onPress={send} size="lg" disabled={selected.length === 0 || !composer.uri} />
      </View>
    </Screen>
  );
}
