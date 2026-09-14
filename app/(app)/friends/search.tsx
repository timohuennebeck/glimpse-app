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
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t('common.close')}>
          <X size={13} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Text variant="sheetTitle" className="text-ink">
          {t('friends.search.title')}
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
          placeholder={t('friends.search.placeholder')}
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
            accessibilityLabel={t('common.clear')}
          >
            <X size={9} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      <View className="mt-[26px] gap-3.5">
        <SectionLabel>{t('friends.search.resultsSection', { count: results.length })}</SectionLabel>
        <View className="gap-[18px]">
          {results.map((p) => {
            const state = states[p.id] ?? 'add';
            // Mutual count only where the fixture actually has one; no invented numbers.
            const mutual = demoFriendRequests.find((r) => r.profile.id === p.id)?.mutual;
            const detail =
              state === 'friends'
                ? t('friends.search.alreadyFriends')
                : mutual
                  ? t('friends.search.mutual', { count: mutual })
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
            <Text variant="bodySm" className="text-muted-lilac">
              {t('friends.search.empty')}
            </Text>
          ) : null}
        </View>
      </View>

      <ShareRow
        className="mt-[30px]"
        dividerLabel={t('friends.search.dividerShare')}
        link={t('common.profileLink')}
        linkLabel={t('friends.search.link')}
        actions={[
          {
            label: t('friends.search.qr'),
            icon: <QrCode size={22} color={colors.inkFaint} strokeWidth={2} />,
          },
          {
            label: t('friends.search.more'),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => void Share.share({ message: t('common.profileLink') }),
          },
        ]}
      />
    </Screen>
  );
}
