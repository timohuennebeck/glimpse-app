import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Avatar } from '@/shared/ui/avatar';
import { CameraBadgeIcon, SearchIcon } from '@/shared/ui/icons';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { controlHeight, radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { threadTime } from '@/shared/lib/format';
import { demoThreads, demoProfiles, demoUnreadCount, DEMO_USER_ID } from '@/shared/lib/fixtures';
/**
 * The conversation list, backed by `public.v_threads`.
 *
 * Lives in a component rather than a screen because it is shown inside the
 * Friends tab — the positioning note says to keep messaging a small part of the
 * app, not a destination of its own.
 */
export function ChatsList() {
  return (
    <View>
      <View style={styles.search}>
        <SearchIcon size={16} color={colors.mutedCool} strokeWidth={1.8} />
        <Text variant="bodyXs" color={colors.placeholder}>
          {t('chat.searchPlaceholder')}
        </Text>
      </View>

      <View style={styles.section}>
        <SectionLabel trailing={t('chat.unreadTrailing', { count: demoUnreadCount })}>
          {t('chat.unreadSection')}
        </SectionLabel>

        <View style={styles.list}>
          {demoThreads.map((thread) => {
            const partner = demoProfiles[thread.partner_id];
            const isUnread = thread.unread_count > 0;
            const fromMe = thread.last_sender_id === DEMO_USER_ID;

            return (
              <Pressable
                key={thread.last_message_id}
                style={styles.row}
                onPress={() => router.push(`/chat/${thread.partner_id}`)}
              >
                <Avatar source={partner.photo} size={52} ring={isUnread ? 'active' : 'none'} />

                <View style={styles.rowText}>
                  <Text variant="rowTitleSm" color={colors.ink} numberOfLines={1}>
                    {partner.display_name}
                  </Text>
                  <View style={styles.preview}>
                    {thread.last_moment_id && !thread.last_body ? <CameraBadgeIcon size={14} /> : null}
                    <Text
                      variant="meta"
                      color={isUnread ? colors.inkBody : colors.mutedViolet}
                      numberOfLines={1}
                      style={[styles.flex, isUnread && styles.unreadText]}
                    >
                      {(fromMe ? t('chat.youPrefix') : '') + (thread.last_body ?? t('chat.sentPhoto'))}
                    </Text>
                  </View>
                </View>

                <View style={styles.rowTrailing}>
                  {thread.photo ? (
                    <Image source={thread.photo} style={styles.thumb} contentFit="cover" />
                  ) : null}
                  {isUnread ? (
                    <View style={styles.badge}>
                      <Text variant="caption" color={colors.white} style={styles.badgeText}>
                        {String(thread.unread_count)}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="caption" color={colors.mutedLilac}>
                      {threadTime(thread.last_at)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: {
    marginTop: 18,
    height: controlHeight.fieldXs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceLilac,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  section: { marginTop: 24, gap: 14 },
  list: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowText: { flex: 1, minWidth: 0, gap: 3 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  unreadText: { fontWeight: '600' },
  rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: {
    width: 38,
    height: 50,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    borderColor: colors.borderChip,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: { fontWeight: '600' },
});
