import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { CopyIcon, MoreIcon, SearchIcon } from '@/shared/ui/icons';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { controlHeight, radius, spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
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
    <Screen scroll bottomInset={spacing.contentBottom}>
      <ProgressHeader step={5} onClose={() => router.back()} />

      <Text variant="displaySm" color={colors.ink} style={styles.title}>
        {t('onboarding.friends.title')}
      </Text>
      <Text variant="bodySm" color={colors.muted} style={styles.subtitle}>
        {t('onboarding.friends.subtitle')}
      </Text>

      <View style={styles.search}>
        <SearchIcon size={20} color={colors.mutedLilac} strokeWidth={2.2} />
        <Text variant="rowTitleSm" color={colors.mutedCool} style={styles.searchText}>
          {t('onboarding.friends.searchPlaceholder')}
        </Text>
      </View>

      {hasContacts ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="eyebrow" color={colors.mutedGrey}>
              {t('onboarding.friends.contactsSection')}
            </Text>
            <View style={styles.countChip}>
              <Text variant="caption" color={colors.purpleMuted} style={styles.countText}>
                {String(suggestions.length)}
              </Text>
            </View>
          </View>

          <View style={styles.list}>
            {suggestions.map((p) => {
              const done = invited.includes(p.id);
              return (
                <PersonRow
                  key={p.id}
                  avatar={p.photo}
                  name={p.display_name}
                  subtitle={p.tagline ?? undefined}
                  trailing={
                    done ? (
                      <Pill label={t('onboarding.friends.added')} tone="quiet" compact />
                    ) : (
                      <Pill
                        label={t('onboarding.friends.add')}
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
        style={styles.share}
        dividerLabel={t('onboarding.friends.dividerShare')}
        link="glimpse.app/@du"
        linkLabel={t('onboarding.friends.shareLink')}
        actions={[
          { label: t('onboarding.friends.shareCopy'), icon: <CopyIcon size={22} /> },
          { label: t('onboarding.friends.shareMore'), icon: <MoreIcon size={22} /> },
        ]}
      />

      <CtaFooter
        label={t('onboarding.friends.cta')}
        onPress={() => router.push('/(onboarding)/notifications')}
        secondary={t('onboarding.friends.skip')}
        onSecondary={() => router.push('/(onboarding)/notifications')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 26 },
  subtitle: { marginTop: 12 },
  search: {
    marginTop: 20,
    height: controlHeight.field,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLilac,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
  },
  searchText: { fontWeight: '400' },
  section: { marginTop: 24, gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countChip: {
    backgroundColor: colors.surfaceVioletChip,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontWeight: '600' },
  list: { gap: 14 },
  share: { marginTop: 22 },
});
