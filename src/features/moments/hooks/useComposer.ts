import { create } from './store';

/**
 * The capture -> caption -> recipients flow spans three screens, so the draft
 * lives outside the router rather than being threaded through params (a local
 * file URI is too long to pass safely in a URL).
 */
export type Draft = {
  uri: string | null;
  caption: string;
  facing: 'front' | 'back';
  recipientIds: string[];
  /** Set when the capture is answering a specific frosted moment. */
  replyToTradeId: string | null;
};

const emptyDraft: Draft = {
  uri: null,
  caption: '',
  facing: 'back',
  recipientIds: [],
  replyToTradeId: null,
};

export const useComposer = create<Draft>(emptyDraft, emptyDraft);
