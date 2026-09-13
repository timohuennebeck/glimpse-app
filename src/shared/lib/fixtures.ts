import type { InboxRow, Message, PairRow, Profile, ThreadRow } from './database.types';

/**
 * Sample data so every screen renders before a Supabase project exists.
 * People and photos match the ones used in the design mock.
 *
 * The data layer in each feature returns these when `isSupabaseConfigured` is
 * false, so the app is never a wall of spinners during design review.
 */

export const AVATARS = {
  self: require('../../../assets/images/av-self.png'),
  mia: require('../../../assets/images/av-mia.png'),
  miaLarge: require('../../../assets/images/mia-avatar-lg.png'),
  miaProfile: require('../../../assets/images/p-big-avatar.png'),
  ben: require('../../../assets/images/av-ben.png'),
  lina: require('../../../assets/images/av-lina.png'),
  noah: require('../../../assets/images/c-av-noah.png'),
  alex: require('../../../assets/images/alex-avatar.png'),
  contactMia: require('../../../assets/images/c-av-mia.png'),
  contactLina: require('../../../assets/images/c-av-lina.png'),
} as const;

export const PHOTOS = {
  momentOpen: require('../../../assets/images/moment-open.png'),
  beach: require('../../../assets/images/p-beach.png'),
  flowers: require('../../../assets/images/p-flowers.png'),
  street: require('../../../assets/images/p-street.png'),
  sea: require('../../../assets/images/gal-sea.png'),
  galFlowers: require('../../../assets/images/gal-flowers.png'),
  viewfinder: require('../../../assets/images/viewfinder.png'),
  widgetCard: require('../../../assets/images/on8-widget-card.png'),
  videoStill: require('../../../assets/images/thankyou-video-still.png'),
} as const;

export const ART = {
  mascot: require('../../../assets/images/mascot.png'),
  mascotUnlock: require('../../../assets/images/mascot-unlock.png'),
  mascotHeart: require('../../../assets/images/mascot-heart.png'),
  welcomeHero: require('../../../assets/images/welcome-hero.png'),
  cameraHero: require('../../../assets/images/camera-hero.png'),
  signupKey: require('../../../assets/images/signup-key-hero.png'),
  bell: require('../../../assets/images/bell.png'),
} as const;

export const IOS_ICONS = {
  weather: require('../../../assets/images/ios/weather.png'),
  clock: require('../../../assets/images/ios/clock.png'),
  calendar: require('../../../assets/images/ios/calendar.png'),
  maps: require('../../../assets/images/ios/maps.png'),
  mail: require('../../../assets/images/ios/mail.png'),
  contacts: require('../../../assets/images/ios/contacts.png'),
  stock: require('../../../assets/images/ios/stock.png'),
  phone: require('../../../assets/images/ios/phone.png'),
  safari: require('../../../assets/images/ios/safari.png'),
  photos: require('../../../assets/images/ios/photos.png'),
  camera: require('../../../assets/images/ios/camera.png'),
} as const;

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
const hoursAhead = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const DEMO_USER_ID = 'demo-self';

export const demoProfiles: Record<string, Profile & { photo: number }> = {
  [DEMO_USER_ID]: { ...mkProfile(DEMO_USER_ID, 'Du', 'du', AVATARS.self, ''), created_at: daysAgo(8) },
  mia: mkProfile('mia', 'Mia', 'miahartmann', AVATARS.mia, 'Wien · tauscht fast täglich'),
  ben: mkProfile('ben', 'Ben', 'benkr', AVATARS.ben, 'Hamburg'),
  lina: mkProfile('lina', 'Lina', 'linam', AVATARS.lina, 'Leipzig'),
  noah: mkProfile('noah', 'Noah', 'noah.w', AVATARS.noah, 'Zürich'),
  alex: mkProfile('alex', 'Alex', 'alexr', AVATARS.alex, 'Berlin'),
};

function mkProfile(id: string, name: string, username: string, photo: number, tagline: string) {
  return {
    id,
    username,
    display_name: name,
    avatar_path: null,
    tagline,
    locale: 'de',
    heard_about: null,
    onboarding_done_at: daysAgo(30),
    created_at: daysAgo(60),
    updated_at: daysAgo(1),
    photo,
  };
}

/** One frosted moment waiting, one already unlocked. */
export const demoInbox: Array<InboxRow & { photo: number }> = [
  {
    trade_id: 'trade-1',
    from_id: 'mia',
    from_name: 'Mia',
    from_username: 'miahartmann',
    from_avatar_path: null,
    moment_id: 'moment-1',
    caption: 'Kurz raus, bevor der Regen kommt. Zeig mir deinen Blick.',
    captured_at: minutesAgo(12),
    status: 'pending',
    seen_at: null,
    auto_unlock_at: hoursAhead(19),
    unlocked_at: null,
    is_open: false,
    created_at: minutesAgo(12),
    photo: PHOTOS.momentOpen,
  },
  {
    trade_id: 'trade-2',
    from_id: 'ben',
    from_name: 'Ben',
    from_username: 'benkr',
    from_avatar_path: null,
    moment_id: 'moment-2',
    caption: 'Mittagspause am Wasser.',
    captured_at: minutesAgo(180),
    status: 'unlocked',
    seen_at: minutesAgo(170),
    auto_unlock_at: null,
    unlocked_at: minutesAgo(160),
    is_open: true,
    created_at: minutesAgo(180),
    photo: PHOTOS.sea,
  },
];

