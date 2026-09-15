import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { CameraBadgeIcon } from '@/shared/ui/icons';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { threadTime } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * The conversation list, backed by `public.v_threads`.
 *
 * Lives in a component rather than a screen because it is shown inside the
 * Friends tab — the positioning note says to keep messaging a small part of the
 * app, not a destination of its own.
 */
export function ChatsList() {
  const { data: threads = [] } = useQuery(queries.chat.threads);
  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const unread = threads.reduce((total, thread) => total + thread.unreadCount, 0);

  return (
    <View>
      {/* Decorative in the mock and still decorative: searching a list this
          short is not a feature, and chat search is out of scope. */}
      <View className="mt-[18px] h-field-xs flex-row items-center gap-2.5 rounded-pill bg-surface-lilac px-4">
        <Search size={16} color={colors.mutedCool} strokeWidth={1.8} />
        <Text variant="bodyXs" className="text-placeholder">
          {t('chat.searchPlaceholder')}
        </Text>
      </View>

      <View className="mt-6 gap-3.5">
        <SectionLabel trailing={unread > 0 ? t('chat.unreadTrailing', { count: unread }) : undefined}>
          {t('chat.unreadSection')}
        </SectionLabel>

        <View className="gap-[18px]">
          {threads.map((thread) => {
            const isUnread = thread.unreadCount > 0;
            const fromMe = thread.lastSenderId === myId;

            return (
              <Pressable
                key={thread.partner.id}
                className="flex-row items-center gap-[13px]"
                onPress={() => router.push(`/chat/${thread.partner.id}`)}
              >
                <Avatar
                  source={thread.partner.avatarUrl}
                  name={thread.partner.name}
                  size={52}
                  ring={isUnread ? 'active' : 'none'}
                />

                <View className="min-w-0 flex-1 gap-[3px]">
                  <Text variant="rowTitleSm" className="text-ink" numberOfLines={1}>
                    {thread.partner.name}
                  </Text>
                  <View className="min-w-0 flex-row items-center gap-1.5">
                    {thread.lastMomentId && !thread.lastContent ? <CameraBadgeIcon size={14} /> : null}
                    <Text
                      variant="meta"
                      weight={isUnread ? 'semibold' : undefined}
                      className={cn('flex-1', isUnread ? 'text-ink-body' : 'text-muted-violet')}
                      numberOfLines={1}
                    >
                      {(fromMe ? t('chat.youPrefix') : '') + (thread.lastContent ?? t('chat.sentPhoto'))}
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
                        {String(thread.unreadCount)}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="caption" className="text-muted-lilac">
                      {threadTime(thread.lastAt)}
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
