import { t, tList } from '@/shared/i18n/i18n';
import { de } from '@/shared/i18n/locales/de';
import { en } from '@/shared/i18n/locales/en';

describe('t', () => {
  it('resolves a dot path to the English copy', () => {
    expect(t('feed.empty.title')).toBe(en.feed.empty.title);
    expect(t('onboarding.details.subtitle')).toBe(en.onboarding.details.subtitle);
  });

  it('interpolates', () => {
    expect(t('profile.memberSince', { when: 'March' })).toBe('Trading since March');
  });
});

describe('tList', () => {
  it('keeps an array an array, where t would stringify it', () => {
    expect(tList<string>('paywall.benefits')).toEqual(en.paywall.benefits);
  });
});

/**
 * Both files are typed as the same `Translations`, so a missing or renamed key
 * is already a compile error. Placeholders are not: rename `%{name}` in one
 * locale alone and the other renders the literal token to a user.
 */
describe('locales', () => {
  function placeholders(node: unknown, path = '', found = new Map<string, string[]>()) {
    if (typeof node === 'string') {
      const names = [...node.matchAll(/%\{(\w+)\}/g)].map((m) => m[1]).sort();
      if (names.length > 0) found.set(path, names);
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        placeholders(value, path ? `${path}.${key}` : key, found);
      }
    }
    return found;
  }

  it('agree on every interpolation placeholder', () => {
    expect(Object.fromEntries(placeholders(de))).toEqual(Object.fromEntries(placeholders(en)));
  });
});
