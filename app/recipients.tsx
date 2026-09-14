import { useEffect, useState } from 'react';
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
import { useComposer } from '@/features/moments/hooks/use-composer';
import { reloadInbox } from '@/features/moments/hooks/use-inbox';
import { createMoment, sendMoment } from '@/features/moments/data/moments-api';
import { PersonRow } from '@/features/friends/components/person-row';
import { Checkbox } from '@/features/friends/components/checkbox';
import { EmptyState } from '@/features/feed/components/empty-state';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { demoOthers } from '@/shared/lib/fixtures';
import { fetchFriends, type FriendSummary } from '@/features/friends/data/friends-api';
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
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  // A friend's profile pre-selects them; otherwise start empty.
  const [selected, setSelected] = useState<string[]>(composer.recipientIds);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Real ids from v_my_friends — fixture ids like "mia" are not uuids and
    // used to reach send_moment after the upload had already been committed.
    fetchFriends()
      .then(setFriends)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t('errors.generic')));
  }, []);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function send() {
    if (selected.length === 0 || !composer.uri) return;
    setSending(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        const momentId = await createMoment({
          localUri: composer.uri,
          caption: composer.caption || null,
          facing: composer.facing,
        });
        await sendMoment(momentId, selected);
        void reloadInbox();
      }
      composer.reset();
      router.dismissAll();
      router.replace('/(app)/feed');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.generic'));
    } finally {
      setSending(false);
    }
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
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={ctaLabel}
          onPress={send}
          size="lg"
          disabled={selected.length === 0}
          loading={sending}
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
