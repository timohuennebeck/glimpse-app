import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  CheckIcon,
  CopyIcon,
  Divider,
  LinkIcon,
  MoreIcon,
  ProgressHeader,
  Screen,
  SearchIcon,
  Text,
} from '@/shared/ui';
import { colors, controlHeight, radius, spacing } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { PersonRow } from '@/features/friends/components/PersonRow';
import { Pill } from '@/features/friends/components/Pill';
import { ContactsInvite } from '@/features/onboarding/components/ContactsInvite';
import { demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';

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

  const suggestions = Object.values(demoProfiles)
    .filter((p) => p.id !== DEMO_USER_ID)
    .slice(0, 3);

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

      <View style={styles.shareSection}>
        <Divider label={t('onboarding.friends.dividerShare')} />
        <View style={styles.shareRow}>
          <View style={styles.shareLinkCol}>
            <View style={styles.shareLink}>
              <LinkIcon size={16} />
              <Text variant="subtitle" color={colors.inkSoft} numberOfLines={1} style={styles.flex}>
                glimpse.app/@du
              </Text>
            </View>
            <Text variant="captionXs" color={colors.muted}>
              {t('onboarding.friends.shareLink')}
            </Text>
          </View>

          <ShareAction label={t('onboarding.friends.shareCopy')} icon={<CopyIcon size={22} />} />
          <ShareAction label={t('onboarding.friends.shareMore')} icon={<MoreIcon size={22} />} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label={t('onboarding.friends.cta')}
          onPress={() => router.push('/(onboarding)/notifications')}
        />
        <Text
          variant="buttonSm"
          color={colors.inkSoft}
          center
          onPress={() => router.push('/(onboarding)/notifications')}
        >
          {t('onboarding.friends.skip')}
        </Text>
      </View>
    </Screen>
  );
}

function ShareAction({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={styles.shareAction}>
      <View style={styles.shareCircle}>{icon}</View>
      <Text variant="captionXs" color={colors.muted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  shareSection: { marginTop: 22, gap: 18 },
  shareRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  shareLinkCol: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  shareLink: {
    width: '100%',
    height: controlHeight.fieldSm,
    borderRadius: radius.pill,
    borderWidth: 1.6,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  shareAction: { alignItems: 'center', gap: 6 },
  shareCircle: {
    width: controlHeight.fieldSm,
    height: controlHeight.fieldSm,
    borderRadius: controlHeight.fieldSm / 2,
    backgroundColor: colors.surfaceLilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 'auto', paddingTop: 28, gap: 22 },
});
