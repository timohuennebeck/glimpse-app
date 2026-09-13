import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { getLocale } from '@/shared/i18n/i18n';
function dfnsLocale() {
  return getLocale().startsWith('de') ? de : enUS;
}

/** "vor 12 Min" / "12 min ago" — used on moment cards and the widget. */
export function relativeTime(iso: string): string {
  const locale = dfnsLocale();
  return locale === de
    ? `vor ${formatDistanceToNowStrict(new Date(iso), { locale })}`
    : `${formatDistanceToNowStrict(new Date(iso), { locale })} ago`;
}

/** "9:24" / "Gestern" / "Mo" — the chat-list timestamp rule. */
export function threadTime(iso: string): string {
  const d = new Date(iso);
  const locale = dfnsLocale();
  if (isToday(d)) return format(d, 'H:mm', { locale });
  if (isYesterday(d)) return locale === de ? 'Gestern' : 'Yesterday';
  return format(d, 'EEEEEE', { locale });
}

/** "Di 9. Sep" — the date caption under a photo pair. */
export function pairDate(iso: string): string {
  const locale = dfnsLocale();
  return locale === de
    ? format(new Date(iso), 'EEEEEE d. MMM', { locale })
    : format(new Date(iso), 'EEE d MMM', { locale });
}

/** "Tauscht seit September 2026" — when this person joined. */
export function memberSince(iso: string): string {
  const locale = dfnsLocale();
  const when = format(new Date(iso), 'LLLL yyyy', { locale });
  return locale === de ? `Tauscht seit ${when}` : `Trading since ${when}`;
}

/** Remaining time before a frosted moment unlocks itself. */
export function timeUntilUnlock(iso: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target) || target <= Date.now()) return null;
  return formatDistanceToNowStrict(new Date(iso), { locale: dfnsLocale() });
}
