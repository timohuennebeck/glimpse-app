import { useState } from 'react';
import { Share, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, MoreHorizontal, Search } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, ONBOARDING } from '@/shared/i18n/keys';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { ContactsInvite } from '@/features/onboarding/components/contacts-invite';
import { demoOthers } from '@/shared/lib/fixtures';
/**
 * Screens `05 Friends · 5 of 7` and `05a · no contacts access`.
 *
 * Both artboards are here: without contacts permission the list is replaced by
 * the stacked-avatars invite card. The positioning note is emphatic that a pair
 * is the unit of value, so this step is the most important in the flow.
 */
export default function OnboardingFriendsScreen() {
  const [hasContacts, setHasContacts] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);

  const suggestions = demoOthers.slice(0, 3);

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
        <Text variant="rowTitleSm" weight="regular" className="text-muted-cool">
          {t(ONBOARDING.FRIENDS.SEARCH_PLACEHOLDER)}
        </Text>
      </View>

      {hasContacts ? (
        <View className="mt-6 gap-3.5">
          <View className="flex-row items-center justify-between">
            <Text variant="eyebrow" className="text-muted-grey">
              {t(ONBOARDING.FRIENDS.CONTACTS_SECTION)}
            </Text>
            <View className="rounded-pill bg-surface-violet-chip px-2.5 py-1">
              <Text variant="caption" weight="semibold" className="text-purple-muted">
                {String(suggestions.length)}
              </Text>
            </View>
          </View>

          <View className="gap-3.5">
            {suggestions.map((p) => {
              const done = invited.includes(p.id);
              return (
                <PersonRow
                  key={p.id}
                  avatar={p.photo}
                  name={p.first_name}
                  subtitle={p.tagline ?? undefined}
                  trailing={
                    done ? (
                      <Pill label={t(ONBOARDING.FRIENDS.ADDED)} tone="quiet" compact />
                    ) : (
                      <Pill
                        label={t(ONBOARDING.FRIENDS.ADD)}
                        tone="filled"
                        compact
                        onPress={() => setInvited((s) => [...s, p.id])}
                      />
                    )
                  }
                />
              );
            })}
          </View>
        </View>
      ) : (
        <ContactsInvite onPress={() => setHasContacts(true)} />
      )}

      <ShareRow
        className="mt-[22px]"
        dividerLabel={t(ONBOARDING.FRIENDS.DIVIDER_SHARE)}
        link={t(COMMON.PROFILE_LINK)}
        linkLabel={t(ONBOARDING.FRIENDS.SHARE_LINK)}
        actions={[
          {
            label: t(ONBOARDING.FRIENDS.SHARE_COPY),
            icon: <Copy size={22} color={colors.inkFaint} strokeWidth={2} />,
            onPress: () => void Clipboard.setStringAsync(t(COMMON.PROFILE_LINK)),
          },
          {
            label: t(ONBOARDING.FRIENDS.SHARE_MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => void Share.share({ message: t(COMMON.PROFILE_LINK) }),
          },
        ]}
      />
    </Screen>
  );
}
