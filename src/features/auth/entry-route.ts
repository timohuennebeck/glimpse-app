import type { SessionStatus } from '@/features/auth/hooks/use-session';
/**
 * Where the app opens. Pure, because the cold-start race between "is there a
 * session" and "did this account ever finish onboarding" has four wrong
 * answers and one right one, and none of them are visible in a router test.
 */
export type EntryRoute = '/(onboarding)/welcome' | '/(onboarding)/friends' | '/(app)/feed';

export interface EntryInput {
  status: SessionStatus;
  /** `undefined` while the profile has not loaded; `null` when onboarding is unfinished. */
  onboardingDoneAt: string | null | undefined;
  /** The profile query failed. Better the feed than a splash that never ends. */
  profileFailed: boolean;
}

export function entryRoute({ status, onboardingDoneAt, profileFailed }: EntryInput): EntryRoute | null {
  if (status === 'loading') return null;
  if (status === 'signed-out') return '/(onboarding)/welcome';
  if (profileFailed) return '/(app)/feed';
  if (onboardingDoneAt === undefined) return null;
  return onboardingDoneAt === null ? '/(onboarding)/friends' : '/(app)/feed';
}
