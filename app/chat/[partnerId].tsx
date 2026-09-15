import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, MoreHorizontal, Paperclip, Plus, X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { CHAT, COMMON } from '@/shared/i18n/keys';
import { threadTime } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { draftMessage, useMarkThreadRead, useSendMessage } from '@/features/chat/data/chat-mutations';
import { usePartnerPresence } from '@/features/chat/hooks/use-partner-presence';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import { useOncePerKey } from '@/shared/lib/use-once-per-key';
/**
 * Screen `09 Chat`.
 *
 * Note the positioning note explicitly says to cut open chat — this stays 1:1
 * only, reachable from a friend, with no group threads and no discovery.
 *
 * The mock's standing "Today" chip is gone: with real messages it would sit
 * above ones sent last week. Each bubble carries its own time, and `threadTime`
 * already says "Yesterday" or the weekday when that is what it is.
 */
export default function ChatScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const id = partnerId ?? '';
  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: partner } = useQuery({ ...queries.profile.byId(id), enabled: id.length > 0 });
  const { data: messages = [] } = useQuery({ ...queries.chat.messages(id), enabled: id.length > 0 });

  const send = useSendMessage(id);
  const { mutate: markRead } = useMarkThreadRead(id);
  const present = usePartnerPresence(myId, id);

  const partnerAvatar = avatarUrl(partner?.avatar_storage_path ?? null);
  const partnerName = partner?.first_name ?? '';

  // Opening a conversation reads it. Keyed by the newest unread message rather
  // than by "is anything unread": marking read patches `readAt` on every
  // incoming message and a failure rolls all of them back, which used to
  // re-arm this write forever. A genuinely new arrival changes the key, so it
  // still gets marked read while the screen is open.
  const newestUnread = messages.reduce<string | null>(
    (latest, message) => (message.recipientId === myId && message.readAt === null ? message.id : latest),
    null,
  );
  useOncePerKey(newestUnread, markRead);

  // A new message belongs in view, whether I sent it or it just arrived.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  function submit() {
    const content = draft.trim();
    if (content.length === 0 || myId.length === 0 || id.length === 0) return;
    send.mutate(draftMessage({ senderId: myId, recipientId: id, content }));
    setDraft('');
  }

  return (
    <Screen gutter={0} bottomInset={0}>
      <View className="h-[60px] flex-row items-center gap-3 px-gutter">
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={12} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Avatar source={partnerAvatar} name={partnerName} size={40} />
        <View className="flex-1 gap-px">
          <Text variant="rowTitle" className="text-ink">
            {partnerName}
          </Text>
          {present ? (
            <Text variant="metaXs" className="text-muted-lilac">
              {t(CHAT.ONLINE)}
            </Text>
          ) : null}
        </View>
        <GlassButton size={34} accessibilityLabel={t(COMMON.MORE)}>
          <MoreHorizontal size={17} color={colors.inkFaint} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 px-gutter pb-2 pt-[18px]"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <View key={message.id} className={mine ? 'flex-row justify-end' : 'flex-row items-end gap-2.5'}>
              {!mine ? <Avatar source={partnerAvatar} name={partnerName} size={30} /> : null}

              <View className={cn('shrink gap-1.5', mine && 'items-end')}>
                <Text variant="caption" className="text-muted-lilac">
                  {threadTime(message.createdAt)}
                </Text>
                {message.content ? (
                  <View
                    className={cn(
                      'max-w-[264px] rounded-[22px] px-4 py-3',
                      mine ? 'rounded-br-[8px] bg-purple' : 'rounded-bl-[8px] bg-surface-violet',
                      // Still in flight: present, but not yet a fact.
                      message.pending && 'opacity-60',
                    )}
                  >
                    <Text variant="bodyXs" className={mine ? 'text-white' : 'text-ink-body'}>
                      {message.content}
                    </Text>
                  </View>
                ) : null}
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
            value={draft}
            onChangeText={setDraft}
            placeholder={t(CHAT.INPUT_PLACEHOLDER)}
            placeholderTextColor={colors.placeholder}
            className="max-h-[100px] p-0 font-sans text-[15.5px] text-ink-body"
            multiline
          />
          {/* Attachments are out of scope; the two icons stay as the mock draws them. */}
          <View className="flex-row items-center gap-3.5">
            <Plus size={19} color={colors.inkBody} strokeWidth={2} />
            <Paperclip size={19} color={colors.inkBody} strokeWidth={1.8} />
            <View className="flex-1" />
            <Pressable
              className={cn(
                'h-9 w-9 items-center justify-center rounded-[18px] bg-purple',
                draft.trim().length === 0 && 'opacity-40',
              )}
              onPress={submit}
              disabled={draft.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel={t(CHAT.SEND)}
              accessibilityState={{ disabled: draft.trim().length === 0 }}
            >
              <ArrowUp size={17} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
