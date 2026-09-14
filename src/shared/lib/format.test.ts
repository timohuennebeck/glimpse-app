import { timeUntilUnlock } from '@/shared/lib/format';

describe('timeUntilUnlock', () => {
  it('returns null when there is no deadline', () => {
    expect(timeUntilUnlock(null)).toBeNull();
  });

  it('returns null once the deadline has passed', () => {
    expect(timeUntilUnlock(new Date(Date.now() - 60_000).toISOString())).toBeNull();
  });

  it('describes a deadline in the future', () => {
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000 + 60_000).toISOString();
    expect(timeUntilUnlock(inTwoHours)).toBe('2 hours');
  });
});
