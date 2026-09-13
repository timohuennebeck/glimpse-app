/**
 * German is the launch locale (see the positioning note: "Seed narrow —
 * German-speaking first"). The mock's lorem ipsum is replaced here with real
 * copy; the German strings that were already in the mock ("Fortfahren",
 * "Ausstehend", "Empfänger wählen"…) are kept verbatim.
 */
export const de = {
  nav: {
    feed: 'Feed',
    friends: 'Freunde',
    profile: 'Profil',
  },

  common: {
    close: 'Schließen',
    back: 'Zurück',
    next: 'Weiter',
    you: 'Du',
  },

  onboarding: {
    stepCounter: '%{step} von %{total}',

    welcome: {
      title: 'Ein Blick.\nNur wenn du\neinen zurückgibst.',
      subtitle: 'Das Foto deiner Freundin liegt auf deinem\nHomescreen — verschwommen, bis du tauschst.',
      rating: '4,9 von 5',
      ratingMeta: '· 2.000+ Bewertungen',
      cta: 'Los geht’s',
      hasAccount: 'Schon dabei?',
      signIn: 'Anmelden',
      legalPrivacy: 'Datenschutz',
      legalTerms: 'Nutzungsbedingungen',
    },

    name: {
      title: 'Wie sollen dich deine %{friends} nennen, %{placeholder}?',
      friendsChip: 'Freunde',
      placeholderChip: 'dein Name',
      subtitle: 'Dein Name steht auf dem verschwommenen Foto, das deine Freunde sehen.',
      suggestions: ['+ Spitzname', '+ Vorname', '+ Beides'],
      cta: 'Weiter',
    },

    camera: {
      title: 'Ein Foto.\nOhne Filter.',
      subtitle: 'Kein Bearbeiten, kein zweiter Versuch.\nGenau das macht es echt.',
      badge: 'Live',
      note: 'Wir brauchen die Kamera nur,\nwenn du wirklich tauschst.',
      cta: 'Kamera erlauben',
      later: 'Später entscheiden',
    },

    firstGlimpse: {
      hint: 'Sieht gut aus. Genau so einfach ist ein Tausch.',
    },

    avatar: {
      title: 'Woran erkennen\ndich deine Freunde?',
      subtitle: 'Ein Profilbild macht aus einer Anfrage ein Gesicht.',
      pick: 'Foto auswählen',
      cta: 'Weiter',
      skip: 'Später hinzufügen',
    },

    signUp: {
      title: 'Fast\ngeschafft.',
      subtitle: 'Damit deine Momente auch nach einem\nHandywechsel noch da sind.',
      email: 'Mit E-Mail fortfahren',
      google: 'Mit Google fortfahren',
      divider: 'oder',
      legal: 'Mit der Anmeldung akzeptierst du unsere\n%{terms} und %{privacy}.',
      terms: 'Nutzungsbedingungen',
      privacy: 'Datenschutzerklärung',
    },

    details: {
      title: 'Deine Daten',
      subtitle: 'Wir schicken dir einen Code zur Bestätigung. Keine Werbung, versprochen.',
      emailLabel: 'E-Mail',
      emailPlaceholder: 'du@beispiel.de',
      passwordLabel: 'Passwort',
      passwordHint: 'Sicher · mindestens 9 Zeichen',
      consent: 'Ich akzeptiere die %{terms} und die %{privacy}.',
      cta: 'Konto erstellen',
      hasAccount: 'Schon ein Konto?',
      signIn: 'Anmelden',
    },

    friends: {
      title: 'Mit wem willst du\ntauschen?',
      subtitle: 'Glimpse funktioniert erst zu zweit.',
      searchPlaceholder: 'Name oder @nutzername',
      contactsSection: 'Aus deinen Kontakten',
      add: 'Hinzufügen',
      added: 'Angefragt',
      inviteTitle: 'Deine Leute sind\nnoch nicht hier',
      inviteBody: 'Schick einen Link. Sobald jemand annimmt, könnt ihr sofort tauschen.',
      inviteCta: 'Freunde einladen',
      dividerShare: 'oder teilen',
      shareLink: 'Link',
      shareCopy: 'Kopieren',
      shareMore: 'Mehr',
      cta: 'Weiter',
      skip: 'Später',
    },

    notifications: {
      title: 'Sonst\nverpasst du den Moment.',
      subtitle: 'Wir melden uns nur, wenn wirklich jemand an dich gedacht hat.',
      previewApp: 'glimpse',
      previewTime: 'jetzt',
      previewBody: 'Mia hat dir einen Moment geschickt.',
      note: 'Kein Marketing. Keine Zusammenfassungen. Nur echte Momente.',
      cta: 'Mitteilungen erlauben',
      skip: 'Nicht jetzt',
      badge: 'Neu',
    },

    widget: {
      title: 'Und jetzt\nauf den Homescreen.',
      subtitle: 'Dort liegt der verschwommene Moment, bis du tauschst.',
      note: 'Lange auf den Homescreen tippen, dann auf „+“.',
      cta: 'Widget hinzufügen',
      skip: 'Später',
      widgetName: 'Glimpse',
      widgetReply: 'Antworten',
    },

    reviews: {
      title: 'Warum Leute\nbleiben.',
      subtitle: 'Nicht wegen der Fotos. Wegen der Regel dahinter.',
      rating: '4,9 von 5 Sternen',
      ratingMeta: 'über 2.000 Bewertungen im App Store',
      verified: 'Verifiziert',
      cta: 'Weiter',
      items: [
        {
          name: 'Hanna',
          since: 'dabei seit 2024',
          score: '5,0',
          quote: '„Endlich eine App, bei der ich nicht nur zugucke. Wer sehen will, muss selbst was zeigen.”',
        },
        {
          name: 'Jonas',
          since: 'dabei seit 2023',
          score: '4,9',
          quote: '„Meine Freundin wohnt 600 km weg. Das hier ist das Einzige, was wir täglich öffnen.”',
        },
        {
          name: 'Selin',
          since: 'dabei seit 2023',
          score: '5,0',
          quote: '„Das Entsperren macht süchtig. Zwei Sekunden und du siehst den Tag von jemandem.”',
        },
      ],
    },

    heardAbout: {
      title: 'Wie hast du von\nGlimpse\nerfahren?',
      subtitle: 'Hilft uns zu verstehen, wo wir weitermachen sollen.',
      options: {
        friend: 'Über Freunde',
        instagram: 'Instagram',
        tiktok: 'TikTok',
        appStore: 'App Store',
        youtube: 'YouTube',
        search: 'Suche',
        other: 'Woanders',
      },
      cta: 'Weiter',
      skip: 'Überspringen',
    },

    thankYou: {
      variantA: {
        title: 'Alles bereit,\nschön dass du da bist.',
        subtitle: 'Jetzt fehlt nur noch der erste Tausch.',
        footnote: 'Mach ein Foto — deine Freunde sehen es erst, wenn sie eins zurückschicken.',
        cta: 'Ersten Moment senden',
        skip: 'Erst mal umsehen',
      },
    },
  },

  paywall: {
    eyebrow: 'Glimpse Plus',
    title: 'Behalte, was\nihr getauscht habt.',
    benefits: [
      'Unbegrenzter Verlauf statt 30 Tage',
      'Am Monatsende als Filmstreifen exportieren',
      'Widget-Layouts und Rahmen',
    ],
    monthly: { label: 'Monatlich', price: '6,99 €', note: 'pro Monat' },
    yearly: { label: 'Jährlich', price: '2,08 €', note: 'pro Monat, 24,99 € / Jahr', badge: 'Spare 70 %' },
    trial: {
      title: '7 Tage kostenlos',
      body: 'Wir erinnern dich, bevor etwas abgebucht wird. Jederzeit kündbar.',
    },
    cta: 'Kostenlos testen',
    restore: 'Käufe wiederherstellen',
  },

  referral: {
    redeem: {
      eyebrow: 'Einladungscode',
      title: 'Hast du einen\nCode bekommen?',
      subtitle: 'Codes von Partnern und Freunden schalten drei Monate Glimpse Plus frei.',
      cta: 'Code einlösen',
      note: 'Kein Code? Du kannst Glimpse\nauch ohne einen nutzen.',
    },
    share: {
      eyebrow: 'Danke dir',
      title: 'Teile Plus mit\ndeinen Leuten.',
      subtitle: 'Dein Code schaltet für drei Freunde jeweils drei Monate Plus frei. Kostet dich nichts.',
      codeLabel: 'Dein Code',
      codeNote: 'noch 3-mal einlösbar',
      copy: 'Kopieren',
      share: 'Teilen',
      cta: 'Weiter zur App',
      later: 'Später',
    },
  },

  feed: {
    greetingMorning: 'Guten Morgen.',
    greetingDay: 'Schön, dass du da bist.',
    greetingEvening: 'Guten Abend.',
    storiesLabel: 'Deine Leute',
    storiesTrailing: '%{count} offen',
    addFriend: 'einladen',
    momentsTitle: 'Eure Momente',
    lockedBadge: 'Neu',
    lockedCta: 'Tauschen zum Ansehen',
    unlockHint: 'Entsperrt sich in %{time} von selbst',
    empty: {
      title: 'Noch niemand\nzum Tauschen.',
      body: 'Glimpse braucht mindestens eine zweite Person. Lade jemanden ein, dem du deinen Tag zeigen würdest.',
      cta: 'Freunde einladen',
      headline: 'Fast startklar.',
    },
  },

  camera: {
    hint: 'Tippen zum Aufnehmen',
    flipLabel: 'Kamera wechseln',
    flashLabel: 'Blitz',
    shutterLabel: 'Auslösen',
    permissionTitle: 'Kamera nicht erlaubt',
    permissionBody: 'Ohne Kamera kannst du nichts zurücktauschen.',
  },

  compose: {
    captionPlaceholder: 'Kommentar hinterlassen',
    retake: 'Nochmal',
    continue: 'Fortfahren',
    recipientsTitle: 'Empfänger wählen',
    friendsSection: 'Deine Freunde',
    waitingSection: 'Warten auf dich',
    inviteTitle: 'Nur einer hier?',
    inviteBody: 'Ein Tausch braucht zwei. Lade jemanden ein.',
    inviteCta: 'Freunde einladen',
    sendTo: 'An %{name} senden',
    sendToMany: 'An %{count} senden',
    sendNone: 'Wähle mindestens eine Person',
  },

  moment: {
    lockedTitle: 'Erst tauschen,\ndann ansehen.',
    lockedBody: 'Schick %{name} einen Moment zurück und ihr seht beide Fotos gleichzeitig.',
    lockedCta: 'Moment zurückschicken',
    replyPlaceholder: 'Antworten …',
    autoUnlock: 'Entsperrt sich in %{time}',
  },

  friends: {
    title: 'Deine Leute',
    tabFriends: 'Freunde',
    tabChats: 'Chats',
    storiesLabel: 'Heute getauscht',
    requestsSection: 'Anfragen · %{count}',
    sentSection: 'Gesendet · %{count}',
    accept: 'Annehmen',
    pending: 'Ausstehend',
    sentAgo: 'vor %{time} gesendet',
    addCta: 'Weitere einladen',
    search: {
      title: 'Freund hinzufügen',
      placeholder: '@nutzername',
      resultsSection: 'Ergebnisse · %{count}',
      mutual: '%{count} gemeinsame',
      alreadyFriends: 'Freunde',
      add: 'Hinzufügen',
      sent: 'Gesendet',
      request: 'Anfragen',
      dividerShare: 'oder teilen',
      link: 'Link',
      qr: 'QR-Code',
      more: 'Mehr',
      empty: 'Niemanden gefunden.',
    },
  },

  chat: {
    searchPlaceholder: 'Suchen …',
    unreadSection: 'Neu',
    unreadTrailing: '%{count} neu',
    youPrefix: 'Du: ',
    sentPhoto: 'Foto',
    inputPlaceholder: 'Nachricht …',
    online: 'Gerade aktiv',
    dayToday: 'Heute',
  },

  profile: {
    momentsTitle: 'Eure Momente',
    tradeCta: 'Moment senden',
    pairsEmpty: 'Ihr habt noch nichts getauscht.',
  },

  invite: {
    title: '%{name} hat dir\neinen Moment geschickt',
    body: 'Du siehst ihn, sobald du einen zurückschickst. So funktioniert Glimpse.',
    cta: 'Moment zurückschicken',
    secondary: 'Erst mal ansehen, was Glimpse ist',
  },

  errors: {
    generic: 'Da ist etwas schiefgelaufen.',
  },
};

/**
 * Note the deliberate absence of `as const`: literal types would make the
 * English locale's type demand the exact German strings.
 */
export type Translations = typeof de;
