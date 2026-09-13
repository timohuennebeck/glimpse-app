import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  ClockIcon,
  GlassButton,
  PlusIcon,
  Screen,
  SectionLabel,
  Text,
} from '@/shared/ui';
import { colors, spacing, avatarSize, radius } from '@/shared/theme';
import { t } from '@/shared/i18n';
import { relativeTime } from '@/shared/lib/format';
import { PersonRow } from '@/features/friends/components/PersonRow';
import { Pill } from '@/features/friends/components/Pill';
import { StoryRail } from '@/features/feed/components/StoryRail';
import { AVATARS, demoFriendRequests, demoSentRequests, DEMO_USER_ID, demoThreads } from '@/shared/lib/fixtures';
import { ChatsList } from '@/features/chat/components/ChatsList';
import { TAB_BAR_CLEARANCE } from '@/features/navigation/clearance';
import { CaptureButton } from '@/features/navigation/CaptureButton';

/**
 * Screen `08 Freunde` — the story rail, incoming requests, and outgoing requests
 * still waiting. The three sections map 1:1 onto `friendships` rows read from
 * three angles (see docs/database.md §4).
 */
export default function FriendsScreen() {
  const [tab, setTab] = useState<'friends' | 'chats'>('friends');
  const unreadChats = demoThreads.reduce((n, thread) => n + thread.unread_count, 0);

  return (
    <Screen scroll bottomInset={spacing.contentBottom + TAB_BAR_CLEARANCE}>
      <View style={styles.headerRow}>
        <Text variant="screenTitle" color={colors.ink}>
          {t('friends.title')}
        </Text>
        <GlassButton size={38} onPress={() => router.push('/(app)/friends/search')}>
          <PlusIcon size={18} color={colors.purpleMuted} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View style={styles.segment}>
        {(['friends', 'chats'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.segmentItem, tab === key && styles.segmentItemActive]}
          >
            <Text
              variant="bodyXs"
              color={tab === key ? colors.purpleDeep : colors.mutedLilac}
              style={styles.segmentLabel}
            >
              {t(key === 'friends' ? 'friends.tabFriends' : 'friends.tabChats')}
            </Text>
            {/* Unread count, so the toggle says how much is waiting. */}
            {key === 'chats' && unreadChats > 0 ? (
              <View style={styles.segmentBadge}>
                <Text variant="captionXs" color={colors.white} style={styles.segmentBadgeText}>
                  {String(unreadChats)}
                </Text>
              </View>
            ) : null}
            {key === 'friends' && demoFriendRequests.length > 0 ? (
              <View style={styles.segmentBadge}>
                <Text variant="captionXs" color={colors.white} style={styles.segmentBadgeText}>
                  {String(demoFriendRequests.length)}
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
        <SectionLabel trailing={t('feed.storiesTrailing', { count: 2 })}>
          {t('friends.storiesLabel')}
        </SectionLabel>
        <StoryRail
          size={avatarSize.ring}
          items={[
            { id: DEMO_USER_ID, name: t('common.you'), avatar: AVATARS.self, waiting: true },
            { id: 'mia', name: 'Mia', avatar: AVATARS.mia, waiting: false },
          ]}
          placeholders={2}
          placeholderLabel={t('feed.addFriend')}
          onPressItem={(id) => router.push(`/profile/${id}`)}
          onPressPlaceholder={() => router.push('/(app)/friends/search')}
        />
      </View>

      <View style={styles.section}>
        <SectionLabel>{t('friends.requestsSection', { count: demoFriendRequests.length })}</SectionLabel>
        <View style={styles.list}>
          {demoFriendRequests.map((r) => (
            <PersonRow
              key={r.id}
              avatar={r.profile.photo}
              name={r.profile.display_name}
              subtitle={t('friends.search.mutual', { count: r.mutual })}
              verified={r.verified}
              trailing={<Pill label={t('friends.accept')} tone={r.verified ? 'filled' : 'outline'} onPress={() => {}} />}
              onPress={() => router.push(`/profile/${r.profile.id}`)}
            />
          ))}
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
              subtitle={t('friends.sentAgo', { time: relativeTime(r.sentAt).replace('vor ', '') })}
              subtitleIcon={<ClockIcon size={14} />}
              dimmed
              trailing={<Pill label={t('friends.pending')} tone="muted" />}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={t('friends.addCta')} onPress={() => router.push('/(app)/friends/search')} />
      </View>
      </>
      )}
      <CaptureButton />
    </Screen>
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
  footer: { marginTop: 'auto', paddingTop: 28 },
});
