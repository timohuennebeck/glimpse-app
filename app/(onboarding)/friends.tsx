import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Copy, MoreHorizontal, Search } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { queries } from '@/shared/lib/queries';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { PersonRow } from '@/features/friends/components/person-row';
import { RelationshipPill } from '@/features/friends/components/relationship-pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { relationshipWith } from '@/features/friends/relationships';
import { useMe } from '@/features/profile/hooks/use-me';
import { copyInvite, shareInvite } from '@/features/invites/share-invite';
/**
 * Screen `05 Friends · 5 of 7`.
 *
 * The positioning note is emphatic that a pair is the unit of value, so this is
 * the most important step in the flow: it is the only one that can end with two
 * people able to trade. Artboard `05a`'s contacts card is gone — contacts
 * import is out of scope, and a card that mimics it leads nowhere.
 */
export default function OnboardingFriendsScreen() {
  const [query, setQuery] = useState('');
  // 'failed' covers a createInvite that never came back — offline, no session,
  // friend cap — which would otherwise be an unhandled rejection nobody sees.
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const debounced = useDebouncedValue(query);
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const searching = debounced.trim().length > 0;
  const { data: results = [] } = useQuery({ ...queries.friends.search(debounced), enabled: searching });
  const handle = me?.username ? `@${me.username}` : '';

  return (
    <Screen
      footer={
        <CtaFooter
          label={t('onboarding.friends.cta')}
          onPress={() => router.push('/(onboarding)/notifications')}
          secondary={t('onboarding.friends.skip')}
          onSecondary={() => router.push('/(onboarding)/notifications')}
        />
      }
      scroll
    >
      <ProgressHeader step={5} onClose={() => router.back()} />

      <Text variant="displaySm" className="mt-[26px] text-ink">
        {t('onboarding.friends.title')}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t('onboarding.friends.subtitle')}
      </Text>

      <View className="mt-5 h-field flex-row items-center gap-3 rounded-pill bg-surface-lilac px-[18px]">
        <Search size={20} color={colors.mutedLilac} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('onboarding.friends.searchPlaceholder')}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 p-0 font-sans text-[16.5px] text-ink"
        />
      </View>

      {searching ? (
        <View className="mt-6 gap-3.5">
          <SectionLabel>{t('friends.search.resultsSection', { count: results.length })}</SectionLabel>
          <View className="gap-3.5">
            {results.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={person.username ? `@${person.username}` : undefined}
                trailing={
                  <RelationshipPill
                    person={person}
                    relationship={relationshipWith(friendships, me?.id ?? '', person.id)}
                    compact
                  />
                }
              />
            ))}
            {results.length === 0 ? (
              <Text variant="bodySm" className="text-muted-lilac">
                {t('friends.search.empty')}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* The link on show is the handle; the actions hand out a real invite
          token, which is what makes the person who opens it claimable. */}
      <ShareRow
        className="mt-[22px]"
        dividerLabel={t('onboarding.friends.dividerShare')}
        link={handle}
        linkLabel={t('onboarding.friends.shareLink')}
        actions={[
          {
            label:
              shareState === 'copied'
                ? t('common.copied')
                : shareState === 'failed'
                  ? t('errors.generic')
                  : t('onboarding.friends.shareCopy'),
            icon: <Copy size={22} color={colors.inkFaint} strokeWidth={2} />,
            onPress: () => {
              void copyInvite().then(
                () => setShareState('copied'),
                () => setShareState('failed'),
              );
            },
          },
          {
            label: shareState === 'failed' ? t('errors.generic') : t('onboarding.friends.shareMore'),
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
