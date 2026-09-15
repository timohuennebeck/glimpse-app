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
cp .env.example .env      # required — fill in from the Supabase project
npx expo start
```

`.env` is required. The app talks to Supabase for everything: there is no
fixture mode and no "not configured" fallback. Without the two
`EXPO_PUBLIC_SUPABASE_*` values the client throws at import.

### Running Supabase locally

The whole stack runs on your machine, so you can develop without touching the
hosted project. It needs a Docker-compatible runtime (Docker Desktop, Rancher,
Podman, OrbStack, colima) — the CLI itself is a devDependency, so no global
install.

```bash
npm run db:start    # first run pulls images; prints local URLs and keys
npm run db:reset    # drop, replay every migration, then seed.sql
npm run db:types    # regenerate database.generated.ts from the local schema
npm run db:stop
```

`db:start` prints a publishable key and a project URL for `127.0.0.1:54321`.
Put those in `.env` to point the app at your local stack instead of the hosted
project; Studio is at `127.0.0.1:54323`.

`supabase/seed.sql` is deliberately thin: two accounts and a friendship. The
states worth looking at — a frosted trade, a completed pair, an unread thread —
are produced by the triggers and RPCs the migrations install, so seeding them
directly would bypass the logic you actually want to exercise. Make them
through the app.

Regenerate the types after **every** migration. Nothing in CI notices if you
forget, and the generated file is what types every database call in the app.

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
- **Generated types.** `src/shared/lib/database.generated.ts` is generated from
  the project — regenerate it after every migration (`supabase gen types
typescript`, or the MCP's `generate_typescript_types`) and never edit it by
  hand. App code imports row names from `src/shared/lib/database.types.ts`.

```bash
npm test                           # jest — pure logic: keys, selectors, caches
npm run typecheck                  # tsc --noEmit
npm run format                     # prettier --write .
npm run format:check               # what CI would run
npx expo export --platform ios     # verify the bundle
npx expo start --web               # drive the real UI in a browser
# If a newly added Tailwind class does not apply in the dev server, restart
# it with `--clear`: NativeWind's stylesheet is compiled by a watcher that
# can miss edits made while it runs.
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
  (onboarding)/           the 7-step signup flow, paywall
  (app)/                  feed, friends, chats
  camera · compose · recipients      the capture → send flow
  moment/ · photo/ · profile/ · chat/ · invite/

src/
  features/
    moments/              THE trade loop: inbox, composer draft, send, unlock
    feed/ camera/ friends/ chat/ profile/
    onboarding/ paywall/ auth/
    widget/               JS ↔ native snapshot bridge
  shared/
    theme/                tokens transcribed from the mock
    ui/                   Text, Button, GlassButton, LockedImage, icons…
    i18n/                 en (active) + de
    lib/                  supabase client, typed schema, formatters, artwork

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
- **Styling is Tailwind, via NativeWind.** Every static style is a `className`;
  the theme tokens in `src/shared/theme/*.ts` are the single source of truth
  and `tailwind.config.js` projects them into utilities (`bg-surface-violet-tint`,
  `rounded-card`, `h-xl`, `px-gutter`). Only runtime numbers stay as `style`:
  safe-area insets, measured widths, sizes that come from a prop, and the
  `shadow.*` presets. Conditional classes go through `cn()` from
  `src/shared/lib/cn.ts`, which merges Tailwind conflicts by meaning. Type
  sizes are not used as utilities directly — `<Text variant="…">` picks them.
  The setup follows Expo's Tailwind guide (`babel-preset-expo` with
  `jsxImportSource: 'nativewind'`, `withNativeWind` in Metro, `global.css`).
- **Icons come from `lucide-react-native`, used directly at the call site.**
  Only the brand marks in `src/shared/ui/icons.tsx` — the camera with its
  punched-out lens, the lock puck, the verified rosette, the Google mark, the
  laurel — stay bespoke.
- **Screens do not query Supabase directly.** They call a feature's `data/`
  module, which owns every query and mutation. There is no fixture mode: the
  only bundled `require()`s left are the artwork in `src/shared/lib/assets.ts`.
- **Server state goes through TanStack Query.** Each feature declares its keys
  and fetchers with `@lukemorales/query-key-factory` in a `data/*-queries.ts`
  file; `src/shared/lib/queries.ts` merges them, so `useQuery(queries.moments.inbox)`
  is the whole call and a mutation invalidates by the same key. No fetching
  inside `useEffect`.

## What is deliberately not built

| Area                   | State                                                                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Google / Apple sign-in | Designed and rendered; no provider wired. Supabase console config + `signInWithOAuth`.                                              |
| Payments               | The paywall is real UI; nothing charges. Entitlement will come from **RevenueCat**, so there is no `subscriptions` table by design. |
| The widget itself      | Both native UIs are written; the target, config plugin and native module need a Mac + Xcode. See `widgets/README.md`.               |
| Push notifications     | No token registration and nothing sent. `device_tokens` and `register_device_token()` exist; the sender does not.                   |
| Contacts import        | Not built and not shown. Onboarding step 5 is real `@username` search plus a share link.                                            |

## Known issues

- **Postgres 17.** The project runs Postgres 17; the migrations assume it.
- **`citext` and `pgcrypto` live in `public`.** The security advisor flags it.
  Moving them to an `extensions` schema is a migration nobody has needed yet.
- **Auto-unlocked trades that are never answered** stay `pending` for ever and
  never become pairs. They show as locked tiles on the sender's own profile.
  Still an open product decision — see below.
- **Deletes do not arrive live.** Supabase cannot filter delete events and does
  not apply row security to them, so a decline, a withdrawal or an unfriend
  reaches the other phone on its next refetch rather than instantly.

## Open product questions

Carried over from the positioning note, and worth deciding before more screens:

1. **Is Glimpse for a pair, or a small crew?** The trade mechanic reads very
   differently for a couple than for six friends. Current answer: `max_friends`
   defaults to 20 in `app_config`.
2. **Does an unsent trade expire, or unlock itself?** Current answer: unlocks
   after 24h (`trade_auto_unlock_hours`). The schema supports either without a
   migration.
3. **Where does the paywall sit?** Decided: it stays near the end of onboarding.
   The first capture (`camera` → `first-glimpse`) and friend invites (`friends`)
   already come before it, and it is skippable, so it does not block the growth
   loop — while most subscription trials start on day 0. What is weak is that
   none of the Plus benefits mean anything on day 0, so the follow-up is
   contextual paywalls once each feature exists: pairs about to leave the 30-day
   history, tapping month export, choosing a locked widget frame.
