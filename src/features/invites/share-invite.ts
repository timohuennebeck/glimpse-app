import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { t } from '@/shared/i18n/i18n';
import { INVITE } from '@/shared/i18n/keys';
import { createInvite, inviteLink } from '@/features/invites/data/invites-api';
/** Every "invite" button in the app ends up here. */
export type ShareOutcome = 'shared' | 'copied';

/**
 * Mint an invite and hand out its link.
 *
 * Where there is no share sheet — desktop web, which is where this work is
 * verified — the link goes on the clipboard instead, so the button always does
 * something rather than failing silently.
 */
export async function shareInvite(name: string, momentId?: string | null): Promise<ShareOutcome> {
  const token = await createInvite(momentId);
  const link = inviteLink(token);

  try {
    await Share.share({ message: t(INVITE.SHARE_MESSAGE, { name, link }) });
    return 'shared';
  } catch {
    await Clipboard.setStringAsync(link);
    return 'copied';
  }
}

/** The "Copy" action on a share row: the bare link, no share sheet. */
export async function copyInvite(momentId?: string | null): Promise<void> {
  const token = await createInvite(momentId);
  await Clipboard.setStringAsync(inviteLink(token));
}
