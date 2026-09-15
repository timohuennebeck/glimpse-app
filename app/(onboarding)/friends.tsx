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
import { COMMON, FRIENDS, ONBOARDING } from '@/shared/i18n/keys';
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
  const [copied, setCopied] = useState(false);
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
          label={t(ONBOARDING.FRIENDS.CTA)}
          onPress={() => router.push('/(onboarding)/notifications')}
          secondary={t(ONBOARDING.FRIENDS.SKIP)}
          onSecondary={() => router.push('/(onboarding)/notifications')}
        />
      }
      scroll
    >
      <ProgressHeader step={5} onClose={() => router.back()} />

      <Text variant="displaySm" className="mt-[26px] text-ink">
        {t(ONBOARDING.FRIENDS.TITLE)}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t(ONBOARDING.FRIENDS.SUBTITLE)}
      </Text>

      <View className="mt-5 h-field flex-row items-center gap-3 rounded-pill bg-surface-lilac px-[18px]">
        <Search size={20} color={colors.mutedLilac} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(ONBOARDING.FRIENDS.SEARCH_PLACEHOLDER)}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 p-0 font-sans text-[16.5px] text-ink"
        />
      </View>

      {searching ? (
        <View className="mt-6 gap-3.5">
          <SectionLabel>{t(FRIENDS.SEARCH.RESULTS_SECTION, { count: results.length })}</SectionLabel>
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
                {t(FRIENDS.SEARCH.EMPTY)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* The link on show is the handle; the actions hand out a real invite
          token, which is what makes the person who opens it claimable. */}
      <ShareRow
        className="mt-[22px]"
        dividerLabel={t(ONBOARDING.FRIENDS.DIVIDER_SHARE)}
        link={handle}
        linkLabel={t(ONBOARDING.FRIENDS.SHARE_LINK)}
        actions={[
          {
            label: copied ? t(COMMON.COPIED) : t(ONBOARDING.FRIENDS.SHARE_COPY),
            icon: <Copy size={22} color={colors.inkFaint} strokeWidth={2} />,
            onPress: () => {
              void copyInvite().then(() => setCopied(true));
            },
          },
          {
            label: t(ONBOARDING.FRIENDS.SHARE_MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => {
              void shareInvite(me?.first_name ?? '').then((outcome) => setCopied(outcome === 'copied'));
            },
          },
        ]}
      />
    </Screen>
  );
}
