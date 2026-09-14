import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowUp, MoreHorizontal, Paperclip, Plus, X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { threadTime } from '@/shared/lib/format';
import { demoMessages, demoProfiles, DEMO_USER_ID } from '@/shared/lib/fixtures';
/**
 * Screen `09 Chat`.
 *
 * Note the positioning note explicitly says to cut open chat — this stays 1:1
 * only, reachable from a friend, with no group threads and no discovery.
 */
export default function ChatScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const partner = demoProfiles[partnerId ?? 'mia'] ?? demoProfiles.mia;

  const messages = useMemo(
    () => demoMessages.filter((m) => m.sender_id === partner.id || m.recipient_id === partner.id),
    [partner.id],
  );

  return (
    <Screen gutter={0} bottomInset={0}>
      <View className="h-[60px] flex-row items-center gap-3 px-gutter">
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t('common.close')}>
          <X size={12} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Avatar source={partner.photo} size={40} />
        <View className="flex-1 gap-px">
          <Text variant="rowTitle" className="text-ink">
            {partner.first_name}
          </Text>
          <Text variant="metaXs" className="text-muted-lilac">
            {t('chat.online')}
          </Text>
        </View>
        <GlassButton size={34} accessibilityLabel={t('common.more')}>
          <MoreHorizontal size={17} color={colors.inkFaint} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-gutter pb-2 pt-[18px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="self-center rounded-pill bg-surface-lilac px-3.5 py-1.5">
          <Text variant="caption" className="text-muted-lilac">
            {t('chat.dayToday')}
          </Text>
        </View>

        {messages.map((message) => {
          const mine = message.sender_id === DEMO_USER_ID;
          return (
            <View key={message.id} className={mine ? 'flex-row justify-end' : 'flex-row items-end gap-2.5'}>
              {!mine ? <Avatar source={partner.photo} size={30} /> : null}

              <View className={cn('shrink gap-1.5', mine && 'items-end')}>
                <Text variant="caption" className="text-muted-lilac">
                  {threadTime(message.created_at)}
                </Text>
                <View className="flex-row items-end gap-2.5">
                  {message.photo ? (
                    <Image
                      source={message.photo}
                      className="h-[104px] w-[78px] rounded-chip border-[1.5px] border-border-chip"
                      contentFit="cover"
                    />
                  ) : null}
                  {message.content ? (
                    <View
                      className={cn(
                        'max-w-[264px] rounded-[22px] px-4 py-3',
                        mine ? 'rounded-br-[8px] bg-purple' : 'rounded-bl-[8px] bg-surface-violet',
                      )}
                    >
                      <Text variant="bodyXs" className={mine ? 'text-white' : 'text-ink-body'}>
                        {message.content}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="m-4 mb-6 gap-[18px] rounded-lg border border-border-lilac-alt bg-white px-4 pb-3 pt-[15px]"
          // Shadows stay as a style: RN's shadow props have no CSS equivalent NativeWind maps.
          style={shadow.card}
        >
          <TextInput
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={colors.placeholder}
            className="max-h-[100px] p-0 font-sans text-[15.5px] text-ink-body"
            multiline
          />
          {/* Sending is not wired (no messages API on the client yet), so the
              controls are rendered but disabled rather than pretending. */}
          <View className="flex-row items-center gap-3.5">
            <Plus size={19} color={colors.inkBody} strokeWidth={2} />
            <Paperclip size={19} color={colors.inkBody} strokeWidth={1.8} />
            <View className="flex-1" />
            <Pressable
              className="h-9 w-9 items-center justify-center rounded-[18px] bg-purple"
              disabled
              accessibilityRole="button"
              accessibilityLabel={t('chat.send')}
              accessibilityState={{ disabled: true }}
            >
              <ArrowUp size={17} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
