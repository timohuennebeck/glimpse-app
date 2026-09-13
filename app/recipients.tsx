import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, GlassButton, CloseIcon, Screen, SectionLabel, Text } from '@/shared/ui';
import { colors, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { useComposer, sendMoment } from '@/features/moments';
import { PersonRow } from '@/features/friends/components/PersonRow';
import { Checkbox } from '@/features/friends/components/Checkbox';
import { EmptyState } from '@/features/feed/components/EmptyState';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';

/**
 * Screen `03c Senden · Empfänger wählen`.
 *
 * The mock splits the list in two: friends who can receive right now, and
 * dimmed contacts who are not on Glimpse yet. Sending is the last step of the
 * capture flow — from here the trade locks are created.
 */
export default function RecipientsScreen() {
  const composer = useComposer();
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const friends = useMemo(
    () => Object.values(demoProfiles).filter((p) => p.id !== DEMO_USER_ID).slice(0, 3),
    [],
  );
  const notOnGlimpse = useMemo(
    () => Object.values(demoProfiles).filter((p) => p.id !== DEMO_USER_ID).slice(3),
    [],
  );

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function send() {
    if (selected.length === 0 || !composer.uri) return;
    setSending(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        await sendMoment({
          localUri: composer.uri,
          caption: composer.caption || null,
          recipientIds: selected,
          facing: composer.facing,
        });
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
        ? t('compose.sendTo', { name: demoProfiles[selected[0]]?.display_name ?? '' })
        : t('compose.sendToMany', { count: selected.length });

  return (
    <Screen gutter={0} bottomInset={spacing.contentBottom}>
      <View style={styles.header}>
        <GlassButton size={38} onPress={() => router.back()}>
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
            {friends.map((p) => (
              <PersonRow
                key={p.id}
                avatar={p.photo}
                name={p.display_name}
                subtitle={p.tagline ?? undefined}
                size={46}
                onPress={() => toggle(p.id)}
                trailing={<Checkbox checked={selected.includes(p.id)} />}
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
