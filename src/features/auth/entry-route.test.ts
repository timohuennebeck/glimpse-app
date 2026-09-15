import { entryRoute, type EntryInput } from '@/features/auth/entry-route';

const input = (over: Partial<EntryInput> = {}): EntryInput => ({
  status: 'signed-in',
  onboardingDoneAt: null,
  profileFailed: false,
  ...over,
});

describe('entryRoute', () => {
  it('renders nothing while the session is still unknown', () => {
    expect(entryRoute(input({ status: 'loading' }))).toBeNull();
  });

  it('starts the flow for a signed-out visitor', () => {
    expect(entryRoute(input({ status: 'signed-out' }))).toBe('/(onboarding)/welcome');
  });

  it('waits for the profile before choosing between onboarding and the feed', () => {
    expect(entryRoute(input({ onboardingDoneAt: undefined }))).toBeNull();
  });

  it('resumes onboarding when it was never finished', () => {
    expect(entryRoute(input({ onboardingDoneAt: null }))).toBe('/(onboarding)/friends');
  });

  it('opens the feed once onboarding is done', () => {
    expect(entryRoute(input({ onboardingDoneAt: '2026-09-14T10:00:00Z' }))).toBe('/(app)/feed');
  });

  it('opens the feed rather than hanging when the profile cannot be read', () => {
    expect(entryRoute(input({ onboardingDoneAt: undefined, profileFailed: true }))).toBe('/(app)/feed');
  });
});
