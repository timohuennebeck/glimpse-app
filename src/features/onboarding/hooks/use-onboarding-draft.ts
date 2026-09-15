import { create } from '@/shared/lib/store';
/**
 * The name and the avatar are chosen on steps 2 and 3, but the account only
 * exists after step 4 — so they wait here rather than in a profile row with no
 * owner. Reset once sign-up has written them.
 */
export interface DraftAvatar {
  uri: string;
  width: number;
  height: number;
}

export interface OnboardingDraft {
  firstName: string;
  avatar: DraftAvatar | null;
}

export const useOnboardingDraft = create<OnboardingDraft>({ firstName: '', avatar: null });
