import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { getLocale, t } from '@/shared/i18n/i18n';
import { PROFILE, TIME } from '@/shared/i18n/keys';
function dfnsLocale() {
  return getLocale().startsWith('de') ? de : enUS;
}

/**
 * "12 min ago" / "vor 12 Min" — moment cards, the widget, sent requests.
 * date-fns adds the suffix itself, which is what gets the German dative right
 * ("vor 2 Tagen", not "vor 2 Tage").
 */
export function relativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: dfnsLocale(), addSuffix: true });
}

/** "9:24" / "Yesterday" / "Mo" — the chat-list timestamp rule. */
export function threadTime(iso: string): string {
  const d = new Date(iso);
  const locale = dfnsLocale();
  if (isToday(d)) return format(d, 'H:mm', { locale });
  if (isYesterday(d)) return t(TIME.YESTERDAY);
  return format(d, 'EEEEEE', { locale });
}

/** "Tue 9 Sep" — the date caption under a photo pair. */
export function pairDate(iso: string): string {
  const locale = dfnsLocale();
  return format(new Date(iso), locale === de ? 'EEEEEE d. MMM' : 'EEE d MMM', { locale });
}

/** "Trading since September 2026" — when this person joined. */
export function memberSince(iso: string): string {
  return t(PROFILE.MEMBER_SINCE, { when: format(new Date(iso), 'LLLL yyyy', { locale: dfnsLocale() }) });
}

/** Remaining time before a frosted moment unlocks itself. */
export function timeUntilUnlock(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target) || target <= Date.now()) return null;
  return formatDistanceToNowStrict(new Date(iso), { locale: dfnsLocale() });
}
