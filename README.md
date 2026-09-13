# Glimpse

> Locket is a window into someone's day. Glimpse is a window that only opens both ways.

An Expo (iOS + Android) app implementing the designs handed off from Claude Design.
The original bundle is preserved in `project/`; the handoff instructions are in
`docs/design-handoff.md`.

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

```bash
npm run typecheck                  # tsc --noEmit
npx expo export --platform ios     # verify the bundle
npx expo start --web               # drive the real UI in a browser
```

**Typecheck and bundling are not verification.** Both pass on an app that never
leaves its first screen. Before calling UI work done, run the web target and
click through the flow — that is what catches dead-end routes, wrong locales
and shrink-wrapped buttons.

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
    i18n/                 de (active) + en
    lib/                  supabase client, typed schema, formatters, fixtures

supabase/migrations/      schema, functions, RLS, storage, views
widgets/ios · widgets/android    native widget sources
docs/database.md          schema design and rationale
```

## Conventions

- **Never a font weight above 600.** Project rule from `project/CLAUDE.md`;
  enforced centrally in `src/shared/ui/Text.tsx`.
- **All copy goes through i18n.** German is the launch locale (the positioning
  note says to seed German-speaking circles first); English is scaffolded and
  falls back to German for untranslated keys.
- **Screens do not query Supabase directly.** They call a feature's `data/`
  module, which falls back to fixtures when unconfigured.

## What is deliberately not built

| Area | State |
|---|---|
| Google / Apple sign-in | Designed and rendered; no provider wired. Supabase console config + `signInWithOAuth`. |
| Payments | The paywall is real UI; nothing charges. Entitlement will come from **RevenueCat**, so there is no `subscriptions` table by design. |
| The widget itself | Both native UIs are written; the target, config plugin and native module need a Mac + Xcode. See `widgets/README.md`. |
| Blurred renditions | `visible_moment_url()` falls back to the original until the Edge Function that generates `blurred/` is deployed. **Do not ship without it** — see `docs/database.md` §3. |
| Contacts import | The permission-granted and permission-denied states both render; no contacts are read. |

## Known issues

- **`fetchInbox` is N+1.** It signs one URL per moment, so a feed of 20 moments
  makes 20 round trips. Needs a batch RPC returning all signed URLs in one call.
- **The blur Edge Function is not written.** Until it is, `visible_moment_url()`
  falls back to the original and a locked photo is not actually protected. This
  is the one genuine ship-blocker.

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
