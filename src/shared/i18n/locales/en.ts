import type { Translations } from '@/shared/i18n/locales/de';
/**
 * English is the active locale. German is kept complete in `de.ts` — the launch
 * plan is still German-speaking circles first, so switching back is one line in
 * `src/shared/i18n/i18n.ts`.
 *
 * Typed as the full `Translations` rather than a partial, so a missing key is a
 * compile error rather than a screen in two languages — which is exactly the bug
 * this file previously caused.
 */
export const en: Translations = {
  nav: {
    feed: 'Feed',
    friends: 'Friends',
    profile: 'Profile',
  },

  common: {
    close: 'Close',
    back: 'Back',
    next: 'Next',
    you: 'You',
  },

  onboarding: {
    stepCounter: '%{step} of %{total}',

    welcome: {
      title: 'One look.\nOnly if you\ngive one back.',
      subtitle: 'Your friend’s photo sits on your home screen —\nfrosted, until you trade.',
      rating: '4.9 out of 5',
      ratingMeta: '· 2,000+ ratings',
      cta: 'Get started',
      hasAccount: 'Already here?',
      signIn: 'Sign in',
      legalPrivacy: 'Privacy',
      legalTerms: 'Terms',
    },

    name: {
      title: 'What should your %{friends} call you, %{placeholder}?',
      friendsChip: 'friends',
      placeholderChip: 'your name',
      subtitle: 'Your name sits on the frosted photo your friends see.',
      suggestions: ['+ Nickname', '+ First name', '+ Both'],
      cta: 'Next',
    },

    camera: {
      title: 'One photo.\nNo filter.',
      subtitle: 'No editing, no second try.\nThat is what makes it real.',
      badge: 'Live',
      note: 'We only need the camera\nwhen you actually trade.',
      cta: 'Allow camera',
      later: 'Decide later',
    },

    firstGlimpse: {
      hint: 'Looks good. A trade is exactly that simple.',
    },

    avatar: {
      title: 'How will your\nfriends know you?',
      subtitle: 'A photo turns a request into a face.',
      pick: 'Choose a photo',
      cta: 'Next',
      skip: 'Add later',
    },

    signUp: {
      title: 'Almost\nthere.',
      subtitle: 'So your moments survive\nthe next phone.',
      email: 'Continue with email',
      google: 'Continue with Google',
      divider: 'or',
      legal: 'By signing up you accept our\n%{terms} and %{privacy}.',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
    },

    details: {
      title: 'Your details',
      subtitle: 'We will send a code to confirm. No marketing, promised.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@example.com',
      passwordLabel: 'Password',
      passwordHint: 'Strong · at least 9 characters',
      consent: 'I accept the %{terms} and the %{privacy}.',
      cta: 'Create account',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
    },

    friends: {
      title: 'Who do you want\nto trade with?',
      subtitle: 'Glimpse only works with two.',
      searchPlaceholder: 'Name or @username',
      contactsSection: 'From your contacts',
      add: 'Add',
      added: 'Requested',
      inviteTitle: 'Your people\naren’t here yet',
      inviteBody: 'Send a link. The moment someone accepts, you can trade.',
      inviteCta: 'Invite friends',
      dividerShare: 'or share',
      shareLink: 'Link',
      shareCopy: 'Copy',
      shareMore: 'More',
      cta: 'Next',
      skip: 'Later',
    },

    notifications: {
      title: 'Otherwise\nyou miss the moment.',
      subtitle: 'We only ping you when someone actually thought of you.',
      previewApp: 'glimpse',
      previewTime: 'now',
      previewBody: 'Mia sent you a moment.',
      note: 'No marketing. No digests. Only real moments.',
      cta: 'Allow notifications',
      skip: 'Not now',
      badge: 'New',
    },

    widget: {
      title: 'And now\nonto the home screen.',
      subtitle: 'That is where the frosted moment waits until you trade.',
      note: 'Press and hold the home screen, then tap “+”.',
      cta: 'Add widget',
      skip: 'Later',
      widgetName: 'Glimpse',
      widgetReply: 'Reply',
    },

    reviews: {
      title: 'Why people\nstay.',
      subtitle: 'Not for the photos. For the rule behind them.',
      rating: '4.9 out of 5 stars',
      ratingMeta: '2,000+ ratings on the App Store',
      verified: 'Verified',
      cta: 'Next',
      items: [
        {
          name: 'Hanna',
          since: 'here since 2024',
          score: '5.0',
          quote: '“Finally an app where I am not just watching. If you want to see, you have to show.”',
        },
        {
          name: 'Jonas',
          since: 'here since 2023',
          score: '4.9',
          quote: '“My girlfriend lives 600 km away. This is the only thing we both open every day.”',
        },
        {
          name: 'Selin',
          since: 'here since 2023',
          score: '5.0',
          quote: '“The unlock is addictive. Two seconds and you are inside someone’s day.”',
        },
      ],
    },

    heardAbout: {
      title: 'How did you hear\nabout\nGlimpse?',
      subtitle: 'Helps us understand where to keep going.',
      options: {
        friend: 'From friends',
        instagram: 'Instagram',
        tiktok: 'TikTok',
        appStore: 'App Store',
        youtube: 'YouTube',
        search: 'Search',
        other: 'Somewhere else',
      },
      cta: 'Next',
      skip: 'Skip',
    },

    thankYou: {
      variantA: {
        title: 'All set,\ngood to have you.',
        subtitle: 'Only the first trade left.',
        footnote: 'Take a photo — your friends only see it once they send one back.',
        cta: 'Send first moment',
        skip: 'Look around first',
      },
    },
  },

  paywall: {
    eyebrow: 'Glimpse Plus',
    title: 'Keep what\nyou traded.',
    benefits: [
      'Unlimited history instead of 30 days',
      'Export the month as a film strip',
      'Widget layouts and frames',
    ],
    monthly: { label: 'Monthly', price: '€6.99', note: 'per month' },
    yearly: { label: 'Yearly', price: '€2.08', note: 'per month, €24.99 / year', badge: 'Save 70%' },
    trial: {
      title: '7 days free',
      body: 'We remind you before anything is charged. Cancel any time.',
    },
    cta: 'Start free trial',
    restore: 'Restore purchases',
  },

  referral: {
    redeem: {
      eyebrow: 'Invite code',
      title: 'Got a code\nfrom someone?',
      subtitle: 'Partner and friend codes unlock three months of Glimpse Plus.',
      cta: 'Redeem code',
      note: 'No code? You can use Glimpse\nwithout one.',
    },
    share: {
      eyebrow: 'Thank you',
      title: 'Share Plus with\nyour people.',
      subtitle: 'Your code unlocks three months of Plus for three friends. Costs you nothing.',
      codeLabel: 'Your code',
      codeNote: '3 uses left',
      copy: 'Copy',
      share: 'Share',
      cta: 'Continue to the app',
      later: 'Later',
    },
  },

  feed: {
    greetingMorning: 'Good morning.',
    greetingDay: 'Good to see you.',
    greetingEvening: 'Good evening.',
    storiesLabel: 'Your people',
    storiesTrailing: '%{count} waiting',
    addFriend: 'invite',
    momentsTitle: 'Your moments',
    lockedBadge: 'New',
    lockedCta: 'Trade to see it',
    unlockHint: 'Unlocks by itself in %{time}',
    empty: {
      title: 'Nobody to\ntrade with yet.',
      body: 'Glimpse needs at least one other person. Invite someone you would show your day to.',
      cta: 'Invite friends',
      headline: 'Almost ready.',
    },
  },

  camera: {
    hint: 'Tap to capture',
    flipLabel: 'Flip camera',
    flashLabel: 'Flash',
    shutterLabel: 'Capture',
    permissionTitle: 'Camera not allowed',
    permissionBody: 'Without the camera you cannot trade anything back.',
  },

  compose: {
    captionPlaceholder: 'Leave a comment',
    retake: 'Retake',
    continue: 'Continue',
    recipientsTitle: 'Choose recipients',
    friendsSection: 'Your friends',
    waitingSection: 'Waiting on you',
    inviteTitle: 'Only one here?',
    inviteBody: 'A trade takes two. Invite someone.',
    inviteCta: 'Invite friends',
    sendTo: 'Send to %{name}',
    sendToMany: 'Send to %{count}',
    sendNone: 'Pick at least one person',
  },

  moment: {
    lockedTitle: 'Trade first,\nthen look.',
    lockedBody: 'Send %{name} a moment back and you both see each other’s photo at once.',
    lockedCta: 'Send one back',
    replyPlaceholder: 'Reply…',
    autoUnlock: 'Unlocks in %{time}',
  },

  friends: {
    title: 'Your people',
    tabFriends: 'Friends',
    tabChats: 'Chats',
    storiesLabel: 'Traded today',
    requestsSection: 'Requests · %{count}',
    sentSection: 'Sent · %{count}',
    accept: 'Accept',
    pending: 'Pending',
    sentAgo: 'sent %{time} ago',
    addCta: 'Invite more',
    search: {
      title: 'Add friend',
      placeholder: '@username',
      resultsSection: 'Results · %{count}',
      mutual: '%{count} mutual',
      alreadyFriends: 'Friends',
      add: 'Add',
      sent: 'Sent',
      request: 'Request',
      dividerShare: 'or share',
      link: 'Link',
      qr: 'QR code',
      more: 'More',
      empty: 'Nobody found.',
    },
  },

  chat: {
    searchPlaceholder: 'Search…',
    unreadSection: 'New',
    unreadTrailing: '%{count} new',
    youPrefix: 'You: ',
    sentPhoto: 'Photo',
    inputPlaceholder: 'Message…',
    online: 'Active now',
    dayToday: 'Today',
  },

  profile: {
    momentsTitle: 'Your moments',
    tradeCta: 'Send a moment',
    pairsEmpty: 'You haven’t traded anything yet.',
  },

  invite: {
    title: '%{name} sent you\na moment',
    body: 'You see it as soon as you send one back. That is how Glimpse works.',
    cta: 'Send one back',
    secondary: 'First, see what Glimpse is',
  },

  errors: {
    generic: 'Something went wrong.',
  },
};
