# Glimpse

> Locket is a window into someone's day. Glimpse is a window that only opens both ways.

An Expo (iOS + Android) app implementing the designs handed off from Claude Design.

## The mechanic

Everything in this codebase follows from one rule:

> Their photo lands on your homescreen **frosted**, with their name on it. Tap it
> and the camera opens. The second you send one back, **both** photos unlock — on
> your widget and theirs, side by side. No sending without receiving, no looking
> without sending.

With a soft escape: an unanswered moment unlocks itself after 24 hours, so the app
is playful rather than nagging.

That is why the central database table is `trades` (a pair of photos with a lock
on it) and not `posts`, and why the widget deep-links into the **camera** rather
than the photo.

## Getting started

```bash
npm install
cp .env.example .env      # optional — the app runs on fixtures without it
npx expo start
```

Without Supabase credentials the app runs entirely on the sample data in
`src/shared/lib/fixtures.ts`, so every screen is reviewable immediately.

### Supabase keys

The client uses the project's **publishable key** (`sb_publishable_…`) as
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Supabase is retiring the legacy
JWT-shaped `anon` and `service_role` keys in favour of publishable and secret
keys ([docs](https://supabase.com/docs/guides/getting-started/api-keys)); the
app, `.env.example` and the docs use only the new names. The secret key
(`sb_secret_…`) is server-side only and is never read by the app.

Related, and already accounted for:

- **JWT signing keys.** The app never inspects the JWT itself; it calls
  `auth.getClaims()`, which verifies against the project's current signing
  key, and the SQL relies on `auth.uid()`. Rotating to asymmetric keys in the
  dashboard needs no code change.
- **Generated types.** `src/shared/lib/database.interfaces.ts` is hand-written
  against the migrations. Once a project exists, regenerate it with
  `supabase gen types typescript` so it cannot drift.

```bash
npm run typecheck                  # tsc --noEmit
npm run format                     # prettier --write .
npm run format:check               # what CI would run
npx expo export --platform ios     # verify the bundle
npx expo start --web               # drive the real UI in a browser
```

**Typecheck and bundling are not verification.** Both pass on an app that never
leaves its first screen. Before calling UI work done, run the web target and
click through the flow — that is what catches dead-end routes, wrong locales
and shrink-wrapped buttons.

**What the web target cannot verify:** the navigation shell (`NativeTabs` has a
separate web implementation), the Liquid Glass material, real safe-area insets
and the camera. Those need a simulator or a device.

> **The widget needs a dev build.** Expo Go cannot load a widget extension.
> See `widgets/README.md`.

## Layout

Feature-based: each feature owns its components, hooks and data access, and
`shared/` holds only what genuinely crosses features.

```
app/                      expo-router routes — thin, they delegate to features
  (onboarding)/           the 7-step signup flow, paywall, referrals
  (app)/                  feed, friends, chats
  camera · compose · recipients      the capture → send flow
  moment/ · photo/ · profile/ · chat/ · invite/

src/
  features/
    moments/              THE trade loop: inbox, composer draft, send, unlock
    feed/ camera/ friends/ chat/ profile/
    onboarding/ paywall/ referrals/ auth/
    widget/               JS ↔ native snapshot bridge
  shared/
    theme/                tokens transcribed from the mock
    ui/                   Text, Button, GlassButton, LockedImage, icons…
    i18n/                 en (active) + de
    lib/                  supabase client, typed schema, formatters, fixtures

supabase/migrations/      schema, functions, RLS, storage, views
widgets/ios · widgets/android    native widget sources
docs/database.md          schema design and rationale
```

## Conventions

- **Never a font weight above 600.** Enforced centrally in `src/shared/ui/text.tsx`.
- **All copy goes through i18n.** English is the active locale; German is kept
  complete in `de.ts`, since the go-to-market plan is German-speaking circles
  first. Both files are typed as the full `Translations`, so a missing key is a
  compile error rather than a screen in two languages.
- **Icons come from `lucide-react-native`.** Only the brand marks — the camera
  with its punched-out lens, the lock puck, the verified rosette — stay bespoke.
- **Screens do not query Supabase directly.** They call a feature's `data/`
  module, which falls back to fixtures when unconfigured.
- **Server state goes through TanStack Query.** Each feature declares its keys
  and fetchers with `@lukemorales/query-key-factory` in a `data/*-queries.ts`
  file; `src/shared/lib/queries.ts` merges them, so `useQuery(queries.moments.inbox)`
  is the whole call and a mutation invalidates by the same key. No fetching
  inside `useEffect`.

## What is deliberately not built

| Area                   | State                                                                                                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google / Apple sign-in | Designed and rendered; no provider wired. Supabase console config + `signInWithOAuth`.                                                                                                                                                        |
| Payments               | The paywall is real UI; nothing charges. Entitlement will come from **RevenueCat**, so there is no `subscriptions` table by design.                                                                                                           |
| The widget itself      | Both native UIs are written; the target, config plugin and native module need a Mac + Xcode. See `widgets/README.md`.                                                                                                                         |
| Blurred renditions     | Until the Edge Function that generates `blurred/` is deployed, a locked moment is **withheld** (renders as a neutral frosted tile) rather than shown. Nothing leaks, but locked photos are missing from the feed — see `docs/database.md` §3. |
| Contacts import        | The permission-granted and permission-denied states both render; no contacts are read.                                                                                                                                                        |

## Known issues

- **The blur Edge Function is not written.** Until it is, `visible_moment_paths()`
  returns `NULL` for every locked moment, so locked photos are withheld rather
  than leaked. Safe, but the frosted card has nothing to show — still the one
  genuine ship-blocker.

## Open product questions

Carried over from the positioning note, and worth deciding before more screens:

1. **Is Glimpse for a pair, or a small crew?** The trade mechanic reads very
   differently for a couple than for six friends. Current answer: `max_friends`
   defaults to 20 in `app_config`.
2. **Does an unsent trade expire, or unlock itself?** Current answer: unlocks
   after 24h (`trade_auto_unlock_hours`). The schema supports either without a
   migration.
3. **The paywall sits before the first trade.** If the growth loop is pairs, that
   is probably backwards — the mock puts it at step 10 and this build follows the
   mock, but moving it is a one-line routing change in `reviews.tsx`.
