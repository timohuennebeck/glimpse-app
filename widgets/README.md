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

| | iOS | Android |
|---|---|---|
| Technology | WidgetKit + SwiftUI | `AppWidgetProvider` + RemoteViews |
| Can run JS? | No | No |
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

**Done here:** both widget UIs, the snapshot format, and the JS bridge contract.

**Remaining, and it needs a Mac + Xcode:**

1. **Add the iOS target.** Install `@bacons/apple-targets`, add it to
   `app.json`'s plugins with the App Group, then `npx expo prebuild -p ios`.
   Copy `ios/GlimpseWidget/` into the generated target.
2. **Add the Android provider.** Write a small config plugin (`withAndroidWidget`)
   that copies `android/src/main/…` into the generated project and registers the
   receiver in `AndroidManifest.xml`.
3. **Write the native module** `GlimpseWidget` exposing `writeSnapshot(json)` and
   `reloadWidget()` — on iOS calling `WidgetCenter.shared.reloadAllTimelines()`,
   on Android `AppWidgetManager.updateAppWidget`. The TS side already expects
   exactly this shape. It must also **download the moment's signed URL into the
   shared container as `imageFile`** before writing the snapshot — today nothing
   writes that file, so the widget would render a missing image.
4. **Android resources** are in place: `res/values{,-de}/strings.xml` and the
   four drawables the layout references (`widget_background`, `widget_scrim`,
   `widget_lock_puck`, `widget_camera_badge`). `glimpse_widget_info.xml` still
   has to be registered in the manifest by the config plugin.
5. **Build with EAS.** `eas build --profile development`. Expo Go cannot load a
   widget extension, so the widget is invisible until you install a dev build.

None of steps 1–5 can be completed or verified from this Linux container — there
is no Xcode and no device. Everything above the line is code you can read and
review now; everything below needs a machine that can build it.
