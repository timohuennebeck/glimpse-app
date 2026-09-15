import { ActivityIndicator, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { retrySend, useOutbox } from '@/features/moments/hooks/use-outbox';
/**
 * A slim line above the feed cards while a send is still going.
 *
 * The screen that took the photo is gone by the time the upload finishes, so
 * this is the only place that can say it is in flight — or that it failed.
 */
export function OutboxLine() {
  const { entries } = useOutbox();
  const queryClient = useQueryClient();
  if (entries.length === 0) return null;

  return (
    <View className="gap-2">
      {entries.map((entry) => {
        const names = entry.names.join(', ');
        if (entry.status === 'failed') {
          return (
            <View
              key={entry.id}
              className="flex-row items-center gap-2 rounded-pill bg-surface-violet px-3.5 py-2"
            >
              {/* The real reason where there is one: "Nothing is swallowed",
                  and the recipients screen it happened on is long gone. */}
              <Text variant="meta" className="flex-1 text-purple-deep" numberOfLines={1}>
                {entry.error ?? t('feed.outbox.failed', { names })}
              </Text>
              <Pressable
                onPress={() => retrySend(entry.id, queryClient)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text variant="meta" weight="semibold" className="text-purple-deep">
                  {t('feed.outbox.retry')}
                </Text>
              </Pressable>
            </View>
          );
        }
        return (
          <View
            key={entry.id}
            className="flex-row items-center gap-2 rounded-pill bg-surface-lilac px-3.5 py-2"
          >
            <ActivityIndicator size="small" color={colors.purple} />
            <Text variant="meta" className="flex-1 text-muted-violet" numberOfLines={1}>
              {t('feed.outbox.sending', { names })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
