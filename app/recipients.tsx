import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { createMoment, sendMoment } from '@/features/moments/data/moments-api';
import { PersonRow } from '@/features/friends/components/person-row';
import { Checkbox } from '@/features/friends/components/checkbox';
import { EmptyState } from '@/features/feed/components/empty-state';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { friendsOf } from '@/features/friends/relationships';
import { useMe } from '@/features/profile/hooks/use-me';
import { demoOthers } from '@/shared/lib/fixtures';
/**
 * Screen `03c Senden · Empfänger wählen`.
 *
 * The mock splits the list in two: friends who can receive right now, and
 * dimmed contacts who are not on Glimpse yet. Sending is the last step of the
 * capture flow — from here the trade locks are created.
 */
// Contacts import is not built, and with the fixtures gone there is nobody to
// list here. Task 14 rewrites this screen.
const notOnGlimpse: typeof demoOthers = [];

export default function RecipientsScreen() {
  const composer = useComposer();
  const queryClient = useQueryClient();
  // Real ids from v_my_friends: `send_moment` takes uuids and runs only after
  // the upload has been committed, so a fixture id here would orphan the photo.
  const { data: me } = useMe();
  const { data: friendships = [], error: friendsError } = useQuery(queries.friends.all);
  const friends = useMemo(() => friendsOf(friendships, me?.id ?? ''), [friendships, me?.id]);
  // A friend's profile pre-selects them; otherwise start empty.
  const [selected, setSelected] = useState<string[]>(composer.recipientIds);

  const send = useMutation({
    mutationFn: async () => {
      if (!composer.uri || composer.width === null || composer.height === null) return;
      const momentId = await createMoment({
        localUri: composer.uri,
        caption: composer.caption || null,
        width: composer.width,
        height: composer.height,
      });
      await sendMoment(momentId, selected);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
      composer.reset();
      router.dismissAll();
      router.replace('/(app)/feed');
    },
  });
  const error = send.error ?? friendsError;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const ctaLabel =
    selected.length === 0
      ? t(COMPOSE.SEND_NONE)
      : selected.length === 1
        ? t(COMPOSE.SEND_TO, { name: friends.find((f) => f.id === selected[0])?.name ?? '' })
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
        <View className="gap-3.5">
          <SectionLabel>{t(COMPOSE.FRIENDS_SECTION)}</SectionLabel>
          <View className="gap-4">
            {friends.map((f) => (
              <PersonRow
                key={f.id}
                avatar={f.avatarUrl}
                name={f.name}
                subtitle={f.tagline ?? undefined}
                size={46}
                onPress={() => toggle(f.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected.includes(f.id) }}
                trailing={<Checkbox checked={selected.includes(f.id)} />}
              />
            ))}
          </View>
        </View>

        {notOnGlimpse.length > 0 ? (
          <View className="gap-3.5">
            <SectionLabel>{t(COMPOSE.WAITING_SECTION)}</SectionLabel>
            <View className="gap-4">
              {notOnGlimpse.map((p) => (
                <PersonRow
                  key={p.id}
                  avatar={p.photo}
                  name={p.first_name}
                  subtitle={p.tagline ?? undefined}
                  size={46}
                  dimmed
                  trailing={<Checkbox checked={false} />}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-3.5">
          <EmptyState
            title={t(COMPOSE.INVITE_TITLE)}
            body={t(COMPOSE.INVITE_BODY)}
            cta={t(COMPOSE.INVITE_CTA)}
            artSize={112}
            onPress={() => router.push('/(app)/friends/search')}
          />
        </View>

        {error ? (
          <Text variant="meta" className="mt-2 text-center text-purple-deep">
            {errorMessage(error)}
          </Text>
        ) : null}
      </ScrollView>

      <View className="px-gutter pt-3">
        <Button
          label={ctaLabel}
          onPress={() => send.mutate()}
          size="lg"
          disabled={selected.length === 0 || !composer.uri}
          loading={send.isPending}
        />
      </View>
    </Screen>
  );
}
