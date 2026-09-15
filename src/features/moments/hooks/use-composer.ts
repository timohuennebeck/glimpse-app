import { create } from '@/shared/lib/store';
/**
 * The capture -> caption -> recipients flow spans three screens, so the draft
 * lives outside the router rather than being threaded through params (a local
 * file URI is too long to pass safely in a URL).
 */
export interface Draft {
  uri: string | null;
  /** Pixel size of the shot, stored on the moment so cards can reserve its aspect ratio. */
  width: number | null;
  height: number | null;
  caption: string;
  recipientIds: string[];
  /** Set when the capture is answering a specific frosted moment. */
  replyToTradeId: string | null;
}

const emptyDraft: Draft = {
  uri: null,
  width: null,
  height: null,
  caption: '',
  recipientIds: [],
  replyToTradeId: null,
};

export const useComposer = create<Draft>(emptyDraft);
