import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, QrCode, Search, X } from 'lucide-react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, ERRORS, FRIENDS } from '@/shared/i18n/keys';
import { queries } from '@/shared/lib/queries';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { PersonRow } from '@/features/friends/components/person-row';
import { RelationshipPill } from '@/features/friends/components/relationship-pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { relationshipWith } from '@/features/friends/relationships';
import type { PersonSummary } from '@/features/friends/interfaces';
import { useMe } from '@/features/profile/hooks/use-me';
import { shareInvite } from '@/features/invites/share-invite';
/** Screen `D Freund suchen` — search by @username, or share your link. */
export default function FriendSearchScreen() {
  const [query, setQuery] = useState('');
  // 'failed' covers a createInvite that never came back — offline, no session,
  // friend cap — which would otherwise be an unhandled rejection nobody sees.
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const debounced = useDebouncedValue(query);
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const searching = debounced.trim().length > 0;
  const { data: results = [] } = useQuery({ ...queries.friends.search(debounced), enabled: searching });

  // Sorted, so the same set of people is one cache entry however it was found.
  const ids = useMemo(() => results.map((p) => p.id).sort(), [results]);
  const { data: mutual = {} } = useQuery({ ...queries.friends.mutual(ids), enabled: ids.length > 0 });
  const handle = me?.username ? `@${me.username}` : '';

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View className="h-10 flex-row items-center gap-3">
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={13} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Text variant="sheetTitle" className="text-ink">
          {t(FRIENDS.SEARCH.TITLE)}
        </Text>
      </View>

      <View
        className={cn(
          'mt-5 h-field flex-row items-center gap-2.5 rounded-pill border-[1.5px] border-transparent bg-surface-lilac-alt px-[18px]',
          query.length > 0 && 'border-purple',
        )}
      >
        <Search size={19} color={colors.mutedViolet} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(FRIENDS.SEARCH.PLACEHOLDER)}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 p-0 font-sans text-[16.5px] text-ink"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            className="h-[22px] w-[22px] items-center justify-center rounded-[11px] bg-dot-idle-soft"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t(COMMON.CLEAR)}
          >
            {/* inkSoft, not white: white on this chip is 1.4:1 — the glyph was
                invisible and the control looked like an empty dot. */}
            <X size={9} color={colors.inkSoft} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View className="mt-[26px] gap-3.5">
          <SectionLabel>{t(FRIENDS.SEARCH.RESULTS_SECTION, { count: results.length })}</SectionLabel>
          <View className="gap-[18px]">
            {results.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={subtitleFor(person, mutual[person.id] ?? 0)}
                onPress={() => router.push(`/profile/${person.id}`)}
                trailing={
                  <RelationshipPill
                    person={person}
                    relationship={relationshipWith(friendships, me?.id ?? '', person.id)}
                  />
                }
              />
            ))}
            {results.length === 0 ? (
              <Text variant="bodySm" className="text-muted-lilac">
                {t(FRIENDS.SEARCH.EMPTY)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* QR is designed but inert; "More" mints a real invite link. */}
      <ShareRow
        className="mt-[30px]"
        dividerLabel={t(FRIENDS.SEARCH.DIVIDER_SHARE)}
        link={handle}
        linkLabel={t(FRIENDS.SEARCH.LINK)}
        actions={[
          {
            label: t(FRIENDS.SEARCH.QR),
            icon: <QrCode size={22} color={colors.inkFaint} strokeWidth={2} />,
          },
          {
            label:
              shareState === 'copied'
                ? t(COMMON.COPIED)
                : shareState === 'failed'
                  ? t(ERRORS.GENERIC)
                  : t(FRIENDS.SEARCH.MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => {
              void shareInvite(me?.first_name ?? '').then(
                (outcome) => setShareState(outcome === 'copied' ? 'copied' : 'idle'),
                () => setShareState('failed'),
              );
            },
          },
        ]}
      />
    </Screen>
  );
}

/** "@miahartmann · 3 mutual", with either half left out when there is none. */
function subtitleFor(person: PersonSummary, mutual: number): string | undefined {
  const parts = [
    person.username ? `@${person.username}` : null,
    mutual > 0 ? t(FRIENDS.SEARCH.MUTUAL, { count: mutual }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
