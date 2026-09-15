# Glimpse widgets

The widget is the product, not a companion feature:

> Locket: a surface without a loop. BeReal: a loop without a surface.
> Glimpse's opening: put the obligation on the surface. The widget is not a
> frame, it's a request.

So it gets its own directory and its own attention.

---

## Why this is native code

**React Native cannot render a homescreen widget on either platform.** There is
no JS runtime in the widget process:

|             | iOS                                     | Android                                       |
| ----------- | --------------------------------------- | --------------------------------------------- |
| Technology  | WidgetKit + SwiftUI                     | `AppWidgetProvider` + RemoteViews             |
| Can run JS? | No                                      | No                                            |
| Source here | `ios/GlimpseWidget/GlimpseWidget.swift` | `android/src/main/…/GlimpseWidgetProvider.kt` |

Expo does **not** remove this work. What Expo gives you is that you never have
to eject: with Continuous Native Generation the widget is attached through a
config plugin, and `android/` and `ios/` stay generated.

The two implementations are deliberately small and deliberately parallel — the
same snapshot, the same three states (frosted / empty / open), the same deep
link.

---

## How data reaches the widget

The widget has no network access and cannot call Supabase. Instead:

```
app (JS)                       shared container              widget (native)
────────                       ────────────────              ───────────────
publishSnapshot(inbox)  ──►    snapshot JSON        ──►      renders
                               + cached .jpg
```

- **iOS**: App Group `group.app.glimpse.mobile` — `UserDefaults` for the JSON,
  the group container directory for the image.
- **Android**: `SharedPreferences` for the JSON, `filesDir` for the image.

`src/features/widget/data/widgetBridge.ts` is the single JS entry point. It is a
no-op when the native module is absent (Expo Go, or before a prebuild), so
nothing crashes during development.

### The image written to disk is already blurred

Important: while a trade is locked, the file placed in the shared container is
the **server's pre-blurred rendition**, fetched through
`public.visible_moment_url()`. The original never reaches the device before the
trade completes. The `.blur()` in the Swift view and the scrim in the Android
layout are presentation only — they are not what keeps the photo private. See
`docs/database.md` §3.

### Refreshing while the app is closed

A moment landing sends a **silent push** (`content-available` / FCM data
message). The app wakes, refetches the inbox, calls `publishSnapshot()`, and the
widget reloads. Without push the widget only updates on its timeline interval
(30 min), which is too slow for the loop to feel alive — so notification
permission is a real part of the product, not a nag. That is why onboarding step
6 exists.

---

## What is done vs. what remains

**Done here:** both widget UIs, the snapshot format, the JS bridge, the native
module (`modules/glimpse-widget`) and the config plugin
(`plugins/with-glimpse-widget.js`).

The module exposes `isAvailable`, `writeSnapshot`, `cacheImage`, `pruneImages`
and `reloadWidget`. `cacheImage` is the one that was missing: the widget cannot
fetch a signed URL, so the app downloads the photo into the shared container
before naming it in a snapshot — otherwise the widget draws a missing image.
`publishSnapshot` caches first, writes second, reloads last, for that reason.

**Verified on Linux, without a device:** autolinking finds the module on both
platforms with the right class names; `npx expo prebuild -p android` copies the
provider, layout, drawables and both string files, and registers the receiver
with its intent filter and `glimpse_widget_info` metadata; the app bundles on
web, iOS and Android with the module wired in.

**Remaining, and it needs a Mac + Xcode:**

1. **Add the iOS target.** Install `@bacons/apple-targets`, add it to
   `app.json`'s plugins with the App Group, then `npx expo prebuild -p ios`.
   Copy `ios/GlimpseWidget/` into the generated target. The config plugin here
   deliberately does not write an Xcode target — that means editing the pbxproj,
   which `@bacons/apple-targets` already does well.
2. **Build and install.** `eas build --profile development`. Expo Go cannot load
   a widget extension or a custom native module, so the widget stays invisible
   until a dev build is on the device.
3. **Check the Android build compiles.** The provider and module are written but
   have never been through Gradle — there is no Android SDK in this container.

None of steps 1–3 can be verified from this Linux container. Everything above
them is code you can read, and the Android half is generated and inspected on
every prebuild.