/** Completed trades, newest first — the profile grid. */
export const demoPairs: Array<PairRow & { leftPhoto: number; rightPhoto: number; locked: boolean }> = [
  mkPair('pair-1', 0, PHOTOS.momentOpen, PHOTOS.beach, true),
  mkPair('pair-2', 2, PHOTOS.galFlowers, PHOTOS.street, false),
  mkPair('pair-3', 4, PHOTOS.flowers, PHOTOS.sea, false),
  mkPair('pair-4', 6, PHOTOS.beach, PHOTOS.street, false),
  mkPair('pair-5', 13, PHOTOS.sea, PHOTOS.flowers, false),
  mkPair('pair-6', 16, PHOTOS.street, PHOTOS.galFlowers, false),
];

function mkPair(id: string, days: number, leftPhoto: number, rightPhoto: number, locked: boolean) {
  const at = daysAgo(days);
  return {
    trade_id: id,
    user_a: DEMO_USER_ID,
    user_b: 'mia',
    initiator_moment_id: `${id}-a`,
    responder_moment_id: `${id}-b`,
    unlocked_at: locked ? null : at,
    pair_date: at,
    created_at: at,
    leftPhoto,
    rightPhoto,
    locked,
  };
}

export const demoThreads: Array<ThreadRow & { photo?: number }> = [
  {
    partner_id: 'mia',
    last_message_id: 'm1',
    last_body: 'Hab’s gerade gesehen, warte kurz!',
    last_moment_id: null,
    last_sender_id: 'mia',
    last_at: minutesAgo(17),
    unread_count: 2,
  },
  {
    partner_id: 'ben',
    last_message_id: 'm2',
    last_body: null,
    last_moment_id: 'moment-2',
    last_sender_id: 'ben',
    last_at: minutesAgo(95),
    unread_count: 1,
    photo: PHOTOS.sea,
  },
  {
    partner_id: 'lina',
    last_message_id: 'm3',
    last_body: 'Nächste Woche bin ich wieder da',
    last_moment_id: null,
    last_sender_id: DEMO_USER_ID,
    last_at: daysAgo(1),
    unread_count: 0,
  },
  {
    partner_id: 'alex',
    last_message_id: 'm4',
    last_body: 'Das Licht war unfassbar gestern',
    last_moment_id: 'moment-9',
    last_sender_id: 'alex',
    last_at: daysAgo(2),
    unread_count: 0,
    photo: PHOTOS.flowers,
  },
  {
    partner_id: 'noah',
    last_message_id: 'm5',
    last_body: 'Ich schick dir gleich was',
    last_moment_id: null,
    last_sender_id: 'noah',
    last_at: daysAgo(3),
    unread_count: 0,
  },
];

export const demoMessages: Array<Message & { photo?: number }> = [
  {
    id: 'c1',
    sender_id: 'mia',
    recipient_id: DEMO_USER_ID,
    body: 'Guck mal, was hier los ist.',
    moment_id: 'moment-1',
    trade_id: 'trade-1',
    created_at: minutesAgo(220),
    read_at: minutesAgo(200),
    photo: PHOTOS.sea,
  },
  {
    id: 'c2',
    sender_id: DEMO_USER_ID,
    recipient_id: 'mia',
    body: 'Okay das ist unfair, hier regnet es seit heute früh.',
    moment_id: null,
    trade_id: null,
    created_at: minutesAgo(190),
    read_at: minutesAgo(180),
  },
  {
    id: 'c3',
    sender_id: 'mia',
    recipient_id: DEMO_USER_ID,
    body: 'Dann zeig mir den Regen. Zählt auch.',
    moment_id: null,
    trade_id: null,
    created_at: minutesAgo(120),
    read_at: minutesAgo(110),
  },
  {
    id: 'c4',
    sender_id: DEMO_USER_ID,
    recipient_id: 'mia',
    body: 'Bitte sehr.',
    moment_id: 'moment-7',
    trade_id: null,
    created_at: minutesAgo(60),
    read_at: minutesAgo(55),
    photo: PHOTOS.flowers,
  },
  {
    id: 'c5',
    sender_id: 'mia',
    recipient_id: DEMO_USER_ID,
    body: 'Sieht besser aus als meins.',
    moment_id: null,
    trade_id: null,
    created_at: minutesAgo(17),
    read_at: null,
  },
];

export const demoFriendRequests = [
  { id: 'fr1', profile: demoProfiles.ben, mutual: 4, verified: true },
  { id: 'fr2', profile: demoProfiles.lina, mutual: 2, verified: true },
  { id: 'fr3', profile: demoProfiles.alex, mutual: 1, verified: false },
];

export const demoSentRequests = [
  { id: 'sr1', profile: demoProfiles.noah, sentAt: daysAgo(2) },
  { id: 'sr2', profile: demoProfiles.lina, sentAt: daysAgo(1) },
];
