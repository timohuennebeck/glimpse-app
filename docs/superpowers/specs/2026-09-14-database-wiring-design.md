# Wiring the app to Supabase — design

Date: 2026-09-14. Status: approved in conversation, pending written review.

## Goal

At the end of this work the app runs against the real Supabase project
(`glimpse-app`, ref `rzpydvnppvbziusxngfm`, eu-west-2) with no fixture data
left: accounts, profiles, friendships, moments, trades, messages and invites
all read from and write to the database. Every mutation is optimistic, the
last known data renders instantly on a cold start, and changes made by the
other person arrive live. Translation keys are typed constants. The result is
verified by clicking through the web build with two accounts and checking the
rows after each step.

## Decisions taken with the owner

| Topic              | Decision                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Auth               | Email + password. "Confirm email" is toggled off in the dashboard for now. Google stays inert. |
| Blur rendition     | Build and deploy the `blur-moment` Edge Function; the client invokes it before sending.    |
| Fixtures           | Removed entirely, including the "no Supabase configured" fallback. `.env` is required.     |
| Live data          | Supabase Realtime (Postgres changes) plus presence for the chat header.                    |
| Invites            | In scope: create, share `glimpse://invite/<token>`, preview and claim on the invite screen. |
| Push               | Out of scope, both token registration and sending.                                         |
| Onboarding step 5  | Real @username search plus the share link; the contacts card is removed.                   |
| i18n keys          | Generated from the locale object, SCREAMING_SNAKE, typed; `t()` accepts only real keys.    |
| Verification       | Claude drives the web build in Chrome with isolated contexts and checks rows via the MCP.  |
| Sign out           | Behind the "more" button on the own profile.                                               |
| Paywall            | Ignored; RevenueCat comes later.                                                           |
| Data layer shape   | Per-feature api / queries / mutations modules with a persisted query cache (approach A).   |

## Backend

### Migrations

The four existing migration files are applied to the project through the
Supabase MCP, in order, under their file names. From that point migrations are
append-only: no file that has been applied is edited again.

One new migration, `supabase/migrations/20260914200000_app_wiring.sql`:

- `alter table public.trades replica identity full;` likewise `messages` and
  `friendships`, then `alter publication supabase_realtime add table
  public.trades, public.messages, public.friendships;`. Change events carry
  the full row, so filters work for updates and deletes. Row-level security
  applies to every subscriber.
- `public.mutual_friends_counts(p_user_ids uuid[]) returns table (user_id
  uuid, mutual int)`, security definer, the batch form of the existing count,
  granted to `authenticated` and revoked from `anon`/`public`.

Nothing else changes in the schema. Search, requests, threads, messages and
invites are served by the existing tables, views and policies through
PostgREST queries.

### Auth

Email and password through Supabase Auth. Sign-up passes `first_name` and
`locale` in `options.data`; the existing `handle_new_user` trigger creates
the profile row and generates the username. Password rules stay as the UI
already enforces (nine characters or more). Google sign-in remains inert.

### Edge Function `blur-moment`

Deployed through the MCP with JWT verification on. Request body
`{ "moment_id": "<uuid>" }`.

1. Read the caller from the `Authorization` header with a user-scoped client;
   refuse if the moment's `author_id` is not the caller.
