import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { t } from '@/shared/i18n/i18n';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { demoUnreadCount } from '@/shared/lib/fixtures';
// These are attached to Trigger rather than exported at the top level.
const { Icon, Label, Badge } = NativeTabs.Trigger;

/**
 * The signed-in shell, built on the platform's own tab bar.
 *
 * This replaces a hand-rolled JS tab bar. NativeTabs renders a real UITabBar,
 * which means iOS 26 gives us the system Liquid Glass, the scroll-edge
 * behaviour and the minimise-on-scroll for free — none of which a View with a
 * BlurView behind it can imitate.
 *
 * Camera is deliberately NOT a tab: a viewfinder is a modal task, not a place
 * you navigate to and linger. It lives on the capture button that floats beside
 * the bar (see `CaptureButton`).
 */
export default function AppLayout() {
  const { pending } = useInbox();
  // Friends carries both incoming moments and unread messages.
  const friendsBadge = demoUnreadCount > 0 ? String(demoUnreadCount) : undefined;
  const feedBadge = pending.length > 0 ? String(pending.length) : undefined;

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      {/* `md` names resolve through expo-symbols on Android; `drawable` names
          would need resources shipped in the app package. */}
      <NativeTabs.Trigger name="feed">
        <Icon sf="square.stack" md="photo_library" />
        <Label>{t('nav.feed')}</Label>
        {feedBadge ? <Badge>{feedBadge}</Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <Icon sf="person.2" md="group" />
        <Label>{t('nav.friends')}</Label>
        {friendsBadge ? <Badge>{friendsBadge}</Badge> : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.crop.circle" md="account_circle" />
        <Label>{t('nav.profile')}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
