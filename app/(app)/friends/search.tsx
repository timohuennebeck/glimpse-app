import { useState } from 'react';
import { Share, TextInput, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MoreHorizontal, QrCode, Search, X } from 'lucide-react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, FRIENDS } from '@/shared/i18n/keys';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { demoFriendRequests, demoOthers } from '@/shared/lib/fixtures';
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
      p.first_name.toLowerCase().includes(needle) ||
      (p.username ?? '').includes(needle),
  );

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
            <X size={9} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-[26px] gap-3.5">
        <SectionLabel>{t(FRIENDS.SEARCH.RESULTS_SECTION, { count: results.length })}</SectionLabel>
        <View className="gap-[18px]">
          {results.map((p) => {
            const state = states[p.id] ?? 'add';
            // Mutual count only where the fixture actually has one; no invented numbers.
            const mutual = demoFriendRequests.find((r) => r.profile.id === p.id)?.mutual;
            const detail =
              state === 'friends'
                ? t(FRIENDS.SEARCH.ALREADY_FRIENDS)
                : mutual
                  ? t(FRIENDS.SEARCH.MUTUAL, { count: mutual })
                  : null;
            return (
              <PersonRow
                key={p.id}
                avatar={p.photo}
                name={p.first_name}
                subtitle={detail ? `@${p.username} · ${detail}` : `@${p.username}`}
                verified={state === 'friends'}
                onPress={() => router.push(`/profile/${p.id}`)}
                trailing={
                  state === 'add' ? (
                    <Pill
                      label={t(FRIENDS.SEARCH.ADD)}
                      tone="filled"
                      onPress={() => setStates((s) => ({ ...s, [p.id]: 'sent' }))}
                    />
                  ) : state === 'sent' ? (
                    <Pill label={t(FRIENDS.SEARCH.SENT)} tone="quiet" />
                  ) : (
                    <Pill label={t(FRIENDS.SEARCH.REQUEST)} tone="outline" />
                  )
                }
              />
            );
          })}
          {results.length === 0 ? (
            <Text variant="bodySm" className="text-muted-lilac">
              {t(FRIENDS.SEARCH.EMPTY)}
            </Text>
          ) : null}
        </View>
      </View>

      <ShareRow
        className="mt-[30px]"
        dividerLabel={t(FRIENDS.SEARCH.DIVIDER_SHARE)}
        link={t(COMMON.PROFILE_LINK)}
        linkLabel={t(FRIENDS.SEARCH.LINK)}
        actions={[
          {
            label: t(FRIENDS.SEARCH.QR),
            icon: <QrCode size={22} color={colors.inkFaint} strokeWidth={2} />,
          },
          {
            label: t(FRIENDS.SEARCH.MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => void Share.share({ message: t(COMMON.PROFILE_LINK) }),
          },
        ]}
      />
    </Screen>
  );
}
