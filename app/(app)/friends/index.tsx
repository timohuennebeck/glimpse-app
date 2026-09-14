import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ClockIcon, PlusIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { avatarSize, radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { relativeTime } from '@/shared/lib/format';
import { useMutation } from '@tanstack/react-query';
import { errorMessage } from '@/shared/lib/error-message';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { StoryRail } from '@/features/feed/components/story-rail';
import { ChatsList } from '@/features/chat/components/chats-list';
import { TabScreen } from '@/features/navigation/tab-screen';
import {
  AVATARS,
  demoFriendRequests,
  demoProfiles,
  demoSentRequests,
  demoUnreadCount,
  DEMO_USER_ID,
} from '@/shared/lib/fixtures';
import { respondToFriendRequest } from '@/features/friends/data/friends-api';
import { openProfile } from '@/features/profile/open-profile';
type Tab = 'friends' | 'chats';

/**
 * Screen `08 Freunde` — the story rail, incoming requests, and outgoing requests
 * still waiting. The three sections map 1:1 onto `friendships` rows read from
 * three angles (see docs/database.md §4).
 */
export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  const [requests, setRequests] = useState(demoFriendRequests);
  // Counts on the toggle, so it says how much is waiting behind each tab.
  const badges: Record<Tab, number> = { friends: requests.length, chats: demoUnreadCount };

  const rail = [
    { id: DEMO_USER_ID, name: t('common.you'), avatar: AVATARS.self, waiting: true },
    { id: demoProfiles.mia.id, name: demoProfiles.mia.display_name, avatar: AVATARS.mia, waiting: false },
  ];
  const waiting = rail.filter((item) => item.waiting).length;

  const accept = useMutation({
    mutationFn: (id: string) => respondToFriendRequest(id, 'accepted'),
    onSuccess: (_, id) => setRequests((rs) => rs.filter((r) => r.id !== id)),
  });

  return (
    <TabScreen>
      <View style={styles.headerRow}>
        <Text variant="screenTitle" color={colors.ink}>
          {t('friends.title')}
        </Text>
        <GlassButton
          size={38}
          onPress={() => router.push('/(app)/friends/search')}
          accessibilityLabel={t('friends.search.title')}
        >
          <PlusIcon size={18} color={colors.purpleMuted} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View style={styles.segment}>
        {(['friends', 'chats'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            style={[styles.segmentItem, tab === key && styles.segmentItemActive]}
          >
            <Text
              variant="bodyXs"
              color={tab === key ? colors.purpleDeep : colors.mutedLilac}
              style={styles.segmentLabel}
            >
              {t(key === 'friends' ? 'friends.tabFriends' : 'friends.tabChats')}
            </Text>
            {badges[key] > 0 ? (
              <View style={styles.segmentBadge}>
                <Text variant="captionXs" color={colors.white} style={styles.segmentBadgeText}>
                  {String(badges[key])}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {tab === 'chats' ? (
        <ChatsList />
      ) : (
        <>
          <View style={styles.section}>
            <SectionLabel trailing={waiting > 0 ? t('feed.storiesTrailing', { count: waiting }) : undefined}>
              {t('friends.storiesLabel')}
            </SectionLabel>
            <StoryRail
              size={avatarSize.ring}
              items={rail}
              placeholders={2}
              placeholderLabel={t('feed.addFriend')}
              onPressItem={openProfile}
              onPressPlaceholder={() => router.push('/(app)/friends/search')}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('friends.requestsSection', { count: requests.length })}</SectionLabel>
            <View style={styles.list}>
              {requests.map((r) => (
                <PersonRow
                  key={r.id}
                  avatar={r.profile.photo}
                  name={r.profile.display_name}
                  subtitle={t('friends.search.mutual', { count: r.mutual })}
                  verified={r.verified}
                  trailing={
                    <Pill
                      label={t('friends.accept')}
                      tone={r.verified ? 'filled' : 'outline'}
                      onPress={() => accept.mutate(r.id)}
                    />
                  }
                  onPress={() => router.push(`/profile/${r.profile.id}`)}
                />
              ))}
              {accept.error ? (
                <Text variant="meta" color={colors.purpleDeep}>
                  {errorMessage(accept.error)}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.section}>
            <SectionLabel>{t('friends.sentSection', { count: demoSentRequests.length })}</SectionLabel>
            <View style={styles.list}>
              {demoSentRequests.map((r) => (
                <PersonRow
                  key={r.id}
                  avatar={r.profile.photo}
                  name={r.profile.display_name}
                  subtitle={t('friends.sentAgo', { time: relativeTime(r.sentAt) })}
                  subtitleIcon={<ClockIcon size={14} />}
                  dimmed
                  trailing={<Pill label={t('friends.pending')} tone="muted" />}
                />
              ))}
            </View>
          </View>

          <CtaFooter label={t('friends.addCta')} onPress={() => router.push('/(app)/friends/search')} />
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
  },
  segment: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: colors.surfaceLilac,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  segmentBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  segmentBadgeText: { fontWeight: '600' },
  segmentItemActive: { backgroundColor: colors.white },
  segmentLabel: { fontWeight: '600' },
  section: { marginTop: 22, gap: 14 },
  list: { gap: 16 },
});