2. With the service role, download `original_storage_path`, decode with
   `@imagemagick/magick-wasm` (the library Supabase's own example uses),
   resize to 48px wide keeping aspect ratio, apply a blur, encode JPEG.
3. Upload to `blurred/{author_id}/{same file name}` and set
   `moments.blurred_storage_path`.
4. Return `{ blurred_storage_path }`.

The client calls it after inserting the moment row and before
`send_moment` or `respond_to_trade`. If it fails the send fails and can be
retried; a recipient never sees the original before the unlock.

### Storage

Buckets and policies come from the existing migrations. Avatars are written
to `avatars/{uid}/{timestamp}.jpg`; the profile row is updated, then the
previous object is deleted. A new avatar therefore has a new URL and no image
cache shows a stale one.

### Environment

`.env` (gitignored) gets `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the MCP's project URL and
publishable key.

## App architecture

### Session (`src/features/auth/`)

- `data/auth-api.ts`: `signUp({ email, password, firstName, locale })`,
  `signIn({ email, password })`, `signOut()`.
- `hooks/use-session.ts`: a store (built with the existing `create` helper)
  holding `{ status: 'loading' | 'signed-out' | 'signed-in', userId }`,
  initialised from `auth.getSession()` and kept current by
  `onAuthStateChange`.
- The root layout wraps the signed-in routes in `Stack.Protected` guarded by
  the session: `(app)`, `camera`, `compose`, `recipients`, `moment/*`,
  `photo/*`, `profile/*`, `chat/*`. `(onboarding)` and `invite/*` are open.
- `app/index.tsx` renders nothing until the session status is known, then
  redirects: signed out → welcome; signed in and `profiles.onboarding_done_at`
  set → feed; signed in without it → the onboarding friends step.
- Sign-out clears the query cache, the persisted cache, the composer and
  onboarding drafts, and the signed-URL cache, then routes to welcome.

### Onboarding draft (`src/features/onboarding/hooks/use-onboarding-draft.ts`)

Holds `firstName` and `avatarUri` between the name, avatar and details
steps, because the account only exists after step 4. Reset after sign-up
completes.

### Data layer per feature

```
src/features/<feature>/data/
  <feature>-api.ts         raw Supabase calls, typed against Database
  <feature>-queries.ts     createQueryKeys(...) — merged into shared/lib/queries.ts
  <feature>-mutations.ts   useMutation hooks with optimistic cache patches
```

Features and their modules:

- **profile**: `fetchMe`, `fetchProfile(id)`, `updateProfile(patch)`,
  `uploadAvatar(uri)`. Keys `profile.me`, `profile.byId(id)`.
- **friends**: `searchProfiles(q)`, `fetchFriends`, `fetchRequests`
  (incoming pending, requester embedded via the FK), `fetchSentRequests`,
  `fetchMutualCounts(ids)`, `sendFriendRequest(userId)`,
  `acceptFriendRequest(id)`, `removeFriendship(id)`. Keys `friends.list`,
  `friends.requests`, `friends.sent`, `friends.search(q)`,
  `friends.mutual(ids)`.
- **moments**: existing `fetchInbox`, `fetchPairs`, `fetchMomentPhoto`,
  `createMoment` (now also invokes `blur-moment`), `sendMoment`,
  `respondToTrade`, `markTradeSeen`. Keys unchanged.
- **chat**: `fetchThreads` (`v_threads` plus one profiles query for the
  partners), `fetchMessages(partnerId)`, `sendMessage({ recipientId,
  content, tradeId? })`, `markThreadRead(partnerId)`. Keys `chat.threads`,
  `chat.messages(partnerId)`.
- **invites**: `createInvite(momentId?)` returning the token,
  `fetchInvitePreview(token)`, `claimInvite(token)`. Keys
  `invites.preview(token)`.

`src/shared/lib/fixtures.ts` becomes `src/shared/lib/assets.ts` and keeps
only bundled design images that screens still show: `ART`, `IOS_ICONS`,
`PHOTOS.viewfinder`, `PHOTOS.widgetCard`, and the three review faces. Every
`demo*` export and `DEMO_USER_ID` is deleted.

### Optimistic updates

`src/shared/lib/optimistic.ts` exports one helper:

```ts
optimistic<TData>(queryKey, patch: (old: TData | undefined, vars) => TData)
  → { onMutate, onError, onSettled }
```

`onMutate` cancels in-flight fetches for the key, snapshots the cache,
applies the patch and returns the snapshot; `onError` restores it;
`onSettled` invalidates the key. Every mutation hook spreads the result.
Screens navigate at mutate time, never after the response.

Mutations and their optimistic patch:

| Mutation             | Patch                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| send friend request  | append to `friends.sent`; result row flips to "Sent"                    |
| accept request       | remove from `friends.requests`, append to `friends.list`                 |
| remove friendship    | remove from whichever list holds it                                       |
| send message         | append `{ id: temp, status: 'sending' }` to `chat.messages(partner)`; update the thread's last message |
| mark thread read     | set `unread_count` to 0 for the thread; `read_at` on the messages        |
| mark trade seen      | set `seenAt` on the inbox item                                           |
| respond to trade     | set `isOpen: true` on the inbox item (photo sharpens on refetch)         |
| update profile       | merge the patch into `profile.me`                                        |
| claim invite         | none; the result drives navigation                                       |

Temporary ids come from `expo-crypto`'s `randomUUID`.

### Outbox for uploads

Uploading a photo takes real time, so sending is not a plain mutation.
`src/features/moments/hooks/use-outbox.ts` is a store of pending sends:

```
{ id, kind: 'send' | 'reply', localUri, width, height, caption,
  recipientIds | tradeId, recipientNames, status: 'sending' | 'failed', error? }
```

The recipients screen (or compose, when answering) adds an entry and
navigates immediately. A runner drains the store: create moment → blur →
`send_moment` or `respond_to_trade` → invalidate inbox and pairs → remove
the entry. On failure the entry becomes `failed` with the message. The feed
renders the store as a slim line above the cards: "Sending to Mia…" or
"Couldn't send · Retry". Answering opens the moment screen at once with the
inbox item patched to `isOpen: true`; the image swaps from the blurred to the
original rendition when the refetch lands.

### Cold start without loading

- `PersistQueryClientProvider` from `@tanstack/react-query-persist-client`
  with `@tanstack/query-async-storage-persister` over AsyncStorage,
  `maxAge` 24h, `gcTime` 24h. The persisted cache is dropped on sign-out and
  when the app version changes (buster = app version).
- `src/shared/lib/signed-urls.ts` caches `{ path → url, expiresAt }` in
  memory and AsyncStorage. URLs are signed for 24h and re-signed only when
  under two hours remain. `signedMomentUrls` reads through this cache, so
  refetches return the same URL and `expo-image` serves from its disk cache.
- Right after sign-in, `profile.me`, `moments.inbox`, `friends.list` and
  `chat.threads` are prefetched.

### Live updates (`src/features/live/`)

`use-live-updates.ts` is mounted once inside the signed-in layout. It opens
one channel `user:<uid>` with Postgres change listeners:

| Table       | Event         | Filter                          | Cache effect                                          |
| ----------- | ------------- | ------------------------------- | ----------------------------------------------------- |
| trades      | INSERT        | `responder_id=eq.<uid>`         | invalidate `moments.inbox`                            |
| trades      | UPDATE        | `responder_id=eq.<uid>`         | invalidate `moments.inbox`, `moments.pairs`           |
| trades      | UPDATE        | `initiator_id=eq.<uid>`         | invalidate `moments.pairs`                            |
| messages    | INSERT        | `recipient_id=eq.<uid>`         | append to `chat.messages(sender)`, invalidate threads |
| messages    | UPDATE        | `sender_id=eq.<uid>`            | patch `read_at` in `chat.messages(recipient)`         |
| friendships | INSERT/UPDATE/DELETE | `recipient_id=eq.<uid>`  | invalidate `friends.*`                                |
| friendships | INSERT/UPDATE/DELETE | `requester_id=eq.<uid>`  | invalidate `friends.*`                                |

On `SUBSCRIBED` after a reconnect, every key is invalidated once.

Presence: the same hook tracks the user on channel `presence:<uid>`. The
chat screen subscribes to `presence:<partnerId>` and shows "Active now" only
while the partner's state is present.

## Screens

Unlisted screens are unchanged.

### Onboarding

- **Welcome** — "Sign in" opens details with `mode=signin`.
- **Name** — writes `firstName` to the draft.
- **Avatar** — "Choose a photo" opens `expo-image-picker` (new dependency,
  images only, 1:1 crop where the platform supports it); the URI goes to the
  draft. Skip continues without one.
- **Details** — sign-up mode: `signUp` with the draft name and the active
  locale, upload the draft avatar if present and update the profile, claim a
  pending invite token if one is stored, then `router.replace` to the friends
  step. Sign-in mode: `signIn`, then route by `onboarding_done_at`. Errors
  render inline under the button.
- **Friends (5 of 7)** — the search field is a real input with a 250ms
  debounce over `friends.search(q)`; results use the relationship state from
  my friendships (Add / Requested / Friends / Accept). The contacts card and
  `ContactsInvite` are removed. The share row creates an invite and shares
  the link.
- **Heard about** — `updateProfile({ heard_about })`, optimistic, then the
  thank-you screen.
- **Thank you** — `updateProfile({ onboarding_done_at: now })` on mount.

### Main app

- **Feed** — header from `profile.me`; stories are me plus the senders of
  frosted moments with real avatars; the empty state shows only when
  `friends.list` is empty and the inbox is empty; the outbox line renders
  above the cards while a send is in flight.
- **Friends tab** — rail from `friends.list` with `waiting` true when that
  friend has a frosted moment in my inbox; requests with mutual counts and
  Accept; sent requests with a withdraw action (delete); badges are the
  request count and the unread total. "Invite more" shares an invite.
- **Chats tab** — `chat.threads`; a photo attachment shows the moment
  thumbnail through the signed-URL cache; unread counts real.
- **Add friend** — real search; Add / Sent / Friends / Accept per result;
  the share row creates an invite; QR stays inert.
- **Own profile** — `profile.me` and all my pairs; "more" opens an action
  sheet whose only item is Sign out.
- **Friend profile** — `profile.byId` and pairs between us; the trade CTA
  pre-selects them.
- **Chat** — `chat.messages(partner)` newest at the bottom; the composer
  sends optimistically; opening marks the thread read; incoming messages
  appear live; "Active now" from presence. Attachments stay out.
- **Moment** — as today, plus the reply bar sends a message with `trade_id`.
- **Recipients** — "Waiting on you" lists friends whose frosted moment I
  have not answered, selectable like the others; sending enqueues to the
  outbox and returns to the feed.
- **Invite** (`/invite/<token>`) — `invites.preview(token)`; signed out:
  store the token and start onboarding; signed in: `claimInvite`, then open
  the camera for the returned trade. A dead token renders
  "This moment is no longer here."

### Share links

`src/features/invites/share-invite.ts` exposes `shareInvite(momentId?)`:
create the invite, then `Share.share` with `glimpse://invite/<token>`. The
base URL is one constant, to be swapped for a universal link once a domain
exists. Share rows display `@<username>` in place of the fixed
`glimpse.app/@you` text.

## i18n key constants

`src/shared/i18n/keys.ts`:

- `buildKeys(en)` walks the English locale at import time and returns a tree
  in which every key is SCREAMING_SNAKE and every leaf is its dot path.
- Types: `ScreamingSnake<S>` (template-literal recursion over the key),
  `KeyTree<T>` (mapped type with `as ScreamingSnake<K>`), `TranslationKey`
  (union of string-leaf paths) and `TranslationListKey` (union of array-leaf
  paths).
- Exports: `NAV`, `COMMON`, `TIME`, `ONBOARDING`, `PAYWALL`, `FEED`,
  `CAMERA`, `COMPOSE`, `MOMENT`, `FRIENDS`, `CHAT`, `PROFILE`, `PHOTO`,
  `INVITE`, `ERRORS`.
- `t(key: TranslationKey, options?)` and `tList(key: TranslationListKey)`.

Migration: a one-off script rewrites every `t('a.b.c')` and `tList('…')`
call to the constant form and adds the import; the two dynamic sites (the
heard-about options, the friends/chats tab labels) are rewritten by hand to
select a constant. The script is not kept.

## Error handling

- Mutations roll back the cache and show `errorMessage(error)` inline where
  the action was taken, in the existing style. Nothing is swallowed.
- Auth errors show Supabase's message under the details form.
- A failed outbox entry stays visible with Retry; retry re-runs the same
  entry.
- A Realtime disconnect invalidates everything once on reconnect.
- `blur-moment` failing fails the send. The recipient never receives a
  withheld or unblurred moment.
- The signed-URL cache falls back to signing when the stored entry is
  missing or expired.

## Dependencies added

`expo-image-picker`, `expo-crypto`, `@tanstack/react-query-persist-client`,
`@tanstack/query-async-storage-persister`.

## Verification

1. `npm install`.
2. Apply the five migrations through the MCP in order; run the security and
   performance advisors and fix what they flag.
3. Deploy `blur-moment`.
4. Write `.env` from the MCP.
5. `npm run typecheck` and `npm run format:check` pass.
6. Web build in Chrome through the DevTools MCP, three isolated contexts
   (users A, B, C). A fake `getUserMedia` stream is injected so the camera
   screens work. Steps, each followed by a row check through the MCP:
   - B signs up (name, practice shot, skip avatar, details): profile row,
     generated username.
   - A signs up with an avatar: profile row, avatar object under
     `avatars/<A>/`.
   - A searches B's handle and adds: friendship pending, requester A.
   - B accepts (arrives live): status accepted, `responded_at` set.
   - A captures and sends to B: moment with `width`/`height`, both storage
     paths, `blurred_storage_path` set by the function; trade pending with
     `auto_unlock_at`.
   - B opens the frosted card: `seen_at` set. B trades back: second moment,
     trade unlocked with `unlocked_at`; both feeds show the pair.
   - A messages B, B replies: two message rows; `read_at` set when opened;
     `v_threads` unread counts.
   - A shares an invite; C opens `/invite/<token>` signed out, signs up:
     invite `claimer_id`, friendship A–C accepted, trade A→C pending.
   - A signs out and signs back in: feed renders from the persisted cache
     before the network answers.
7. Report: what passed, what did not, with the rows as evidence.

Known limits, stated in the report: the native tab bar is a web substitute;
the widget and push are not exercised; if the fake camera does not satisfy
`expo-camera` on web, the two capture steps are handed to the owner on a
phone while the rows are checked here.

## Out of scope

Push notifications, contacts import, chat attachments, universal links,
Google sign-in, RevenueCat and the paywall, blocking and reporting UI, the
native widget module.
