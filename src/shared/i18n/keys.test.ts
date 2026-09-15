import { buildKeys, FEED, ONBOARDING, PAYWALL, screamingSnake } from '@/shared/i18n/keys';
import { t, tList } from '@/shared/i18n/i18n';
import { en } from '@/shared/i18n/locales/en';

describe('screamingSnake', () => {
  it.each([
    ['nav', 'NAV'],
    ['storiesLabel', 'STORIES_LABEL'],
    ['variantA', 'VARIANT_A'],
    ['appStore', 'APP_STORE'],
  ])('%s becomes %s', (input, expected) => {
    expect(screamingSnake(input)).toBe(expected);
  });
});

describe('buildKeys', () => {
  it('maps every leaf, list or string, to its dot path', () => {
    expect(buildKeys({ feed: { storiesLabel: 'x', empty: { title: 'y' }, benefits: ['a'] } })).toEqual({
      FEED: {
        STORIES_LABEL: 'feed.storiesLabel',
        EMPTY: { TITLE: 'feed.empty.title' },
        BENEFITS: 'feed.benefits',
      },
    });
  });
});

describe('generated constants', () => {
  it('are the dot paths into the locale', () => {
    expect(ONBOARDING.DETAILS.SUBTITLE).toBe('onboarding.details.subtitle');
  });

  it('resolve to the English copy through t and tList', () => {
    expect(t(FEED.EMPTY.TITLE)).toBe(en.feed.empty.title);
    expect(tList<string>(PAYWALL.BENEFITS)).toEqual(en.paywall.benefits);
  });
});
