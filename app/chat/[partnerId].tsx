import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/shared/ui/avatar';
import { CloseIcon, MoreIcon, PaperclipIcon, PlusIcon, SendIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { fontFamily } from '@/shared/theme/fonts';
import { radius, shadow, spacing } from '@/shared/theme/page-structure';
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
    () =>
      demoMessages.filter(
        (m) => m.sender_id === partner.id || m.recipient_id === partner.id,
      ),
    [partner.id],
  );

  return (
    <Screen gutter={0} bottomInset={0}>
      <View style={styles.header}>
        <GlassButton size={34} onPress={() => router.back()}>
          <CloseIcon size={12} />
        </GlassButton>
        <Avatar source={partner.photo} size={40} />
        <View style={styles.headerText}>
          <Text variant="rowTitle" color={colors.ink}>
            {partner.display_name}
          </Text>
          <Text variant="metaXs" color={colors.mutedLilac}>
            {t('chat.online')}
          </Text>
        </View>
        <GlassButton size={34}>
          <MoreIcon size={17} />
        </GlassButton>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dayChip}>
          <Text variant="caption" color={colors.mutedLilac}>
            {t('chat.dayToday')}
          </Text>
        </View>

        {messages.map((message) => {
          const mine = message.sender_id === DEMO_USER_ID;
          return (
            <View key={message.id} style={mine ? styles.rowMine : styles.rowTheirs}>
              {!mine ? <Avatar source={partner.photo} size={30} /> : null}

              <View style={mine ? styles.stackMine : styles.stackTheirs}>
                <Text variant="caption" color={colors.mutedLilac}>
                  {threadTime(message.created_at)}
                </Text>
                <View style={styles.bubbleRow}>
                  {message.photo ? (
                    <Image source={message.photo} style={styles.attachment} contentFit="cover" />
                  ) : null}
                  {message.body ? (
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text variant="bodyXs" color={mine ? colors.white : colors.inkBody}>
                        {message.body}
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
        <View style={styles.composer}>
          <TextInput
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            multiline
          />
          <View style={styles.composerActions}>
            <PlusIcon size={19} color={colors.inkBody} />
            <PaperclipIcon size={19} />
            <View style={styles.flex} />
            <View style={styles.send}>
              <SendIcon size={17} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.gutter,
    height: 60,
  },
  headerText: { flex: 1, gap: 1 },
  thread: { paddingHorizontal: spacing.gutter, paddingTop: 18, gap: 16, paddingBottom: 8 },
  dayChip: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceLilac,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  rowTheirs: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  rowMine: { flexDirection: 'row', justifyContent: 'flex-end' },
  stackTheirs: { gap: 6, flexShrink: 1 },
  stackMine: { gap: 6, alignItems: 'flex-end', flexShrink: 1 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  bubble: { maxWidth: 264, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleTheirs: { backgroundColor: colors.surfaceViolet, borderBottomLeftRadius: 8 },
  bubbleMine: { backgroundColor: colors.purple, borderBottomRightRadius: 8 },
  attachment: {
    width: 78,
    height: 104,
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.borderChip,
  },
  composer: {
    margin: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLilacAlt,
    borderRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 12,
    gap: 18,
    ...shadow.card,
  },
  input: {
    fontSize: 15.5,
    color: colors.inkBody,
    fontFamily: fontFamily.regular,
    padding: 0,
    maxHeight: 100,
  },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
