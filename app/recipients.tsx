import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { CloseIcon } from '@/shared/ui/icons';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { createMoment, sendMoment } from '@/features/moments/data/moments-api';
import { PersonRow } from '@/features/friends/components/person-row';
import { Checkbox } from '@/features/friends/components/checkbox';
import { EmptyState } from '@/features/feed/components/empty-state';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { demoOthers } from '@/shared/lib/fixtures';
/**
 * Screen `03c Senden · Empfänger wählen`.
 *
 * The mock splits the list in two: friends who can receive right now, and
 * dimmed contacts who are not on Glimpse yet. Sending is the last step of the
 * capture flow — from here the trade locks are created.
 */
// Contacts import is not built; the "not on Glimpse yet" list is fixture-only.
const notOnGlimpse = isSupabaseConfigured ? [] : demoOthers.slice(3);

export default function RecipientsScreen() {
  const composer = useComposer();
  const queryClient = useQueryClient();
  // Real ids from v_my_friends: `send_moment` takes uuids and runs only after
  // the upload has been committed, so a fixture id here would orphan the photo.
  const { data: friends = [], error: friendsError } = useQuery(queries.friends.list);
  // A friend's profile pre-selects them; otherwise start empty.
  const [selected, setSelected] = useState<string[]>(composer.recipientIds);

  const send = useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured || !composer.uri) return;
      const momentId = await createMoment({
        localUri: composer.uri,
        caption: composer.caption || null,
        facing: composer.facing,
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
      ? t('compose.sendNone')
      : selected.length === 1
        ? t('compose.sendTo', { name: friends.find((f) => f.id === selected[0])?.name ?? '' })
        : t('compose.sendToMany', { count: selected.length });

  return (
    <Screen gutter={0} bottomInset={spacing.contentBottom}>
      <View style={styles.header}>
        <GlassButton size={38} onPress={() => router.back()} accessibilityLabel={t('common.close')}>
          <CloseIcon size={12} />
        </GlassButton>
        <Text variant="cardTitleLg" color={colors.ink}>
          {t('compose.recipientsTitle')}
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <SectionLabel>{t('compose.friendsSection')}</SectionLabel>
          <View style={styles.list}>
            {friends.map((f) => (
              <PersonRow
                key={f.id}
                avatar={f.avatar ?? ''}
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
          <View style={styles.section}>
            <SectionLabel>{t('compose.waitingSection')}</SectionLabel>
            <View style={styles.list}>
              {notOnGlimpse.map((p) => (
                <PersonRow
                  key={p.id}
                  avatar={p.photo}
                  name={p.display_name}
                  subtitle={p.tagline ?? undefined}
                  size={46}
                  dimmed
                  trailing={<Checkbox checked={false} />}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <EmptyState
            title={t('compose.inviteTitle')}
            body={t('compose.inviteBody')}
            cta={t('compose.inviteCta')}
            artSize={112}
            onPress={() => router.push('/(app)/friends/search')}
          />
        </View>

        {error ? (
          <Text variant="meta" color={colors.purpleDeep} center style={styles.error}>
            {errorMessage(error)}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.gutter,
  },
  scroll: { paddingTop: 30, paddingHorizontal: spacing.gutter, gap: 26, paddingBottom: 24 },
  section: { gap: 14 },
  list: { gap: 16 },
  footer: { paddingHorizontal: spacing.gutter, paddingTop: 12 },
  error: { marginTop: 8 },
});
