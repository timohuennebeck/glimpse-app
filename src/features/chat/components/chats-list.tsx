import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { CameraBadgeIcon } from '@/shared/ui/icons';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { CHAT } from '@/shared/i18n/keys';
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
      <View className="mt-[18px] h-field-xs flex-row items-center gap-2.5 rounded-pill bg-surface-lilac px-4">
        <Search size={16} color={colors.mutedCool} strokeWidth={1.8} />
        <Text variant="bodyXs" className="text-placeholder">
          {t(CHAT.SEARCH_PLACEHOLDER)}
        </Text>
      </View>

      <View className="mt-6 gap-3.5">
        <SectionLabel trailing={t(CHAT.UNREAD_TRAILING, { count: demoUnreadCount })}>
          {t(CHAT.UNREAD_SECTION)}
        </SectionLabel>

        <View className="gap-[18px]">
          {demoThreads.map((thread) => {
            const partner = demoProfiles[thread.partner_id];
            const isUnread = thread.unread_count > 0;
            const fromMe = thread.last_sender_id === DEMO_USER_ID;

            return (
              <Pressable
                key={thread.last_message_id}
                className="flex-row items-center gap-[13px]"
                onPress={() => router.push(`/chat/${thread.partner_id}`)}
              >
                <Avatar source={partner.photo} size={52} ring={isUnread ? 'active' : 'none'} />

                <View className="min-w-0 flex-1 gap-[3px]">
                  <Text variant="rowTitleSm" className="text-ink" numberOfLines={1}>
                    {partner.first_name}
                  </Text>
                  <View className="min-w-0 flex-row items-center gap-1.5">
                    {thread.last_moment_id && !thread.last_content ? <CameraBadgeIcon size={14} /> : null}
                    <Text
                      variant="meta"
                      weight={isUnread ? 'semibold' : undefined}
                      className={cn('flex-1', isUnread ? 'text-ink-body' : 'text-muted-violet')}
                      numberOfLines={1}
                    >
                      {(fromMe ? t(CHAT.YOU_PREFIX) : '') + (thread.last_content ?? t(CHAT.SENT_PHOTO))}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2.5">
                  {thread.photo ? (
                    <Image
                      source={thread.photo}
                      className="h-[50px] w-[38px] rounded-tile border-[1.5px] border-border-chip"
                      contentFit="cover"
                    />
                  ) : null}
                  {isUnread ? (
                    <View className="h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-purple px-[7px]">
                      <Text variant="caption" weight="semibold" className="text-white">
                        {String(thread.unread_count)}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="caption" className="text-muted-lilac">
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
