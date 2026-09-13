import type { Translations } from './de';

/**
 * English is scaffolded but not the launch locale. Keys mirror `de.ts` exactly;
 * `DeepPartial` means an untranslated key falls back to German rather than
 * rendering a blank string.
 */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const en: DeepPartial<Translations> = {
  common: {
    close: 'Close',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    continue: 'Continue',
    cancel: 'Cancel',
    done: 'Done',
    retry: 'Try again',
    or: 'or',
    you: 'You',
    loading: 'One moment…',
  },

  onboarding: {
    stepCounter: '%{step} of %{total}',
    welcome: {
      title: 'One look.\nOnly if you\ngive one back.',
      subtitle: 'Your friend’s photo sits on your home screen —\nfrosted, until you trade.',
      rating: '4.9 out of 5 stars',
      ratingMeta: '· 2,000+ ratings',
      cta: 'Get started',
      hasAccount: 'Already here?',
      signIn: 'Sign in',
    },
  },

  feed: {
    storiesLabel: 'Your people',
    momentsTitle: 'Your moments',
    lockedCta: 'Trade to see it',
  },

  camera: {
    hint: 'Tap to capture',
  },

  compose: {
    recipientsTitle: 'Choose recipients',
    continue: 'Continue',
  },

  moment: {
    lockedTitle: 'Trade first,\nthen look.',
    lockedCta: 'Send one back',
  },

  errors: {
    generic: 'Something went wrong.',
    supabaseMissing: 'No database connected yet — you’re seeing sample data.',
  },
};
