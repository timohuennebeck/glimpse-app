const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withEntitlementsPlist,
} = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

const APP_GROUP = 'group.app.glimpse.mobile';
const WIDGET_PACKAGE = 'app.glimpse.widget';

/** Copies a directory tree, creating parents, overwriting what is already there. */
function copyTree(from, to, rename = (name) => name) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    if (entry.isDirectory()) copyTree(source, path.join(to, entry.name), rename);
    else fs.copyFileSync(source, path.join(to, rename(entry.name)));
  }
}

/**
 * Android: the provider, its layout, drawables and strings live in `widgets/`
 * so they can be read and reviewed without a generated project in the way.
 * Prebuild wipes `android/`, so they are copied in on every run.
 *
 * The string files are renamed rather than copied as `strings.xml`: Expo
 * generates its own with `app_name` in it, and Android merges every file under
 * `res/values/` anyway. Renaming keeps both, and keeps the widget's own
 * escaping (`\'`) exactly as written instead of round-tripping it through an
 * XML parser that would double the backslash.
 */
function withAndroidWidgetSources(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const from = path.join(cfg.modRequest.projectRoot, 'widgets/android/src/main');
      const to = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main');
      if (!fs.existsSync(from)) {
        throw new Error(`with-glimpse-widget: widgets/android/src/main is missing at ${from}`);
      }
      copyTree(from, to, (name) => (name === 'strings.xml' ? 'glimpse_widget_strings.xml' : name));
      return cfg;
    },
  ]);
}

/**
 * Android: register the provider. A widget the launcher cannot offer is the
 * same as no widget, and the receiver is what makes it offerable.
 */
function withAndroidWidgetReceiver(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    application.receiver = (application.receiver ?? []).filter(
      (r) => r.$['android:name'] !== `${WIDGET_PACKAGE}.GlimpseWidgetProvider`,
    );
    application.receiver.push({
      $: {
        'android:name': `${WIDGET_PACKAGE}.GlimpseWidgetProvider`,
        'android:exported': 'false',
        // Defined in widgets/android/src/main/res/values/strings.xml.
        'android:label': '@string/widget_name',
      },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }] }],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/glimpse_widget_info',
          },
        },
      ],
    });
    return cfg;
  });
}

/**
 * iOS: the App Group is the only channel between app and widget — the snapshot
 * lives in its UserDefaults suite and the photo in its container. app.json
 * already declares it; this keeps the generated entitlements honest if that
 * entry is ever dropped.
 */
function withAppGroup(config) {
  return withEntitlementsPlist(config, (cfg) => {
    const key = 'com.apple.security.application-groups';
    const groups = new Set(cfg.modResults[key] ?? []);
    groups.add(APP_GROUP);
    cfg.modResults[key] = [...groups];
    return cfg;
  });
}

/**
 * The widget's app-side plumbing.
 *
 * NOT handled here: creating the iOS WidgetKit extension target. That means
 * writing an Xcode target into the pbxproj, which `@bacons/apple-targets`
 * already does well; see widgets/README.md. Everything else — the Android
 * provider, its resources, the manifest receiver and the App Group — runs on
 * every prebuild.
 */
module.exports = function withGlimpseWidget(config) {
  return withAppGroup(withAndroidWidgetReceiver(withAndroidWidgetSources(config)));
};
