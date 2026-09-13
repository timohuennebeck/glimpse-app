import { useState } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { CloseIcon, MoreIcon, QrIcon, SearchIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { controlHeight, radius, spacing } from '@/shared/theme/page-structure';
import { fontFamily } from '@/shared/theme/fonts';
import { t } from '@/shared/i18n/i18n';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { demoOthers } from '@/shared/lib/fixtures';
type RequestState = 'add' | 'sent' | 'friends';

/** Screen `D Freund suchen` — search by @username, or share your link. */
export default function FriendSearchScreen() {
  const [query, setQuery] = useState('');
  const [states, setStates] = useState<Record<string, RequestState>>({
    ben: 'add',
    lina: 'sent',
    alex: 'friends',
  });

  const needle = query.toLowerCase().replace('@', '');
  const results = demoOthers.filter(
    (p) =>
      query.length === 0 ||
      p.display_name.toLowerCase().includes(needle) ||
      (p.username ?? '').includes(needle),
  );

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View style={styles.headerRow}>
        <GlassButton size={34} onPress={() => router.back()}>
          <CloseIcon size={13} />
        </GlassButton>
        <Text variant="sheetTitle" color={colors.ink}>
          {t('friends.search.title')}
        </Text>
      </View>

      <View style={[styles.field, query.length > 0 && styles.fieldActive]}>
        <SearchIcon size={19} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('friends.search.placeholder')}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} style={styles.clear} hitSlop={8}>
            <CloseIcon size={9} color={colors.white} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionLabel>{t('friends.search.resultsSection', { count: results.length })}</SectionLabel>
        <View style={styles.list}>
          {results.map((p) => {
            const state = states[p.id] ?? 'add';
            return (
              <PersonRow
                key={p.id}
                avatar={p.photo}
                name={p.display_name}
                subtitle={`@${p.username} · ${
                  state === 'friends' ? t('friends.search.alreadyFriends') : t('friends.search.mutual', { count: 4 })
                }`}
                verified={state === 'friends'}
                onPress={() => router.push(`/profile/${p.id}`)}
                trailing={
                  state === 'add' ? (
                    <Pill
                      label={t('friends.search.add')}
                      tone="filled"
                      onPress={() => setStates((s) => ({ ...s, [p.id]: 'sent' }))}
                    />
                  ) : state === 'sent' ? (
                    <Pill label={t('friends.search.sent')} tone="quiet" />
                  ) : (
                    <Pill label={t('friends.search.request')} tone="outline" />
                  )
                }
              />
            );
          })}
          {results.length === 0 ? (
            <Text variant="bodySm" color={colors.mutedLilac}>
              {t('friends.search.empty')}
            </Text>
          ) : null}
        </View>
      </View>

      <ShareRow
        style={styles.share}
        dividerLabel={t('friends.search.dividerShare')}
        link="glimpse.app/@du"
        linkLabel={t('friends.search.link')}
        actions={[
          { label: t('friends.search.qr'), icon: <QrIcon size={22} /> },
          { label: t('friends.search.more'), icon: <MoreIcon size={22} /> },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 40 },
  field: {
    marginTop: 20,
    height: controlHeight.field,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLilacAlt,
    borderWidth: 1.5,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  fieldActive: { borderColor: colors.purple },
  input: { flex: 1, fontSize: 16.5, color: colors.ink, fontFamily: fontFamily.regular, padding: 0 },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.dotIdleSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: 26, gap: 14 },
  list: { gap: 18 },
  share: { marginTop: 30 },
});
