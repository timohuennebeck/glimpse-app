/**
 * Bundled design artwork. Not data: every screen that shows a person, a photo
 * or a message now reads the real thing from Supabase.
 *
 * What is left is illustration — the onboarding heroes, the mascot, the fake
 * iOS homescreen behind the widget preview, and the three faces on the reviews
 * screen, which are stock portraits standing in for quotes rather than accounts.
 */
export const ART = {
  mascot: require('../../../assets/images/mascot.png'),
  mascotUnlock: require('../../../assets/images/mascot-unlock.png'),
  welcomeHero: require('../../../assets/images/welcome-hero.png'),
  cameraHero: require('../../../assets/images/camera-hero.png'),
  signupKey: require('../../../assets/images/signup-key-hero.png'),
  bell: require('../../../assets/images/bell.png'),
};

export const PHOTOS = {
  /** Behind the compose screen when it is reached without a capture. */
  viewfinder: require('../../../assets/images/viewfinder.png'),
  /** The sample photo inside the widget preview on onboarding step 6. */
  widgetCard: require('../../../assets/images/on8-widget-card.png'),
};

/** The faked homescreen the widget preview sits on. */
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
};

/**
 * Stock portraits for the three review quotes, and for "Mia" in the widget
 * preview. Named for what they are, so nobody mistakes them for avatars again.
 */
export const SAMPLE_FACES = {
  mia: require('../../../assets/images/av-mia.png'),
  ben: require('../../../assets/images/av-ben.png'),
  lina: require('../../../assets/images/av-lina.png'),
};
