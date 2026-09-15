import { Modal, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, PROFILE } from '@/shared/i18n/keys';
import { signOut } from '@/features/auth/sign-out';
interface ProfileActionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The "more" menu on your own profile. An in-app sheet rather than React
 * Native's `Alert`, which does nothing at all on web — and the web build is how
 * this work is verified.
 */
export function ProfileActionsSheet({ visible, onClose }: ProfileActionsSheetProps) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-[rgba(12,10,18,.45)]"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t(COMMON.CLOSE)}
      >
        {/* Swallows the press, so tapping the sheet itself does not dismiss it.
            accessible={false} because Pressable defaults to true, which made
            this an accessibility leaf that merged its children: under VoiceOver
            sign-out had no reachable activation point and a double tap ran the
            no-op handler below instead. */}
        <Pressable
          className="rounded-t-lg bg-white px-5 pt-2"
          style={{ paddingBottom: insets.bottom + 12 }}
          onPress={() => {}}
          accessible={false}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-pill bg-border-lilac" />
          <Pressable
            className="h-14 flex-row items-center gap-3.5 active:opacity-70"
            onPress={() => {
              onClose();
              void signOut(queryClient);
            }}
            accessibilityRole="button"
          >
            <LogOut size={20} color={colors.inkBody} strokeWidth={2} />
            <Text variant="rowTitleSm" className="text-ink">
              {t(PROFILE.SIGN_OUT)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
