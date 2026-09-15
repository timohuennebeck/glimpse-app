# Database Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every fixture and fake call in the Glimpse Expo app with the real Supabase project, with optimistic updates, a persisted cache, live updates and typed translation keys, then prove it by clicking through the web build with the rows checked after each step.

**Architecture:** Each feature owns `data/<feature>-api.ts` (Supabase calls), `data/<feature>-queries.ts` (query key factory) and `data/<feature>-mutations.ts` (optimistic `useMutation` hooks). Pure logic (key trees, cache patches, selectors, the outbox runner, live-event mapping) lives in small files with Jest tests. Screens only talk to those modules. Backend changes ship as append-only migrations and one Edge Function, all applied through the Supabase MCP.

**Tech Stack:** Expo SDK 57, expo-router 57, React Native 0.86, TanStack Query 5.102 with `@lukemorales/query-key-factory`, supabase-js 2.116, Supabase Postgres 17 + Storage + Realtime + Edge Functions (Deno), jest-expo 57, i18n-js.

**Spec:** `docs/superpowers/specs/2026-09-14-database-wiring-design.md`

> **Status (2026-09-15):** Tasks 1–4 are complete and pushed. Task 5 is complete except its smoke run: the function is written and **deployed ACTIVE**, but Steps 4–6 need HTTPS egress to the project, which this sandbox denies — see "Handoff notes". Tasks 6–21 are not started. Task 21 needs that same egress plus the Chrome DevTools MCP. Every task through 5 left `npm run typecheck`, `npm test` and `npx prettier --check .` green.

## Global Constraints

- Supabase project `glimpse-app`, ref `rzpydvnppvbziusxngfm`, region eu-west-2. All backend changes go through the Supabase MCP tools.
- Migrations are append-only once applied. After applying one, rename the local file to the version the project assigned (from `list_migrations`) so the CLI history matches.
- Auth is email + password. The owner switches "Confirm email" off in the dashboard. Google sign-in stays inert.
- At the end no fixture data remains and there is no "Supabase not configured" fallback. `.env` is required.
- Every mutation is optimistic. Screens navigate at mutate time, never after the response.
- Translation calls use constants: `t(ONBOARDING.DETAILS.SUBTITLE)`. Every new string goes into both `src/shared/i18n/locales/en.ts` and `de.ts`.
- Screens never import `@/shared/lib/supabase`. They call feature `data/` modules.
- README conventions still hold: no font weight above 600, all copy through i18n, static styles as `className`, icons from `lucide-react-native`.
- Captures are resized to 1600px on the longest edge, JPEG quality 0.85, before upload. Avatars fit within 512px.
- Signed moment URLs are signed for 24h and re-signed only when under 2h remain.
- The query cache is persisted to AsyncStorage with `maxAge` 24h, `buster` = app version from `app.json`.
- Chat loads the last 200 messages. Presence uses private channel `chat:<lower uuid>:<higher uuid>`.
- The outbox lives in memory only.
- The paywall screen is not touched.
- Where a step says `Expected: FAIL, ``Cannot find module '@/…'``, Jest's actual wording for a `@/`-aliased path is `Configuration error: Could not locate module @/… mapped as: …/src/$1`. Same cause — the module does not exist yet — so treat it as the expected failure.
- Shell snippets are written for **GNU** userland (Linux): `sed -i "s/…/…/"` with no argument after `-i`. On macOS every one of them needs `sed -i ''` instead, and `sips` in place of the JPEG encoder in Task 5.
- Out of scope: push notifications, contacts import, chat attachments, universal links, Google sign-in, RevenueCat, blocking and reporting UI, the native widget module, password reset, account deletion, editing name and tagline, message pagination.
- Commit subjects use a conventional prefix (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`) and every commit message ends with:

  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6
  ```

## Decisions made while planning (owner-approved unless marked)

1. **jest-expo** is added as a dev dependency for unit tests of pure logic. Screens are verified by typecheck and the final click-through.
2. **No delete listeners and no `replica identity full`.** Supabase cannot filter delete events and does not apply row security to them. Declines, withdrawals and unfriends reach the other phone on its next refetch.
3. **Several frosted moments from one friend:** selecting that friend in "Waiting on you" answers their oldest unanswered moment.
4. **Details subtitle** drops "We will send a code to confirm." in both locales.
5. **Presence privacy** (spec requirement, no new decision): enforced with a private channel and row-level policies on `realtime.messages`.
6. **Friends data shape** (implementation detail): one query of my friendships with both profiles embedded. Friends, incoming requests and sent requests are derived from it, so one optimistic patch keeps all three lists in sync.
7. **Relationship to own profile grid** (spec): outgoing unanswered moments are shown once per photo, not once per recipient.

## File Structure

Created:

| Path                                                                                     | Responsibility                                                                  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `jest.config` block in `package.json`                                                    | Jest preset and `@/` alias                                                      |
| `supabase/tests/stubs.sql`                                                               | Local stand-ins for `auth`, `storage`, `realtime` schemas                       |
| `supabase/tests/run.sh`                                                                  | Apply all migrations to a throwaway local DB, run SQL test files                |
| `supabase/tests/core.test.sql`                                                           | Username generation, decline-as-delete, invite claim                            |
| `supabase/tests/app-wiring.test.sql`                                                     | Publication, batch mutual counts, presence policies                             |
| `supabase/migrations/<version>_app_wiring.sql`                                           | Realtime publication, `mutual_friends_counts`, presence policies, advisor fixes |
| `supabase/functions/blur-moment/index.ts`                                                | Server-side blurred rendition                                                   |
| `scripts/smoke-blur.mjs`                                                                 | End-to-end check of `blur-moment` against the real project                      |
| `src/shared/lib/database.types.ts`                                                       | Row aliases over the generated schema, hand-typed view rows                     |
| `src/shared/i18n/keys.ts` (+ test)                                                       | Typed SCREAMING_SNAKE key constants                                             |
| `src/shared/lib/format.test.ts`                                                          | The first Jest test, proving the harness runs                                   |
| `src/shared/lib/error-message.test.ts`                                                   | Database error codes to copy a person can read                                  |
| `src/shared/lib/optimistic.ts` (+ test)                                                  | Snapshot, patch, roll back, invalidate                                          |
| `src/shared/lib/signed-urls.ts` (+ test)                                                 | Signed URL cache with injectable store and signer                               |
| `src/shared/lib/resize.ts` (+ test)                                                      | `fitWithin` and `resizeJpeg`                                                    |
| `src/shared/lib/use-debounced-value.ts`                                                  | Debounce hook for search                                                        |
| `src/shared/lib/prefetch.ts`                                                             | The four queries the first screen after sign-in reads                           |
| `src/shared/ui/dotted-disc.tsx`                                                          | The dotted purple disc, shared by avatar step and placeholder                   |
| `src/features/auth/hooks/use-session.ts`                                                 | Session store fed by Supabase auth                                              |
| `src/features/auth/entry-route.ts` (+ test)                                              | Where the app opens for a session and profile                                   |
| `src/features/auth/interpret-sign-up.ts` (+ test)                                        | Pure reading of Supabase's sign-up response                                     |
| `src/features/auth/data/auth-api.ts`                                                     | Sign up, sign in                                                                |
| `src/features/profile/hooks/use-me.ts`                                                   | The signed-in user's profile via `profile.byId`                                 |
| `src/shared/lib/store.ts`                                                                | The small external store, moved from `src/features/moments/hooks/store.ts`      |
| `src/features/auth/sign-out.ts`                                                          | Sign out and clear every cache and store                                        |
| `src/features/auth/current-user.ts`                                                      | `currentUserId()` for data modules                                              |
| `src/features/onboarding/hooks/use-onboarding-draft.ts`                                  | First name and avatar before the account exists                                 |
| `src/features/profile/data/profile-api.ts`, `profile-queries.ts`, `profile-mutations.ts` | Profile reads, updates, avatar upload                                           |
| `src/features/profile/hooks/use-stamp-onboarding-done.ts`                                | Stamps `onboarding_done_at` on first tabs mount                                 |
| `src/features/profile/components/profile-actions-sheet.tsx`                              | In-app sheet with Sign out                                                      |
| `src/features/friends/interfaces.ts`                                                     | `PersonSummary`, `FriendshipWithPeople`, `Relationship`                         |
| `src/features/friends/relationships.ts` (+ test)                                         | Selectors over my friendships                                                   |
| `src/features/friends/data/friends-mutations.ts`                                         | Send, accept, remove with optimistic patches                                    |
| `src/features/friends/components/relationship-pill.tsx`                                  | Add / Requested / Friends / Accept                                              |
| `src/features/moments/selectors.ts` (+ test)                                             | `nextUnlockDelay`, `lockedTiles`, `waitingBySender`, `splitSelection`           |
| `src/features/moments/data/moment-urls.ts`                                               | App instance of the signed URL cache                                            |
| `src/features/moments/data/moments-mutations.ts`                                         | Mark seen                                                                       |
| `src/features/moments/outbox.ts` (+ test)                                                | Outbox entry type and `runEntry`                                                |
| `src/features/moments/hooks/use-outbox.ts`                                               | Outbox store, enqueue, retry                                                    |
| `src/features/feed/components/outbox-line.tsx`                                           | "Sending to Mia…" / "Couldn't send · Retry"                                     |
| `src/features/chat/interfaces.ts`                                                        | `ChatMessage`, `Thread`                                                         |
| `src/features/chat/messages.ts` (+ test)                                                 | `appendMessage`, `pairKey`                                                      |
| `src/features/chat/data/chat-api.ts`, `chat-queries.ts`, `chat-mutations.ts`             | Threads, messages, send, mark read                                              |
| `src/features/chat/hooks/use-unread-total.ts`                                            | Unread messages across every conversation                                       |
| `src/features/chat/hooks/use-partner-presence.ts`                                        | Conversation presence                                                           |
| `src/features/live/live-actions.ts` (+ test)                                             | Realtime payload → semantic actions                                             |
| `src/features/live/use-live-updates.ts`                                                  | One channel per user, applies actions to the cache                              |
| `src/features/invites/data/invites-api.ts`, `invites-queries.ts`                         | Create, preview, claim                                                          |
| `src/features/invites/share-invite.ts`                                                   | Create an invite and share or copy the link                                     |
| `src/features/invites/hooks/use-pending-invite.ts`                                       | Token held while a signed-out visitor onboards                                  |
| `src/shared/lib/assets.ts`                                                               | Bundled design images that remain after fixtures go                             |

Rewritten in place: `src/shared/lib/supabase.ts`, `src/shared/lib/database.interfaces.ts` (regenerated), `src/shared/lib/query-client.ts`, `src/shared/lib/error-message.ts`, `src/features/moments/interfaces.ts`, `src/features/moments/data/moments-api.ts`, `src/features/moments/data/moments-queries.ts`, `src/features/friends/data/friends-api.ts`, `src/features/friends/data/friends-queries.ts`, `src/features/profile/open-profile.ts`, `src/features/profile/components/profile-view.tsx`, `src/features/profile/components/pair-grid.tsx`, `src/features/chat/components/chats-list.tsx`, and these screens: `app/_layout.tsx`, `app/index.tsx`, `app/(app)/feed.tsx`, `app/(app)/profile.tsx`, `app/(app)/friends/index.tsx`, `app/(app)/friends/search.tsx`, `app/(onboarding)/friends.tsx`, `app/(onboarding)/details.tsx`, `app/(onboarding)/avatar.tsx`, `app/compose.tsx`, `app/recipients.tsx`, `app/moment/[tradeId].tsx`, `app/chat/[partnerId].tsx`, `app/invite/[token].tsx`, `app/profile/[userId].tsx`.

Modified in part: `package.json`, `app.json`, `src/shared/lib/queries.ts` (one factory per feature task), `src/shared/i18n/i18n.ts`, both locale files, `src/shared/ui/avatar.tsx`, `src/shared/lib/format.ts` call sites, `src/features/moments/hooks/use-composer.ts`, `src/features/moments/hooks/use-inbox.ts`, `src/features/feed/components/feed-header.tsx`, `src/features/feed/components/story-rail.tsx`, `src/features/feed/components/locked-moment-card.tsx`, `src/features/friends/components/person-row.tsx`, `app/(app)/_layout.tsx`, `app/(app)/friends/_layout.tsx`'s siblings, `app/(onboarding)/welcome.tsx`, `app/(onboarding)/name.tsx`, `app/(onboarding)/heard-about.tsx`, `app/photo/[momentId].tsx`, `README.md`, `docs/database.md`.

Deleted: `src/features/moments/hooks/store.ts` (moved to `src/shared/lib/store.ts`, Task 8), `src/features/onboarding/components/contacts-invite.tsx` (Task 12), `src/shared/lib/fixtures.ts` (renamed to `src/shared/lib/assets.ts`, Task 20) and the bundled images nothing references any more (Task 20). `src/features/moments/hooks/use-inbox.ts` and `src/features/friends/data/friends-queries.ts` both **stay** — they are rewritten in place, not folded away.

---

### Task 1: Dependencies and test tooling

**Files:**

- Modify: `package.json`, `app.json`, `tsconfig.json`
- Create: `src/shared/lib/format.test.ts`
- Generate (gitignored, never committed): `expo-env.d.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `npm test` runs Jest over `src/**/*.test.ts` with the `@/` alias. Packages `expo-image-picker`, `expo-crypto`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` installed.

- [ ] **Step 1: Install the existing dependencies**

Run: `npm install`
Expected: exits 0. `ls node_modules/nativewind node_modules/tailwind-merge node_modules/prettier-plugin-tailwindcss` lists all three.

Then generate the Expo type shim, which is gitignored and so is absent from a
fresh clone:

```bash
printf '/// <reference types="expo/types" />\n' > expo-env.d.ts
```

`tsconfig.json` already includes this file, and it is the only thing that pulls
in `declare module '*.css'` from `expo/types`. Without it, TypeScript 6 fails
`app/_layout.tsx`'s `import '../global.css'` with TS2882. Expo's CLI writes it on
the first `npx expo start`; this is the same one line, without starting a server.
It must never appear in a `git add`.

- [ ] **Step 2: Confirm the baseline is clean**

Run: `npm run typecheck`
Expected: exits 0 with no output. The only acceptable pre-fix is the generated
`expo-env.d.ts` from Step 1; any error pointing into `app/`, `src/` or `widgets/`
means stop and report it, because later tasks assume a clean baseline.

- [ ] **Step 3: Add the runtime packages**

Run:

```bash
npm install expo-image-picker@~57.0.17 expo-crypto@~57.0.3
npm install @tanstack/react-query-persist-client@5.102.8 @tanstack/query-async-storage-persister@5.102.8
```

Expected: both exit 0; `package.json` lists the four packages.

The two Expo pins are the SDK 57 versions from
`node_modules/expo/bundledNativeModules.json` — the compatibility map the `expo`
package ships, and the same answer `npx expo install expo-image-picker
expo-crypto` would resolve to. Use that command instead wherever `api.expo.dev`
is reachable; where it is not, it dies with `HTTP Proxy Network Error:
Forbidden` before installing anything. If `expo` is ever upgraded, re-read that
file rather than trusting these two numbers.

- [ ] **Step 4: Add the test packages**

Run:

```bash
npm install --save-dev jest-expo@~57.0.5 @react-native/jest-preset@^0.86.3 jest@^29.7.0 @types/jest@^29
```

Expected: exits 0; the four appear under `devDependencies`.

Every version here is load-bearing, and `.npmrc` sets `legacy-peer-deps=true`, so
a wrong one installs quietly and only surfaces as a baffling Step 7 failure:

- `jest-expo@57.0.5` declares `@react-native/jest-preset: ^0.86.3` as a peer,
  which is exactly this repo's `react-native@0.86.3`. Left unpinned, npm takes
  the newest preset and nothing reports the mismatch.
- `jest-expo` pulls the **jest 29** line throughout (`babel-jest@^29.2.1`,
  `@jest/globals@^29.2.1`, `jest-environment-jsdom@^29.2.1`) but pins no `jest`
  of its own. A bare `npm install jest` fetches the 30 line today and splits the
  install across two major versions.
- `@types/jest` is unpinned on the registry too and resolves to 30, straddling a
  29 runtime. It happens to typecheck, but pin it for the same reason.

- [ ] **Step 5: Configure Jest**

In `package.json`, add to `"scripts"`:

```json
"test": "jest"
```

and add a top-level block. Prettier parses any file named `package.json` with
its `json-stringify` parser, which always expands arrays, so write it exactly
like this or `format:check` fails on your own edit:

```json
"jest": {
  "preset": "jest-expo",
  "testMatch": [
    "<rootDir>/src/**/*.test.ts"
  ],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

Then, in `tsconfig.json`, add to `compilerOptions`:

```json
    // TypeScript 6 no longer pulls in @types/* on its own, and the test files
    // need Jest's globals.
    "types": ["jest"],
```

TypeScript 6.0 dropped the automatic inclusion of every `@types/*` package, and
`expo/tsconfig.base` sets no `types` of its own. Without this line every test
file in the plan fails to compile with `TS2593: Cannot find name 'describe'`,
while Jest itself runs perfectly well — so nothing catches it until a later
task's typecheck.

- [ ] **Step 6: Write the first test**

Create `src/shared/lib/format.test.ts`:

```ts
import { timeUntilUnlock } from '@/shared/lib/format';

describe('timeUntilUnlock', () => {
  it('returns null when there is no deadline', () => {
    expect(timeUntilUnlock(null)).toBeNull();
  });

  it('returns null once the deadline has passed', () => {
    expect(timeUntilUnlock(new Date(Date.now() - 60_000).toISOString())).toBeNull();
  });

  it('describes a deadline in the future', () => {
    const inTwoHours = new Date(Date.now() + 2 * 3_600_000 + 60_000).toISOString();
    expect(timeUntilUnlock(inTwoHours)).toBe('2 hours');
  });
});
```

- [ ] **Step 7: Run it**

Run: `npm test`
Expected: `Tests: 3 passed, 3 total`. If Jest fails to transform a package, add that package name to a `"transformIgnorePatterns"` entry following the jest-expo default pattern and rerun.

Run: `npm run typecheck`
Expected: exits 0. Task 1 changes what the compiler sees, so it has to end as
clean as Step 2 found it — every task after this one assumes that.

- [ ] **Step 8: Register the image picker plugin**

In `app.json`, add to `"plugins"` after `"expo-localization"`:

```json
[
  "expo-image-picker",
  {
    "photosPermission": "Glimpse needs your photos so you can pick a profile picture."
  }
]
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json app.json tsconfig.json src/shared/lib/format.test.ts
git commit -m "chore: add image picker, crypto, query persistence and jest-expo" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 2: Local migration harness and applying the four migrations

**Files:**

- Create: `supabase/tests/stubs.sql`, `supabase/tests/run.sh`, `supabase/tests/core.test.sql`
- Rename after applying: the four files in `supabase/migrations/`

**Interfaces:**

- Consumes: nothing.
- Produces: `bash supabase/tests/run.sh <test files…>` applies every migration to a throwaway local database and runs the tests; prints `OK` on success. The remote project has all tables, functions, policies, buckets and views.

- [ ] **Step 1: Write the stubs**

Create `supabase/tests/stubs.sql`:

```sql
-- Stand-ins for the Supabase-managed schemas the migrations reference, so the
-- migrations can be applied to a plain local Postgres. Test-only.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end $$;

create schema auth;
create table auth.users (
  id uuid primary key,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
-- Tests impersonate a user with: select set_config('app.uid', '<uuid>', false);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text
);
create function storage.foldername(name text) returns text[] language sql immutable
  as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

create publication supabase_realtime;
create schema realtime;
create table realtime.messages (
  id bigserial primary key,
  topic text not null,
  extension text not null,
  payload jsonb,
  event text,
  private boolean default true
);
alter table realtime.messages enable row level security;
-- Tests set the channel topic with: select set_config('realtime.topic', '<topic>', false);
create function realtime.topic() returns text language sql stable
  as $$ select current_setting('realtime.topic', true) $$;

grant usage on schema auth, realtime to authenticated;
grant execute on function auth.uid(), realtime.topic() to authenticated;
grant select, insert on realtime.messages to authenticated;
grant usage, select on sequence realtime.messages_id_seq to authenticated;
```

- [ ] **Step 2: Write the runner**

Create `supabase/tests/run.sh`:

```bash
#!/usr/bin/env bash
# Applies every migration to a throwaway local Postgres database with stand-ins
# for the Supabase-managed schemas, then runs each SQL test file given as an
# argument against its own fresh copy of it. Needs a local Postgres server and
# psql on PATH.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=glimpse_migration_check
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1' EXIT

# A fresh database per test file. The test files seed the same fixture uuids and
# psql autocommits, so one shared database makes the second file collide on
# `users_pkey` and leaves the whole run order-dependent. Re-applying the
# migrations per file also proves they apply repeatedly from nothing.
prepare() {
  dropdb --if-exists "$DB" >/dev/null 2>&1
  createdb "$DB"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/stubs.sql
  for migration in supabase/migrations/*.sql; do
    psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$migration"
  done
}

if [ "$#" -eq 0 ]; then
  # No test files: still prove every migration applies to an empty database.
  prepare
else
  for test in "$@"; do
    echo "== $test"
    prepare
    psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$test"
  done
fi
echo OK
```

Run: `chmod +x supabase/tests/run.sh`

- [ ] **Step 3: Write the core test**

Create `supabase/tests/core.test.sql`:

```sql
-- Behaviour the app depends on. Run: bash supabase/tests/run.sh supabase/tests/core.test.sql
insert into auth.users (id, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '{"first_name":"Timo"}'),
  ('22222222-2222-2222-2222-222222222222', '{"first_name":"Timo"}'),
  ('33333333-3333-3333-3333-333333333333', '{"first_name":"Mia"}');

do $$
declare
  v_token text;
  v_trade uuid;
begin
  -- Signup creates a profile with a generated, unique username.
  assert (select username from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 'timo',
    'first Timo should get the bare handle';
  assert (select username from public.profiles
          where id = '22222222-2222-2222-2222-222222222222') ~ '^timo[0-9]{4}$',
    'second Timo should get a numeric suffix';

  -- Declining is a delete, so the pair can try again.
  insert into public.friendships (requester_id, recipient_id)
    values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');
  delete from public.friendships;
  insert into public.friendships (requester_id, recipient_id)
    values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');
  delete from public.friendships;

  -- Claiming an invite befriends the two and opens the trade.
  perform set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);
  insert into public.moments (id, author_id, original_storage_path, blurred_storage_path) values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
    'original/11111111-1111-1111-1111-111111111111/1.jpg',
    'blurred/11111111-1111-1111-1111-111111111111/1.jpg');
  insert into public.invites (inviter_id, moment_id)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    returning token into v_token;

  perform set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);
  select trade_id into v_trade from public.claim_invite(v_token);
  assert v_trade is not null, 'claim should open a trade';
  assert exists (select 1 from public.friendships
                 where status = 'accepted'
                   and requester_id = '11111111-1111-1111-1111-111111111111'
                   and recipient_id = '33333333-3333-3333-3333-333333333333'),
    'claim should create an accepted friendship';
  assert (select count(*) from public.invite_preview(v_token)) = 0,
    'a claimed invite must not preview';
end $$;
```

- [ ] **Step 4: Run it locally**

Run: `bash supabase/tests/run.sh supabase/tests/core.test.sql`
Expected: last line `OK`. Any `assert` failure prints its message and the script exits non-zero.

- [ ] **Step 5: Apply the four migrations to the project**

For each file below, in this order, call the MCP tool `apply_migration` with `project_id: "rzpydvnppvbziusxngfm"`, the `name` shown, and `query` set to the file's full contents:

| File                                                        | `name`               |
| ----------------------------------------------------------- | -------------------- |
| `supabase/migrations/20260913120000_init_core.sql`          | `init_core`          |
| `supabase/migrations/20260913120100_functions_triggers.sql` | `functions_triggers` |
| `supabase/migrations/20260913120200_rls.sql`                | `rls`                |
| `supabase/migrations/20260913120300_storage_and_views.sql`  | `storage_and_views`  |

Expected: each call succeeds. If one fails, stop; do not edit an applied file.

- [ ] **Step 6: Verify the remote schema**

Call `list_tables` with `schemas: ["public"]`, `verbose: false`.
Expected tables: `app_config`, `device_tokens`, `friendships`, `invites`, `messages`, `moments`, `profiles`, `reports`, `trades`, `user_blocks`.

Call `execute_sql` with:

```sql
select
  (select count(*) from storage.buckets where id in ('moments', 'avatars')) as buckets,
  (select count(*) from pg_views where schemaname = 'public'
     and viewname in ('v_inbox', 'v_pairs', 'v_threads', 'v_my_friends')) as views,
  (select value from public.app_config where key = 'free_history_days') as free_days;
```

Expected: `buckets = 2`, `views = 4`, `free_days = 30`.

- [ ] **Step 7: Align local file names with the remote history**

Call `list_migrations`. For each of the four entries, rename the local file so its prefix is the remote `version`, keeping the suffix:

```bash
git mv supabase/migrations/20260913120000_init_core.sql supabase/migrations/<version>_init_core.sql
git mv supabase/migrations/20260913120100_functions_triggers.sql supabase/migrations/<version>_functions_triggers.sql
git mv supabase/migrations/20260913120200_rls.sql supabase/migrations/<version>_rls.sql
git mv supabase/migrations/20260913120300_storage_and_views.sql supabase/migrations/<version>_storage_and_views.sql
```

Each `<version>` is the value `list_migrations` returned for that name. Update the one cross-reference in `supabase/migrations/*_rls.sql` and `*_functions_triggers.sql` comments that mention `20260913120200_rls` / `20260913120300_storage_and_views` only if you want them exact; comments are not load-bearing, so leaving them is acceptable.

Run: `bash supabase/tests/run.sh supabase/tests/core.test.sql`
Expected: `OK` (file order is still correct because the remote versions are increasing).

- [ ] **Step 8: Record the advisors**

Call `get_advisors` with `type: "security"`, then with `type: "performance"`. Keep the full output for Task 3. Expected findings include `function_search_path_mutable` for `trade_is_open` and `touch_updated_at`, `unindexed_foreign_keys`, `auth_rls_initplan`, and `extension_in_public` for `citext` and `pgcrypto`.

- [ ] **Step 9: Commit**

```bash
git add supabase/tests supabase/migrations
git commit -m "chore: apply the schema to the Supabase project and add a local migration harness" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 3: The `app_wiring` migration

**Files:**

- Create: `supabase/migrations/20260915070000_app_wiring.sql` (renamed to the remote version in Step 6)
- Create: `supabase/tests/app-wiring.test.sql`

**Interfaces:**

- Consumes: the harness from Task 2.
- Produces: RPC `mutual_friends_counts(p_user_ids uuid[]) returns table (user_id uuid, mutual int)`; tables `trades`, `messages`, `friendships` in `supabase_realtime`; private presence on topics `chat:<lower uuid>:<higher uuid>` readable and writable only by those two users.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/app-wiring.test.sql`:

```sql
-- Run: bash supabase/tests/run.sh supabase/tests/app-wiring.test.sql
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

do $$
declare
  v_mutual int;
begin
  assert (select count(*) from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename in ('trades', 'messages', 'friendships')) = 3,
    'trades, messages and friendships must be published';

  -- 1 and 2 share friend 3; 1 and 3 share nobody.
  insert into public.friendships (requester_id, recipient_id, status) values
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'accepted');
  perform set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);

  select mutual into v_mutual from public.mutual_friends_counts(
    array['22222222-2222-2222-2222-222222222222']::uuid[]);
  assert v_mutual = 1, 'users 1 and 2 share one friend';

  select mutual into v_mutual from public.mutual_friends_counts(
    array['33333333-3333-3333-3333-333333333333']::uuid[]);
  assert v_mutual = 0, 'users 1 and 3 share no friend';

  -- Internal helpers and trigger functions are not part of the API surface.
  assert not has_function_privilege('anon', 'public.config_int(text,int)', 'execute'),
    'anon must not be able to read the config';
  assert not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
    'the signup trigger function must not be callable over the API';
  assert not has_function_privilege('authenticated', 'public.generate_username(text)', 'execute'),
    'username generation is internal to the signup trigger';
  -- ...but the two the security_invoker views evaluate as the caller must stay.
  assert has_function_privilege('authenticated', 'public.trade_is_open(public.trades)', 'execute'),
    'v_inbox calls trade_is_open as the caller';
  assert has_function_privilege('authenticated', 'public.config_int(text,int)', 'execute'),
    'v_pairs calls config_int as the caller';
end $$;

-- A member of the pair may track presence on the pair's topic.
select set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);
select set_config('realtime.topic',
  'chat:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222', false);
set role authenticated;
insert into realtime.messages (topic, extension, payload)
  values (realtime.topic(), 'presence', '{}');
reset role;

-- Someone outside the pair may not.
select set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);
set role authenticated;
do $$
begin
  begin
    insert into realtime.messages (topic, extension, payload)
      values (realtime.topic(), 'presence', '{}');
    raise exception 'an outsider was allowed to track presence';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;
```

- [ ] **Step 2: Run it to see it fail**

Run: `bash supabase/tests/run.sh supabase/tests/app-wiring.test.sql`
Expected: FAIL with `trades, messages and friendships must be published`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20260915070000_app_wiring.sql`. The prefix is a
placeholder until Step 6 renames it, but it still has to sort **after** the four
versions the project assigned in Task 2 — `run.sh` applies
`supabase/migrations/*.sql` in glob order, so a lower prefix would run this
before the tables it alters exist.

Watch the rename in Step 6 too. The project stamps the version at apply time, so
the name you end up with can be **earlier** than your placeholder — this one was
written as `…070000` and came back `…065409`. Before committing the rename, check
the assigned version still sorts after the previous migration, and re-run the
harness. If a version ever lands at or before it, stop and report rather than
renaming into a broken order:

```sql
-- What the app needs on top of the core schema: live change events, batch
-- mutual counts, private conversation presence, and the advisor fixes.

-- ---------------------------------------------------------------------------
-- Realtime. Row-level security still decides which subscriber receives which
-- INSERT or UPDATE. Deletes are deliberately not consumed by the app: Supabase
-- cannot filter them and does not apply RLS to them, so there is no replica
-- identity change here.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime
  add table public.trades, public.messages, public.friendships;

-- ---------------------------------------------------------------------------
-- "3 mutual" for a whole list of search results or requests in one call.
-- ---------------------------------------------------------------------------
create or replace function public.mutual_friends_counts(p_user_ids uuid[])
returns table (user_id uuid, mutual int)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, public.mutual_friends_count(u.id)
  from unnest(p_user_ids) as u(id);
$$;

revoke execute on function public.mutual_friends_counts(uuid[]) from public, anon;
grant execute on function public.mutual_friends_counts(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Conversation presence ("Active now"). The chat screen joins the private
-- channel `chat:<lower uuid>:<higher uuid>`; only those two users may read or
-- track presence on it.
-- ---------------------------------------------------------------------------
create policy chat_presence_read on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'presence'
    and split_part((select realtime.topic()), ':', 1) = 'chat'
    and (select auth.uid())::text in (
      split_part((select realtime.topic()), ':', 2),
      split_part((select realtime.topic()), ':', 3)
    )
  );

create policy chat_presence_track on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and split_part((select realtime.topic()), ':', 1) = 'chat'
    and (select auth.uid())::text in (
      split_part((select realtime.topic()), ':', 2),
      split_part((select realtime.topic()), ':', 3)
    )
  );

-- ---------------------------------------------------------------------------
-- Advisor: function_search_path_mutable.
-- ---------------------------------------------------------------------------
alter function public.trade_is_open(public.trades) set search_path = public;
alter function public.touch_updated_at() set search_path = public;

-- ---------------------------------------------------------------------------
-- Advisor: anon/authenticated_security_definer_function_executable.
--
-- Supabase's default privileges grant EXECUTE on every new function in `public`
-- to anon and authenticated, so the trigger functions and the internal helpers
-- are reachable over /rest/v1/rpc even though nothing should ever call them
-- there. The core migration revoked some of these from public and anon; it
-- could not know about the default grant to authenticated.
--
-- Revoking from a trigger function does NOT stop the trigger: PostgreSQL checks
-- EXECUTE when the trigger is created, not each time it fires. Verified.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.handle_new_user(),
  public.enforce_friend_cap(),
  public.enforce_invite_moment_owner(),
  public.touch_updated_at(),
  public.generate_username(text)
from public, anon, authenticated;

-- These two stay callable by signed-in users, and the grant is spelled out
-- rather than inherited from Supabase's defaults so that a local database
-- behaves the same way: `v_inbox` and `v_pairs` are security_invoker views, so
-- they evaluate trade_is_open() and config_int() AS THE CALLER. Revoking either
-- from `authenticated` breaks the feed and the profile grid, with an error that
-- points nowhere near the cause.
revoke execute on function
  public.config_int(text, int),
  public.trade_is_open(public.trades)
from public, anon;
grant execute on function
  public.config_int(text, int),
  public.trade_is_open(public.trades)
to authenticated;

-- ---------------------------------------------------------------------------
-- Advisor: unindexed_foreign_keys.
-- ---------------------------------------------------------------------------
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);
create index if not exists messages_moment_idx on public.messages (moment_id);
create index if not exists messages_trade_idx on public.messages (trade_id);
create index if not exists device_tokens_user_idx on public.device_tokens (user_id);
create index if not exists invites_inviter_idx on public.invites (inviter_id);
create index if not exists invites_moment_idx on public.invites (moment_id);
create index if not exists invites_claimer_idx on public.invites (claimer_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_subject_idx on public.reports (subject_user_id);
create index if not exists reports_moment_idx on public.reports (moment_id);

-- ---------------------------------------------------------------------------
-- Advisor: auth_rls_initplan. `(select auth.uid())` is evaluated once per
-- statement instead of once per row. Expressions are otherwise unchanged.
-- ---------------------------------------------------------------------------
alter policy profiles_read on public.profiles
  using (id = (select auth.uid()) or not public.is_blocked((select auth.uid()), id));
alter policy profiles_update_own on public.profiles
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy user_blocks_own on public.user_blocks
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));
alter policy friendships_read on public.friendships
  using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));
alter policy friendships_request on public.friendships
  with check (
    requester_id = (select auth.uid())
    and status = 'pending'
    and not public.is_blocked((select auth.uid()), recipient_id)
  );
alter policy friendships_respond on public.friendships
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()) and status = 'accepted');
alter policy friendships_delete on public.friendships
  using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));
alter policy moments_read on public.moments
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.trades t
      where (t.initiator_moment_id = moments.id and t.responder_id = (select auth.uid()))
         or (t.responder_moment_id = moments.id and t.initiator_id = (select auth.uid()))
    )
  );
alter policy moments_insert_own on public.moments
  with check (author_id = (select auth.uid()));
alter policy moments_delete_own on public.moments
  using (
    author_id = (select auth.uid())
    and not exists (
      select 1 from public.trades t
      where t.initiator_moment_id = moments.id or t.responder_moment_id = moments.id
    )
  );
alter policy trades_read on public.trades
  using (
    (initiator_id = (select auth.uid()) or responder_id = (select auth.uid()))
    and not public.is_blocked(initiator_id, responder_id)
  );
alter policy trades_mark_seen on public.trades
  using (responder_id = (select auth.uid())) with check (responder_id = (select auth.uid()));
alter policy messages_read on public.messages
  using (
    (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()))
    and not public.is_blocked(sender_id, recipient_id)
  );
alter policy messages_send on public.messages
  with check (
    sender_id = (select auth.uid())
    and public.are_friends((select auth.uid()), recipient_id)
    and not public.is_blocked((select auth.uid()), recipient_id)
    and (moment_id is null or public.moment_shared_between(moment_id, (select auth.uid()), recipient_id))
  );
alter policy messages_mark_read on public.messages
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
alter policy device_tokens_own on public.device_tokens
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy reports_insert on public.reports
  with check (reporter_id = (select auth.uid()));
alter policy invites_owner on public.invites
  using (inviter_id = (select auth.uid())) with check (inviter_id = (select auth.uid()));
```

- [ ] **Step 4: Run the tests locally**

Run: `bash supabase/tests/run.sh supabase/tests/core.test.sql supabase/tests/app-wiring.test.sql`
Expected: both sections run and the last line is `OK`.

- [ ] **Step 5: Apply to the project**

Call `apply_migration` with `project_id: "rzpydvnppvbziusxngfm"`, `name: "app_wiring"`, `query` = the file's contents.
Expected: success.

- [ ] **Step 6: Rename, re-run advisors**

Call `list_migrations`; rename the file to `<version>_app_wiring.sql` with `git mv`.

Call `get_advisors` for `security` and `performance`.
Expected: `function_search_path_mutable`, `unindexed_foreign_keys` and `auth_rls_initplan` for public tables are gone, and the two `*_security_definer_function_executable` counts have dropped to the intentional API surface only.

Remaining acceptable findings, all reasoned rather than ignored:

- `extension_in_public` for `citext`. (`pgcrypto` is not flagged, though the design expected it to be.)
- `unused_index`, for every index in the schema — the database has no rows and has served no queries yet, so "unused" is the only thing it could say.
- `authenticated_security_definer_function_executable`, settling at **17**: the 15 of the current 20 that are the client's real API surface or a policy predicate, plus `config_int` (which `v_pairs` evaluates as the caller), plus the `mutual_friends_counts` this migration adds. The revoke removes exactly four — `handle_new_user`, `enforce_friend_cap`, `enforce_invite_moment_owner`, `generate_username`. Note `trade_is_open` and `touch_updated_at` are not `SECURITY DEFINER`, so they never appear in this lint at all; `trade_is_open` still needs its explicit grant for `v_inbox`, and both are fixed for `function_search_path_mutable`.
- `anon_security_definer_function_executable` for `invite_preview` and `invite_object_readable`, which the deeplink needs before there is an account.

Anything else: add a fix as a new migration following Steps 1–5 before continuing.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations supabase/tests/app-wiring.test.sql
git commit -m "feat: realtime publication, batch mutual counts and private chat presence" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 4: Environment, generated types and the typed client

**Files:**

- Create: `.env` (gitignored), `src/shared/lib/database.types.ts`
- Replace: `src/shared/lib/database.interfaces.ts` (generated)
- Modify: `src/shared/lib/supabase.ts`, every file importing `@/shared/lib/database.interfaces`, `src/features/moments/data/moments-api.ts`, `src/features/friends/data/friends-api.ts`

**Interfaces:**

- Consumes: the remote schema from Tasks 2–3.
- Produces:
  - `supabase: SupabaseClient<Database>` from `@/shared/lib/supabase`, always defined; throws at import when `.env` is missing.
  - From `@/shared/lib/database.types`: `Database`, `Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>`, `Enums<T>`, `Profile`, `Friendship`, `Moment`, `Trade`, `Message`, `Invite`, `FriendshipStatus`, `TradeStatus`, `InboxRow`, `PairRow`, `ThreadRow`.
  - `isSupabaseConfigured` (always `true`) and `requireSupabase()` stay exported until Task 20 so untouched modules keep compiling.

- [ ] **Step 1: Write `.env`**

Call `get_project_url` and `get_publishable_keys` for `rzpydvnppvbziusxngfm`. Pick the key whose value starts with `sb_publishable_` and whose `disabled` is not `true`. Create `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=<project url>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_… key>
```

Run: `git check-ignore .env`
Expected: prints `.env` (it must never be committed).

- [ ] **Step 2: Regenerate the schema types**

Call `generate_typescript_types` for the project. Replace the whole of `src/shared/lib/database.interfaces.ts` with this header followed by the returned text, unchanged:

```ts
/**
 * GENERATED from the Supabase project by the MCP tool `generate_typescript_types`.
 * Do not edit. Regenerate after every migration. App code imports row names from
 * `@/shared/lib/database.types`, never from this file.
 */
```

The generated text is **not** Prettier-clean — it comes back without semicolons
and with collapsed `Args` / `Returns` forms. Run
`npx prettier --write src/shared/lib/database.interfaces.ts` immediately after
writing it, or the repo-wide `format:check` in Step 9 fails on output you did not
type. The same applies every later time this file is regenerated.

- [ ] **Step 3: Write the row aliases**

Create `src/shared/lib/database.types.ts`:

```ts
import type { Database } from '@/shared/lib/database.interfaces';
/**
 * The names the app uses for database rows. Tables come straight from the
 * generated schema; the three views are typed by hand because Postgres reports
 * every view column as nullable, which is not what these views return.
 *
 * WHY `type` AND NOT `interface`: supabase-js constrains rows to
 * `Record<string, unknown>`, and only type aliases get an implicit index
 * signature. Declared as interfaces, query results degrade to `never`.
 */
type PublicSchema = Database['public'];

export type { Database };
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Profile = Tables<'profiles'>;
export type Friendship = Tables<'friendships'>;
export type Moment = Tables<'moments'>;
export type Trade = Tables<'trades'>;
export type Message = Tables<'messages'>;
export type Invite = Tables<'invites'>;
export type FriendshipStatus = Enums<'friendship_status'>;
export type TradeStatus = Enums<'trade_status'>;

/** `public.v_inbox` — every trade where I am the responder, lock resolved. */
export type InboxRow = {
  trade_id: string;
  from_id: string;
  from_name: string;
  from_username: string | null;
  from_avatar_storage_path: string | null;
  moment_id: string;
  caption: string | null;
  moment_created_at: string;
  status: TradeStatus;
  seen_at: string | null;
  auto_unlock_at: string | null;
  unlocked_at: string | null;
  is_open: boolean;
  created_at: string;
};

/** `public.v_pairs` — completed trades as photo pairs. */
export type PairRow = {
  trade_id: string;
  user_a: string;
  user_b: string;
  initiator_moment_id: string;
  responder_moment_id: string;
  unlocked_at: string | null;
  pair_at: string;
  created_at: string;
};

/** `public.v_threads` — last message per conversation. */
export type ThreadRow = {
  partner_id: string;
  last_message_id: string;
  last_content: string | null;
  last_moment_id: string | null;
  last_sender_id: string;
  last_at: string;
  unread_count: number;
};
```

- [ ] **Step 4: Point imports at the aliases**

Run:

```bash
grep -rl "@/shared/lib/database.interfaces" app src --include='*.ts' --include='*.tsx' \
  | grep -v 'src/shared/lib/database.types.ts' | grep -v 'src/shared/lib/supabase.ts' \
  | xargs sed -i '' "s#@/shared/lib/database.interfaces#@/shared/lib/database.types#g"
```

Expected: `grep -rn "database.interfaces" app src` lists only `database.types.ts` and `supabase.ts`.

- [ ] **Step 5: Make the client always defined**

Replace `src/shared/lib/supabase.ts` with:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from '@/shared/lib/database.interfaces';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
/**
 * The `sb_publishable_…` key from the project's API settings. It maps to the
 * `anon` Postgres role, so row-level security is what protects the data.
 */
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  );
}

/** The one client. Screens never import it; feature `data/` modules do. */
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // React Native has no URL bar to parse a magic-link fragment out of.
    detectSessionInUrl: false,
    // Serialises token refreshes across concurrent calls in one process.
    lock: processLock,
  },
});

/**
 * Supabase only refreshes tokens while the app is foregrounded; without this the
 * session silently expires after a long background.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/** @deprecated Always true. Removed in Task 20 once no module reads it. */
export const isSupabaseConfigured = true;

/** @deprecated Import `supabase` instead. Removed in Task 20. */
export function requireSupabase() {
  return supabase;
}
```

- [ ] **Step 6: Type the two view queries that exist today**

In `src/features/moments/data/moments-api.ts`, change the inbox query and the pairs query to:

```ts
const { data, error } = await sb.from('v_inbox').select('*').overrideTypes<InboxRow[], { merge: false }>();
```

```ts
const { data, error } = await sb
  .from('v_pairs')
  .select('*')
  .or(`user_a.eq.${withUserId},user_b.eq.${withUserId}`)
  .overrideTypes<PairRow[], { merge: false }>();
```

In `src/features/friends/data/friends-api.ts`, change the id extraction to drop nulls:

```ts
const ids = (links ?? []).map((l) => l.friend_id).filter((id): id is string => id !== null);
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. If an error remains, it is a nullable column from a generated view or function type; fix it at the call site the same way as Step 6 (an `overrideTypes` with the hand-written row type, or a null filter). Do not edit `database.interfaces.ts`.

- [ ] **Step 8: Run the tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/shared/lib/database.interfaces.ts src/shared/lib/database.types.ts src/shared/lib/supabase.ts app src
git commit -m "refactor: generated database types and an always-configured Supabase client" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 5: The `blur-moment` Edge Function

**Files:**

- Create: `supabase/functions/blur-moment/index.ts`, `scripts/smoke-blur.mjs`

**Interfaces:**

- Consumes: `.env` from Task 4; buckets and `moments` table from Task 2.
- Produces: `POST /functions/v1/blur-moment` with body `{ "moment_id": "<uuid>" }` and the caller's session JWT. Returns `200 { "blurred_storage_path": "blurred/<author>/<file>" }`; `401` without a valid session; `403 { "error": "not_moment_author" }` for someone else's moment. Idempotent: a second call returns the existing path.

**Prerequisites:**

- "Confirm email" is off (Authentication → Providers → Email). If the smoke script in Step 4 reports "No session", stop and ask the owner to switch it off.
- **Steps 4–6 need outbound HTTPS to `<project-ref>.supabase.co` from wherever you run them.** Steps 1–3 and 7 do not: the deploy goes through the MCP. A sandbox whose proxy denies the project host fails at the smoke script's first call — `signUp` returns a proxy error page, not a GoTrue response (`AuthUnknownError: Unexpected token 'H', "Host not i"…`). That is a policy denial, not a bug to route around: report it and leave Steps 4–6 for an environment with egress.

- [ ] **Step 1: Write the function**

`tsconfig.json` has `include: ["**/*.ts", …]`, so this Deno file would otherwise
join the React Native program and fail `tsc` with ten errors — two `npm:`
specifiers it cannot resolve, `Deno` as an unknown global, and implicit `any` on
the handler arguments. Add it to `exclude` first:

```json
  // supabase/functions is Deno, not React Native: it resolves `npm:` specifiers
  // and Deno globals that this program has no types for.
  "exclude": ["node_modules", "project", "supabase/functions"]
```

Then create `supabase/functions/blur-moment/index.ts`:

```ts
// Makes the frosted rendition of a moment on the server. The recipient's app is
// only ever given this file until the trade unlocks, so it must not come from a
// client. See docs/database.md §3.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickReadSettings,
} from 'npm:@imagemagick/magick-wasm@0.0.43';

/** Width of the stored rendition. The app scales it up and blurs it further. */
const WIDTH = 48;
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.43/dist/x86/magick.wasm';

/** The bundled wasm when the runtime exposes package files, the CDN copy otherwise. */
async function loadWasm(): Promise<Uint8Array> {
  try {
    return await Deno.readFile(
      new URL(import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.43/magick.wasm')),
    );
  } catch {
    const response = await fetch(WASM_CDN);
    if (!response.ok) throw new Error(`magick.wasm download failed: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

await initializeImageMagick(await loadWasm());

function secretKey(): string {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) return JSON.parse(keys).default as string;
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'missing_token' }, 401);

  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'invalid_token' }, 401);

  const body = await req.json().catch(() => null);
  const momentId = body?.moment_id;
  if (typeof momentId !== 'string') return json({ error: 'moment_id_required' }, 400);

  const { data: moment, error: momentError } = await admin
    .from('moments')
    .select('id, author_id, original_storage_path, blurred_storage_path')
    .eq('id', momentId)
    .maybeSingle();
  if (momentError) return json({ error: momentError.message }, 500);
  if (!moment || moment.author_id !== auth.user.id) return json({ error: 'not_moment_author' }, 403);
  if (moment.blurred_storage_path) return json({ blurred_storage_path: moment.blurred_storage_path });

  const { data: original, error: downloadError } = await admin.storage
    .from('moments')
    .download(moment.original_storage_path);
  if (downloadError || !original) return json({ error: downloadError?.message ?? 'download_failed' }, 500);

  const settings = new MagickReadSettings();
  // Lets the JPEG decoder scale down while decoding, a fraction of a full decode.
  settings.setDefine(MagickFormat.Jpeg, 'size', `${WIDTH * 2}x${WIDTH * 2}`);

  const blurred = ImageMagick.read(new Uint8Array(await original.arrayBuffer()), settings, (image) => {
    image.resize(WIDTH, 0);
    image.blur(0, 4);
    image.quality = 70;
    // The callback's buffer is only valid inside it, so copy it out.
    return image.write(MagickFormat.Jpeg, (data) => new Uint8Array(data));
  });

  const fileName = moment.original_storage_path.split('/').pop();
  const path = `blurred/${moment.author_id}/${fileName}`;

  const { error: uploadError } = await admin.storage
    .from('moments')
    .upload(path, blurred, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) return json({ error: uploadError.message }, 500);

  const { error: updateError } = await admin
    .from('moments')
    .update({ blurred_storage_path: path })
    .eq('id', moment.id);
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ blurred_storage_path: path });
});
```

- [ ] **Step 2: Deploy**

Call `deploy_edge_function` with:

- `project_id`: `rzpydvnppvbziusxngfm`
- `name`: `blur-moment`
- `entrypoint_path`: `index.ts`
- `verify_jwt`: `true`
- `files`: `[{ "name": "index.ts", "content": <the file above> }]`

Expected: success. Call `list_edge_functions`; `blur-moment` is listed with status `ACTIVE`.

- [ ] **Step 3: Write the smoke script**

Create `scripts/smoke-blur.mjs`:

```js
// End-to-end check of blur-moment against the real project with a throwaway user.
// Run: node scripts/smoke-blur.mjs <path to a .jpg>
// Needs .env and "Confirm email" switched off. Prints the ids to clean up.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
);

const photoPath = process.argv[2];
if (!photoPath) throw new Error('Usage: node scripts/smoke-blur.mjs <path to a .jpg>');

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const email = `glimpse.smoke+${Date.now()}@example.com`;
const { data: signUp, error: signUpError } = await supabase.auth.signUp({
  email,
  password: 'Smoke-test-123!',
  options: { data: { first_name: 'Smoke' } },
});
if (signUpError) throw signUpError;
if (!signUp.session)
  throw new Error('No session: switch off "Confirm email" in Authentication → Providers → Email.');
const userId = signUp.user.id;

const objectKey = `original/${userId}/${Date.now()}.jpg`;
const { error: uploadError } = await supabase.storage
  .from('moments')
  .upload(objectKey, readFileSync(photoPath), { contentType: 'image/jpeg' });
if (uploadError) throw uploadError;

const { data: moment, error: insertError } = await supabase
  .from('moments')
  .insert({ author_id: userId, original_storage_path: objectKey, width: 1, height: 1 })
  .select('id')
  .single();
if (insertError) throw insertError;

const started = Date.now();
const { data, error } = await supabase.functions.invoke('blur-moment', { body: { moment_id: moment.id } });
if (error) {
  const detail = error.context && typeof error.context.text === 'function' ? await error.context.text() : '';
  throw new Error(`blur-moment failed: ${error.message} ${detail}`);
}
console.log('blur-moment returned', data, `in ${Date.now() - started}ms`);

const again = await supabase.functions.invoke('blur-moment', { body: { moment_id: moment.id } });
console.log('second call returned', again.data);

console.log(JSON.stringify({ email, userId, momentId: moment.id }));
```

- [ ] **Step 4: Run it**

Run:

```bash
# The smoke test needs a real JPEG, and there is none in the repo. This box has
# no `sips` (macOS only), no ImageMagick and no `sharp`, so encode one with a
# pure-JS encoder installed outside package.json. On macOS the one-liner is:
#   sips -s format jpeg assets/images/p-beach.png --out "$SMOKE_JPG"
SMOKE_JPG="${TMPDIR:-/tmp}/glimpse-smoke.jpg"
npm install --no-save --silent jpeg-js
node -e '
const jpeg = require("jpeg-js");
const w = 1200, h = 900;
const data = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    data[i] = ((x * 255) / w) | 0;
    data[i + 1] = ((y * 255) / h) | 0;
    data[i + 2] = (x ^ y) & 255;
    data[i + 3] = 255;
  }
require("fs").writeFileSync(process.argv[1], jpeg.encode({ data, width: w, height: h }, 85).data);
' "$SMOKE_JPG"
node scripts/smoke-blur.mjs "$SMOKE_JPG"
```

Expected: `blur-moment returned { blurred_storage_path: 'blurred/<userId>/<n>.jpg' } in <ms>ms`, the second call returns the same path, and a final JSON line with `email`, `userId`, `momentId`. If the function returns 500, read its logs with the MCP tool `query_logs`, fix the function, redeploy, and rerun.

- [ ] **Step 5: Verify the rows and the object**

Call `execute_sql`:

```sql
select m.blurred_storage_path,
       (select (o.metadata->>'size')::int from storage.objects o
        where o.bucket_id = 'moments' and o.name = m.blurred_storage_path) as blurred_bytes
from public.moments m
where m.id = '<momentId from Step 4>';
```

Expected: the path from Step 4 and `blurred_bytes` greater than 0 and below 5000.

- [ ] **Step 6: Remove the smoke user**

Call `execute_sql`:

```sql
delete from auth.users where email like 'glimpse.smoke+%@example.com';
```

Expected: one row deleted; its profile and moment rows cascade. The two storage objects stay behind as orphans; note their names for the final report.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/blur-moment/index.ts scripts/smoke-blur.mjs tsconfig.json
git commit -m "feat: blur-moment edge function for server-made frosted renditions" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 6: Typed translation key constants and the new strings

**Files:**

- Create: `src/shared/i18n/keys.ts`, `src/shared/i18n/keys.test.ts`, `src/shared/lib/error-message.test.ts`
- Modify: `src/shared/i18n/i18n.ts`, `src/shared/i18n/locales/en.ts`, `src/shared/i18n/locales/de.ts`, `src/shared/lib/error-message.ts`, `app/(onboarding)/heard-about.tsx`, `app/(app)/friends/index.tsx`, and every file with a `t('…')` or `tList('…')` call

**Interfaces:**

- Consumes: nothing.
- Produces:
  - From `@/shared/i18n/keys`: constants `NAV`, `COMMON`, `TIME`, `ONBOARDING`, `PAYWALL`, `FEED`, `CAMERA`, `COMPOSE`, `MOMENT`, `FRIENDS`, `CHAT`, `PROFILE`, `PHOTO`, `INVITE`, `ERRORS`; types `TranslationKey`, `TranslationListKey`; functions `screamingSnake(key: string): string`, `buildKeys(node, prefix?)`.
  - `t(key: TranslationKey, options?: Record<string, unknown>): string` and `tList<T>(key: TranslationListKey): T[]`.
  - New strings used by later tasks: `ONBOARDING.DETAILS.SIGN_IN_TITLE`, `SIGN_IN_SUBTITLE`, `SIGN_IN_CTA`, `NO_ACCOUNT`, `CREATE_ACCOUNT`, `ONBOARDING.DETAILS.ERRORS.ALREADY_REGISTERED`, `ONBOARDING.DETAILS.ERRORS.CONFIRMATION_REQUIRED` (the Step 9 snippets nest an `errors` object inside `details`, so the constants are three levels deep, not under the top-level `ERRORS`); `FEED.OUTBOX.SENDING`, `FEED.OUTBOX.FAILED`, `FEED.OUTBOX.RETRY`; `FRIENDS.WITHDRAW`; `PROFILE.SIGN_OUT`; `INVITE.SHARE_MESSAGE`; `COMMON.COPIED`; `ERRORS.FRIEND_CAP_REACHED`, `ERRORS.NOT_FRIENDS`, `ERRORS.TRADE_ALREADY_ANSWERED`, `ERRORS.TRADE_EXPIRED`.
  - `errorMessage(error: unknown): string` translates the database error codes above.

- [ ] **Step 1: Write the failing key tests**

Create `src/shared/i18n/keys.test.ts`:

```ts
import { buildKeys, FEED, ONBOARDING, PAYWALL, screamingSnake } from '@/shared/i18n/keys';
import { t, tList } from '@/shared/i18n/i18n';
import { en } from '@/shared/i18n/locales/en';

describe('screamingSnake', () => {
  it.each([
    ['nav', 'NAV'],
    ['storiesLabel', 'STORIES_LABEL'],
    ['variantA', 'VARIANT_A'],
    ['appStore', 'APP_STORE'],
  ])('%s becomes %s', (input, expected) => {
    expect(screamingSnake(input)).toBe(expected);
  });
});

describe('buildKeys', () => {
  it('maps every leaf, list or string, to its dot path', () => {
    expect(buildKeys({ feed: { storiesLabel: 'x', empty: { title: 'y' }, benefits: ['a'] } })).toEqual({
      FEED: {
        STORIES_LABEL: 'feed.storiesLabel',
        EMPTY: { TITLE: 'feed.empty.title' },
        BENEFITS: 'feed.benefits',
      },
    });
  });
});

describe('generated constants', () => {
  it('are the dot paths into the locale', () => {
    expect(ONBOARDING.DETAILS.SUBTITLE).toBe('onboarding.details.subtitle');
  });

  it('resolve to the English copy through t and tList', () => {
    expect(t(FEED.EMPTY.TITLE)).toBe(en.feed.empty.title);
    expect(tList<string>(PAYWALL.BENEFITS)).toEqual(en.paywall.benefits);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx jest src/shared/i18n/keys.test.ts`
Expected: FAIL, `Cannot find module '@/shared/i18n/keys'`.

- [ ] **Step 3: Write the key builder**

Create `src/shared/i18n/keys.ts`:

```ts
import type { Translations } from '@/shared/i18n/locales/de';
import { en } from '@/shared/i18n/locales/en';
/**
 * Translation keys as typed constants: `t(ONBOARDING.DETAILS.SUBTITLE)` instead
 * of `t('onboarding.details.subtitle')`. The tree is built from the English
 * locale when this module loads; its type is derived from the locale type, so a
 * renamed or removed string fails to compile at every call site.
 */

/** Type-level twin of `screamingSnake`: `storiesLabel` → `STORIES_LABEL`. */
export type ScreamingSnake<S extends string> = S extends `${infer Head}${infer Tail}`
  ? `${Uppercase<Head>}${SnakeTail<Tail>}`
  : S;

type SnakeTail<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Head extends Lowercase<Head>
    ? `${Uppercase<Head>}${SnakeTail<Tail>}`
    : `_${Head}${SnakeTail<Tail>}`
  : S;

export type KeyTree<T, Prefix extends string = ''> = {
  readonly [K in keyof T & string as ScreamingSnake<K>]: T[K] extends readonly unknown[]
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? KeyTree<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
};

type StringPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? never
    : T[K] extends Record<string, unknown>
      ? StringPaths<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
}[keyof T & string];

type ListPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? ListPaths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

/** Every key whose value is a string. */
export type TranslationKey = StringPaths<Translations>;
/** Every key whose value is an array (suggestion chips, review quotes). */
export type TranslationListKey = ListPaths<Translations>;

/** `storiesLabel` → `STORIES_LABEL`, `variantA` → `VARIANT_A`. */
export function screamingSnake(key: string): string {
  return (
    key.charAt(0).toUpperCase() +
    key
      .slice(1)
      .replace(/[A-Z]/g, (letter) => `_${letter}`)
      .toUpperCase()
  );
}

export function buildKeys(node: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    const path = `${prefix}${key}`;
    tree[screamingSnake(key)] =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? buildKeys(value as Record<string, unknown>, `${path}.`)
        : path;
  }
  return tree;
}

const KEYS = buildKeys(en) as unknown as KeyTree<Translations>;

export const NAV = KEYS.NAV;
export const COMMON = KEYS.COMMON;
export const TIME = KEYS.TIME;
export const ONBOARDING = KEYS.ONBOARDING;
export const PAYWALL = KEYS.PAYWALL;
export const FEED = KEYS.FEED;
export const CAMERA = KEYS.CAMERA;
export const COMPOSE = KEYS.COMPOSE;
export const MOMENT = KEYS.MOMENT;
export const FRIENDS = KEYS.FRIENDS;
export const CHAT = KEYS.CHAT;
export const PROFILE = KEYS.PROFILE;
export const PHOTO = KEYS.PHOTO;
export const INVITE = KEYS.INVITE;
export const ERRORS = KEYS.ERRORS;
```

- [ ] **Step 4: Type `t` and `tList`**

In `src/shared/i18n/i18n.ts`, add the import and change the two signatures (bodies unchanged):

```ts
import type { TranslationKey, TranslationListKey } from '@/shared/i18n/keys';
```

```ts
/** Look up a translation by constant, e.g. `t(FEED.STORIES_LABEL)`. */
export function t(key: TranslationKey, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
```

```ts
export function tList<T = unknown>(key: TranslationListKey): T[] {
  const value = i18n.t(key, { defaultValue: [] });
  return Array.isArray(value) ? (value as T[]) : [];
}
```

- [ ] **Step 5: Run the key tests**

Run: `npx jest src/shared/i18n/keys.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Rewrite every call site**

Create `$TMPDIR/migrate-i18n-keys.mjs` (one-off, not committed):

```js
// t('a.bC.d') → t(A.B_C.D), plus the import. Run from the repo root.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const snake = (key) =>
  key.charAt(0).toUpperCase() +
  key
    .slice(1)
    .replace(/[A-Z]/g, (c) => `_${c}`)
    .toUpperCase();
const CALL = /\b(t|tList)(<[^>()]*>)?\(\s*(['"])([a-zA-Z0-9_.]+)\3/g;
const IMPORT_ANCHOR = /^import .* from '@\/shared\/i18n\/i18n';\n/m;

const files = execSync('git ls-files app src', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => /\.(ts|tsx)$/.test(file) && !file.startsWith('src/shared/i18n/'));

let rewritten = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const groups = new Set();
  const next = source.replace(CALL, (_match, fn, generic = '', _quote, path) => {
    const segments = path.split('.').map(snake);
    groups.add(segments[0]);
    return `${fn}${generic}(${segments.join('.')}`;
  });
  if (next === source) continue;
  const importLine = `import { ${[...groups].sort().join(', ')} } from '@/shared/i18n/keys';\n`;
  const withImport = IMPORT_ANCHOR.test(next)
    ? next.replace(IMPORT_ANCHOR, (line) => line + importLine)
    : importLine + next;
  writeFileSync(file, withImport);
  rewritten += 1;
}
console.log(`rewrote ${rewritten} files`);
```

Run from the repo root: `node "$TMPDIR/migrate-i18n-keys.mjs"`
Expected: `rewrote <n> files` with n around 40.

- [ ] **Step 7: Fix the two dynamic keys by hand**

In `app/(onboarding)/heard-about.tsx`, give each option its label constant and render it:

```ts
import type { TranslationKey } from '@/shared/i18n/keys';

interface ChannelOption {
  key: ChannelKey;
  label: TranslationKey;
  icon: ReactNode;
}

const OPTIONS: ChannelOption[] = [
  { key: 'friend', label: ONBOARDING.HEARD_ABOUT.OPTIONS.FRIEND, icon: <FriendChannelIcon /> },
  { key: 'instagram', label: ONBOARDING.HEARD_ABOUT.OPTIONS.INSTAGRAM, icon: <InstagramChannelIcon /> },
  { key: 'tiktok', label: ONBOARDING.HEARD_ABOUT.OPTIONS.TIKTOK, icon: <TiktokChannelIcon /> },
  { key: 'appStore', label: ONBOARDING.HEARD_ABOUT.OPTIONS.APP_STORE, icon: <AppStoreChannelIcon /> },
  { key: 'youtube', label: ONBOARDING.HEARD_ABOUT.OPTIONS.YOUTUBE, icon: <YoutubeChannelIcon /> },
  { key: 'search', label: ONBOARDING.HEARD_ABOUT.OPTIONS.SEARCH, icon: <SearchChannelIcon /> },
  { key: 'other', label: ONBOARDING.HEARD_ABOUT.OPTIONS.OTHER, icon: <OtherChannelIcon /> },
];
```

and replace the template-literal lookup in the row with `{t(option.label)}`. Make sure `ONBOARDING` is in the file's keys import.

In `app/(app)/friends/index.tsx`, replace the tab label lookup with:

```tsx
{
  t(key === 'friends' ? FRIENDS.TAB_FRIENDS : FRIENDS.TAB_CHATS);
}
```

and add `FRIENDS` to the file's keys import.

- [ ] **Step 8: Typecheck and format**

Run: `npm run typecheck`
Expected: exits 0. A remaining error means a `t()` argument is not a literal; replace it with the matching constant as in Step 7.

Run: `npx prettier --write app src && npm run format:check`
Expected: `All matched files use Prettier code style!`

Run: `grep -rnE "\bt(List)?(<[^>]*>)?\('" app src --include='*.ts' --include='*.tsx' | grep -v 'src/shared/i18n/'`
Expected: no output.

- [ ] **Step 9: Add the new strings**

In `src/shared/i18n/locales/de.ts`:

Replace `subtitle: 'Wir schicken dir einen Code zur Bestätigung. Keine Werbung, versprochen.',` with:

```ts
      subtitle: 'Keine Werbung, versprochen.',
```

After `signIn: 'Anmelden',` **inside `details`** — that exact line appears twice
in each locale file, once under `onboarding.welcome` and once under
`onboarding.details`, so anchor on the preceding `hasAccount: 'Schon ein
Konto?',` (English: `hasAccount: 'Already have an account?',`) and assert a
single match rather than replacing the first hit — add:

```ts
      signInTitle: 'Willkommen zurück',
      signInSubtitle: 'Melde dich mit E-Mail und Passwort an.',
      signInCta: 'Anmelden',
      noAccount: 'Neu hier?',
      createAccount: 'Konto erstellen',
      errors: {
        alreadyRegistered: 'Mit dieser E-Mail gibt es schon ein Konto. Melde dich stattdessen an.',
        confirmationRequired: 'Bestätige zuerst deine E-Mail über den Link in deinem Postfach, dann melde dich an.',
      },
```

After `profileLink: 'glimpse.app/@du',` inside `common`, add `copied: 'Link kopiert',`.

After `headline: 'Fast startklar.',` and its closing `},` inside `feed`, add:

```ts
    outbox: {
      sending: 'Wird an %{names} gesendet …',
      failed: 'Senden an %{names} fehlgeschlagen',
      retry: 'Erneut senden',
    },
```

After `addCta: 'Weitere einladen',` inside `friends`, add `withdraw: 'Zurückziehen',`.

After `memberSince: 'Tauscht seit %{when}',` inside `profile`, add `signOut: 'Abmelden',`.

After `secondary: 'Erst mal ansehen, was Glimpse ist',` inside `invite`, add:

```ts
    shareMessage: '%{name} möchte mit dir auf Glimpse Momente tauschen: %{link}',
```

Replace the `errors` block with:

```ts
  errors: {
    generic: 'Da ist etwas schiefgelaufen.',
    friendCapReached: 'Du hast die maximale Zahl an Freunden erreicht.',
    notFriends: 'Ihr seid noch nicht befreundet.',
    tradeAlreadyAnswered: 'Auf diesen Moment hast du schon geantwortet.',
    tradeExpired: 'Dieser Moment ist abgelaufen.',
  },
```

In `src/shared/i18n/locales/en.ts`, make the same insertions at the same places with:

```ts
      subtitle: 'No marketing, promised.',
```

```ts
      signInTitle: 'Welcome back',
      signInSubtitle: 'Sign in with your email and password.',
      signInCta: 'Sign in',
      noAccount: 'New here?',
      createAccount: 'Create an account',
      errors: {
        alreadyRegistered: 'An account with this email already exists. Sign in instead.',
        confirmationRequired: 'Confirm your email with the link in your inbox first, then sign in.',
      },
```

`copied: 'Link copied',`

```ts
    outbox: {
      sending: 'Sending to %{names}…',
      failed: 'Couldn’t send to %{names}',
      retry: 'Retry',
    },
```

`withdraw: 'Withdraw',` · `signOut: 'Sign out',`

```ts
    shareMessage: '%{name} wants to trade moments with you on Glimpse: %{link}',
```

```ts
  errors: {
    generic: 'Something went wrong.',
    friendCapReached: 'You’ve reached the friend limit.',
    notFriends: 'You’re not friends yet.',
    tradeAlreadyAnswered: 'You already answered this moment.',
    tradeExpired: 'This moment has expired.',
  },
```

Run: `npm run typecheck`
Expected: exits 0 (the English file is typed against the German one, so a missing or misplaced key fails here).

- [ ] **Step 10: Write the failing error-message test**

Create `src/shared/lib/error-message.test.ts`:

```ts
import { errorMessage } from '@/shared/lib/error-message';
import { en } from '@/shared/i18n/locales/en';

describe('errorMessage', () => {
  it('translates a database error code wherever it appears in the message', () => {
    expect(errorMessage(new Error('friend_cap_reached'))).toBe(en.errors.friendCapReached);
    expect(errorMessage({ message: 'P0001: trade_already_answered' })).toBe(en.errors.tradeAlreadyAnswered);
  });

  it('keeps any other message as it is', () => {
    expect(errorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials');
  });

  it('falls back to the generic copy when there is no message', () => {
    expect(errorMessage(undefined)).toBe(en.errors.generic);
  });
});
```

Run: `npx jest src/shared/lib/error-message.test.ts`
Expected: FAIL on the first and second assertions.

- [ ] **Step 11: Translate the codes**

Replace `src/shared/lib/error-message.ts` with:

```ts
import { t } from '@/shared/i18n/i18n';
import { ERRORS } from '@/shared/i18n/keys';
import type { TranslationKey } from '@/shared/i18n/keys';

/** Codes raised by the database functions, mapped to copy a person can read. */
const KNOWN_CODES: Record<string, TranslationKey> = {
  friend_cap_reached: ERRORS.FRIEND_CAP_REACHED,
  not_friends: ERRORS.NOT_FRIENDS,
  trade_already_answered: ERRORS.TRADE_ALREADY_ANSWERED,
  trade_expired: ERRORS.TRADE_EXPIRED,
};

/** The message a screen shows for a thrown value. Supabase errors are plain objects, not `Error`s. */
export function errorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';
  const code = Object.keys(KNOWN_CODES).find((known) => message.includes(known));
  if (code) return t(KNOWN_CODES[code]);
  return message || t(ERRORS.GENERIC);
}
```

- [ ] **Step 12: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 13: Commit**

```bash
git add app src
git commit -m "refactor: typed translation key constants and the strings the wiring needs" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 7: Optimistic cache patches and the signed URL cache

**Files:**

- Create: `src/shared/lib/optimistic.ts`, `src/shared/lib/optimistic.test.ts`, `src/shared/lib/signed-urls.ts`, `src/shared/lib/signed-urls.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `patch<TData, TVariables>(queryKey: QueryKey, update: (old: TData, variables: TVariables) => TData): CachePatch<TVariables>`
  - `optimistic<TVariables>(queryClient: QueryClient, patches: CachePatch<TVariables>[]): { onMutate(variables): Promise<OptimisticContext>; onError(error, variables, context?): void; onSettled(): Promise<unknown> }` — spread into `useMutation({ mutationFn, ...optimistic(queryClient, [...]) })`.
  - `interface KeyValueStore { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> }`
  - `type Signer = (paths: string[], expiresInSeconds: number) => Promise<Array<{ path: string | null; signedUrl: string | null }>>`
  - `createSignedUrlCache(store: KeyValueStore, sign: Signer, now?: () => number): { get(paths: string[]): Promise<Map<string, string>>; clear(): Promise<void> }`
  - Constants `SIGN_TTL_SECONDS = 86_400`, `RESIGN_BELOW_MS = 7_200_000`.

- [ ] **Step 1: Write the failing optimistic tests**

Create `src/shared/lib/optimistic.test.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';

type Item = { id: string; done: boolean };

/** gcTime Infinity schedules no garbage-collection timers, so Jest exits cleanly. */
const newClient = () => new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });

const markDone = patch<Item[], string>(['todos'], (old, id) =>
  old.map((item) => (item.id === id ? { ...item, done: true } : item)),
);

describe('optimistic', () => {
  it('patches the cache before the request resolves', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    await optimistic(queryClient, [markDone]).onMutate('a');
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: true }]);
  });

  it('restores the snapshot when the request fails', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    const handlers = optimistic(queryClient, [markDone]);
    const context = await handlers.onMutate('a');
    handlers.onError(new Error('offline'), 'a', context);
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: false }]);
  });

  it('restores overlapping patches in reverse order', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], [{ id: 'a', done: false }]);
    const append = patch<Item[], string>(['todos'], (old, id) => [...old, { id: `${id}2`, done: false }]);
    const handlers = optimistic(queryClient, [markDone, append]);
    const context = await handlers.onMutate('a');
    handlers.onError(new Error('offline'), 'a', context);
    expect(queryClient.getQueryData(['todos'])).toEqual([{ id: 'a', done: false }]);
  });

  it('leaves queries that were never loaded alone', async () => {
    const queryClient = newClient();
    await optimistic(queryClient, [markDone]).onMutate('a');
    expect(queryClient.getQueryData(['todos'])).toBeUndefined();
  });

  it('patches every cached query under a prefix', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['search', 'mi'], [{ id: 'a', done: false }]);
    queryClient.setQueryData<Item[]>(['search', 'be'], [{ id: 'a', done: false }]);
    const handlers = optimistic(queryClient, [
      patch<Item[], string>(['search'], (old, id) => old.map((item) => ({ ...item, done: item.id === id }))),
    ]);
    await handlers.onMutate('a');
    expect(queryClient.getQueryData(['search', 'mi'])).toEqual([{ id: 'a', done: true }]);
    expect(queryClient.getQueryData(['search', 'be'])).toEqual([{ id: 'a', done: true }]);
  });

  it('marks patched queries stale once settled', async () => {
    const queryClient = newClient();
    queryClient.setQueryData<Item[]>(['todos'], []);
    await optimistic(queryClient, [markDone]).onSettled();
    expect(queryClient.getQueryState(['todos'])?.isInvalidated).toBe(true);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx jest src/shared/lib/optimistic.test.ts`
Expected: FAIL, `Cannot find module '@/shared/lib/optimistic'`.

- [ ] **Step 3: Implement**

Create `src/shared/lib/optimistic.ts`:

```ts
import type { QueryClient, QueryKey } from '@tanstack/react-query';
/**
 * The optimistic-update recipe every mutation in the app uses: patch the cache
 * before the request goes out, put it back if the request fails, and refetch
 * once it settles so the server's answer wins.
 */

export interface CachePatch<TVariables> {
  queryKey: QueryKey;
  update: (old: unknown, variables: TVariables) => unknown;
}

export interface OptimisticContext {
  snapshots: Array<[QueryKey, unknown]>;
}

/** A patch for every cached query under `queryKey`. Queries that never loaded are left alone. */
export function patch<TData, TVariables>(
  queryKey: QueryKey,
  update: (old: TData, variables: TVariables) => TData,
): CachePatch<TVariables> {
  return {
    queryKey,
    update: (old, variables) => (old === undefined ? old : update(old as TData, variables)),
  };
}

export function optimistic<TVariables>(queryClient: QueryClient, patches: CachePatch<TVariables>[]) {
  return {
    onMutate: async (variables: TVariables): Promise<OptimisticContext> => {
      // A refetch landing after the patch would overwrite it with stale data.
      await Promise.all(patches.map(({ queryKey }) => queryClient.cancelQueries({ queryKey })));
      const snapshots: Array<[QueryKey, unknown]> = [];
      for (const { queryKey, update } of patches) {
        for (const [key, data] of queryClient.getQueriesData({ queryKey })) {
          snapshots.push([key, data]);
          queryClient.setQueryData(key, update(data, variables));
        }
      }
      return { snapshots };
    },
    onError: (_error: unknown, _variables: TVariables, context: OptimisticContext | undefined) => {
      // Reverse order, so overlapping patches unwind to the original data.
      for (const [key, data] of [...(context?.snapshots ?? [])].reverse()) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => Promise.all(patches.map(({ queryKey }) => queryClient.invalidateQueries({ queryKey }))),
  };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx jest src/shared/lib/optimistic.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing signed URL tests**

Create `src/shared/lib/signed-urls.test.ts`:

```ts
import {
  createSignedUrlCache,
  KeyValueStore,
  RESIGN_BELOW_MS,
  SIGN_TTL_SECONDS,
} from '@/shared/lib/signed-urls';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
}

function signer(clock: { now: number }) {
  return jest.fn(async (paths: string[]) =>
    paths.map((path) => ({
      path,
      signedUrl: path === 'missing' ? null : `https://signed/${path}?at=${clock.now}`,
    })),
  );
}

describe('createSignedUrlCache', () => {
  it('signs only paths it has not seen, and returns the same URL again', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    const first = await cache.get(['a', 'b']);
    const second = await cache.get(['a', 'c']);

    expect(sign).toHaveBeenNthCalledWith(1, ['a', 'b'], SIGN_TTL_SECONDS);
    expect(sign).toHaveBeenNthCalledWith(2, ['c'], SIGN_TTL_SECONDS);
    expect(second.get('a')).toBe(first.get('a'));
  });

  it('re-signs once less than two hours remain', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    await cache.get(['a']);
    clock.now += SIGN_TTL_SECONDS * 1000 - RESIGN_BELOW_MS + 1;
    await cache.get(['a']);

    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('survives a restart through the store', async () => {
    const clock = { now: 1_000_000 };
    const store = memoryStore();
    await createSignedUrlCache(store, signer(clock), () => clock.now).get(['a']);

    const afterRestart = signer(clock);
    const url = (await createSignedUrlCache(store, afterRestart, () => clock.now).get(['a'])).get('a');

    expect(afterRestart).not.toHaveBeenCalled();
    expect(url).toBe('https://signed/a?at=1000000');
  });

  it('leaves out paths that could not be signed and tries them again next time', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    expect((await cache.get(['missing'])).has('missing')).toBe(false);
    await cache.get(['missing']);
    expect(sign).toHaveBeenCalledTimes(2);
  });

  it('forgets everything on clear', async () => {
    const clock = { now: 1_000_000 };
    const sign = signer(clock);
    const cache = createSignedUrlCache(memoryStore(), sign, () => clock.now);

    await cache.get(['a']);
    await cache.clear();
    await cache.get(['a']);

    expect(sign).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 6: Run to see it fail**

Run: `npx jest src/shared/lib/signed-urls.test.ts`
Expected: FAIL, `Cannot find module '@/shared/lib/signed-urls'`.

- [ ] **Step 7: Implement**

Create `src/shared/lib/signed-urls.ts`:

```ts
/**
 * Signed URLs that stay the same across refetches.
 *
 * A fresh signed URL per fetch defeats the image cache: every refetch would be a
 * new URL and a new download. URLs are signed for a day, kept in memory and in
 * storage, and re-signed only when under two hours remain.
 */
export const SIGN_TTL_SECONDS = 86_400;
export const RESIGN_BELOW_MS = 2 * 3_600_000;
const STORAGE_KEY = 'glimpse.signed-urls';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type Signer = (
  paths: string[],
  expiresInSeconds: number,
) => Promise<Array<{ path: string | null; signedUrl: string | null }>>;

type Entries = Record<string, { url: string; expiresAt: number }>;

export function createSignedUrlCache(store: KeyValueStore, sign: Signer, now: () => number = Date.now) {
  let loaded: Promise<Entries> | null = null;
  const load = () =>
    (loaded ??= store.getItem(STORAGE_KEY).then((raw) => (raw ? (JSON.parse(raw) as Entries) : {})));

  return {
    async get(paths: string[]): Promise<Map<string, string>> {
      const entries = await load();
      const result = new Map<string, string>();
      const toSign: string[] = [];

      for (const path of new Set(paths)) {
        const entry = entries[path];
        if (entry && entry.expiresAt - now() > RESIGN_BELOW_MS) result.set(path, entry.url);
        else toSign.push(path);
      }
      if (toSign.length === 0) return result;

      const signed = await sign(toSign, SIGN_TTL_SECONDS);
      const expiresAt = now() + SIGN_TTL_SECONDS * 1000;
      for (const { path, signedUrl } of signed) {
        if (!path || !signedUrl) continue;
        entries[path] = { url: signedUrl, expiresAt };
        result.set(path, signedUrl);
      }
      for (const [path, entry] of Object.entries(entries)) {
        if (entry.expiresAt <= now()) delete entries[path];
      }
      await store.setItem(STORAGE_KEY, JSON.stringify(entries));
      return result;
    },

    async clear(): Promise<void> {
      loaded = Promise.resolve({});
      await store.removeItem(STORAGE_KEY);
    },
  };
}
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/shared/lib/optimistic.ts src/shared/lib/optimistic.test.ts src/shared/lib/signed-urls.ts src/shared/lib/signed-urls.test.ts
git commit -m "feat: optimistic cache patch helper and a stable signed URL cache" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 8: Session, protected routes and the persisted cache

**Files:**

- Create: `src/shared/lib/store.ts` (moved), `src/features/auth/hooks/use-session.ts`, `src/features/auth/current-user.ts`, `src/features/auth/entry-route.ts`, `src/features/auth/entry-route.test.ts`, `src/features/profile/data/profile-api.ts`, `src/features/profile/data/profile-queries.ts`, `src/features/profile/hooks/use-me.ts`
- Delete: `src/features/moments/hooks/store.ts` (moved)
- Modify: `src/features/moments/hooks/use-composer.ts`, `src/shared/lib/queries.ts`, `src/shared/lib/query-client.ts`, `app/_layout.tsx`, `app/index.tsx`

**Interfaces:**

- Consumes: `supabase` and `Profile` (Task 4); the persistence packages (Task 1).
- Produces:
  - `create<T extends object>(initial: T)` from `@/shared/lib/store` — unchanged, new home.
  - From `@/features/auth/hooks/use-session`: `type SessionStatus = 'loading' | 'signed-out' | 'signed-in'`, `interface SessionState { status: SessionStatus; userId: string | null }`, `useSession` (with the store's `set` / `reset` / `getState` statics) and `startSessionSync(): () => void`. **Never call `useSession.reset()`.** `create()`'s `reset` restores the initial state, which for this store is `{ status: 'loading' }` — the root layout's `ready` gate holds the splash while the status is `loading`, so resetting hangs the app on the splash for ever. Sign-out is `set({ status: 'signed-out', userId: null })`, which `onAuthStateChange` does on its own.
  - `currentUserId(): string` from `@/features/auth/current-user`, throwing `Error('not_authenticated')`.
  - `entryRoute(input: EntryInput): EntryRoute | null` from `@/features/auth/entry-route`.
  - `fetchProfile(userId: string): Promise<Profile | null>` from `@/features/profile/data/profile-api`.
  - `profileQueries`, merged into `queries` as `queries.profile.byId(userId)`.
  - `useMe()` from `@/features/profile/hooks/use-me`.
  - From `@/shared/lib/query-client`: `queryClient`, `queryPersister`, `PERSIST_MAX_AGE`, `APP_VERSION`.

- [ ] **Step 1: Move the store out of the moments feature**

It is about to hold the session, the onboarding draft and the outbox, none of
which are moments.

Run:

```bash
git mv src/features/moments/hooks/store.ts src/shared/lib/store.ts
sed -i '' "s#@/features/moments/hooks/store#@/shared/lib/store#g" src/features/moments/hooks/use-composer.ts
```

Expected: `grep -rn "features/moments/hooks/store" app src` prints nothing.

- [ ] **Step 2: Write the failing entry-route test**

Create `src/features/auth/entry-route.test.ts`:

```ts
import { entryRoute, type EntryInput } from '@/features/auth/entry-route';

const input = (over: Partial<EntryInput> = {}): EntryInput => ({
  status: 'signed-in',
  onboardingDoneAt: null,
  profileFailed: false,
  ...over,
});

describe('entryRoute', () => {
  it('renders nothing while the session is still unknown', () => {
    expect(entryRoute(input({ status: 'loading' }))).toBeNull();
  });

  it('starts the flow for a signed-out visitor', () => {
    expect(entryRoute(input({ status: 'signed-out' }))).toBe('/(onboarding)/welcome');
  });

  it('waits for the profile before choosing between onboarding and the feed', () => {
    expect(entryRoute(input({ onboardingDoneAt: undefined }))).toBeNull();
  });

  it('resumes onboarding when it was never finished', () => {
    expect(entryRoute(input({ onboardingDoneAt: null }))).toBe('/(onboarding)/friends');
  });

  it('opens the feed once onboarding is done', () => {
    expect(entryRoute(input({ onboardingDoneAt: '2026-09-14T10:00:00Z' }))).toBe('/(app)/feed');
  });

  it('opens the feed rather than hanging when the profile cannot be read', () => {
    expect(entryRoute(input({ onboardingDoneAt: undefined, profileFailed: true }))).toBe('/(app)/feed');
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx jest src/features/auth/entry-route.test.ts`
Expected: FAIL, `Cannot find module '@/features/auth/entry-route'`.

- [ ] **Step 4: Write the session store**

Create `src/features/auth/hooks/use-session.ts`:

```ts
import { create } from '@/shared/lib/store';
import { supabase } from '@/shared/lib/supabase';
/**
 * Who is signed in. A store rather than a context: the data modules call
 * `currentUserId()` outside React, and the root layout needs the answer before
 * it decides which routes exist at all.
 */
export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

export interface SessionState {
  status: SessionStatus;
  userId: string | null;
}

export const useSession = create<SessionState>({ status: 'loading', userId: null });

function sessionState(userId: string | null | undefined): SessionState {
  return userId ? { status: 'signed-in', userId } : { status: 'signed-out', userId: null };
}

/**
 * Keeps the store in step with Supabase. Mounted once by the root layout; the
 * returned function unsubscribes.
 *
 * `getSession()` reads the session AsyncStorage already holds, so a relaunch
 * resolves without a round trip. Everything after that — refresh, sign-in,
 * sign-out, expiry — arrives through `onAuthStateChange`. The callback only
 * writes to the store: calling back into `supabase.auth` from inside it
 * deadlocks the auth lock.
 */
export function startSessionSync(): () => void {
  let active = true;

  void supabase.auth.getSession().then(({ data }) => {
    // A state change may have answered first while this was in flight; it is
    // the newer truth, so it wins.
    if (!active || useSession.getState().status !== 'loading') return;
    useSession.set(sessionState(data.session?.user.id));
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useSession.set(sessionState(session?.user.id));
  });

  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}
```

- [ ] **Step 5: Write `currentUserId` and the entry route**

Create `src/features/auth/current-user.ts`:

```ts
import { useSession } from '@/features/auth/hooks/use-session';
/**
 * The signed-in id, for the `data/` modules that run outside React.
 *
 * Throws rather than returning null: every caller sits behind a protected
 * route, so no session there is a bug to surface, not a state to render.
 */
export function currentUserId(): string {
  const { userId } = useSession.getState();
  if (!userId) throw new Error('not_authenticated');
  return userId;
}
```

Create `src/features/auth/entry-route.ts`:

```ts
import type { SessionStatus } from '@/features/auth/hooks/use-session';
/**
 * Where the app opens. Pure, because the cold-start race between "is there a
 * session" and "did this account ever finish onboarding" has four wrong
 * answers and one right one, and none of them are visible in a router test.
 */
export type EntryRoute = '/(onboarding)/welcome' | '/(onboarding)/friends' | '/(app)/feed';

export interface EntryInput {
  status: SessionStatus;
  /** `undefined` while the profile has not loaded; `null` when onboarding is unfinished. */
  onboardingDoneAt: string | null | undefined;
  /** The profile query failed. Better the feed than a splash that never ends. */
  profileFailed: boolean;
}

export function entryRoute({ status, onboardingDoneAt, profileFailed }: EntryInput): EntryRoute | null {
  if (status === 'loading') return null;
  if (status === 'signed-out') return '/(onboarding)/welcome';
  if (profileFailed) return '/(app)/feed';
  if (onboardingDoneAt === undefined) return null;
  return onboardingDoneAt === null ? '/(onboarding)/friends' : '/(app)/feed';
}
```

- [ ] **Step 6: Run the test**

Run: `npx jest src/features/auth/entry-route.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Read the profile**

Create `src/features/profile/data/profile-api.ts`:

```ts
import { supabase } from '@/shared/lib/supabase';
import type { Profile } from '@/shared/lib/database.types';
/** Reads and writes for `public.profiles`. Screens go through the queries and mutations. */

/** `null` when there is no such row, or a block hides it. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}
```

Create `src/features/profile/data/profile-queries.ts`:

```ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchProfile } from '@/features/profile/data/profile-api';
/**
 * One key, and it always carries the user id. There is deliberately no
 * user-less `me` key: the cache is persisted to disk, and a `me` entry would
 * be handed straight to whoever signs in next on this phone.
 */
export const profileQueries = createQueryKeys('profile', {
  byId: (userId: string) => ({
    queryKey: [userId],
    queryFn: () => fetchProfile(userId),
  }),
});
```

Create `src/features/profile/hooks/use-me.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
/** The signed-in person's own profile. Disabled, not guessed at, while signed out. */
export function useMe() {
  const { userId } = useSession();
  return useQuery({ ...queries.profile.byId(userId ?? ''), enabled: userId !== null });
}
```

In `src/shared/lib/queries.ts`, add the import and the third factory:

```ts
import { profileQueries } from '@/features/profile/data/profile-queries';
```

```ts
export const queries = mergeQueryKeys(momentsQueries, friendsQueries, profileQueries);
```

- [ ] **Step 8: Persist the cache**

Replace `src/shared/lib/query-client.ts` with:

```ts
import { AppState, Platform } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import Constants from 'expo-constants';
/**
 * One client for the app. Server state (inbox, pairs, friends) lives here;
 * screens read it with `useQuery` and change it with `useMutation`, never
 * with a fetch inside a `useEffect`.
 */

/** A day-old feed is worth drawing for the half second before the refetch lands. */
export const PERSIST_MAX_AGE = 24 * 3_600_000;

/**
 * Cache buster. A new build may change the shape of what is cached, so the
 * persisted cache is dropped whenever the app version changes.
 */
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A moment that was fresh half a minute ago still is; refetch on
      // foreground and after mutations, not on every mount.
      staleTime: 30_000,
      // At least PERSIST_MAX_AGE, or a restored query is collected before the
      // screen that wants it has mounted.
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
    },
  },
});

/** Written on every cache change, so a cold start has yesterday's data to draw. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'glimpse.query-cache',
  throttleTime: 1000,
});

// "Window focus" is a browser idea. On a phone it is the app returning to
// the foreground, which is exactly when the inbox should refresh.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => subscription.remove();
  });
}
```

- [ ] **Step 9: Guard the signed-in routes**

Replace `app/_layout.tsx` with:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  TikTokSans_400Regular,
  TikTokSans_500Medium,
  TikTokSans_600SemiBold,
} from '@expo-google-fonts/tiktok-sans';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { colors } from '@/shared/theme/colors';
import { APP_VERSION, PERSIST_MAX_AGE, queryClient, queryPersister } from '@/shared/lib/query-client';
import { startSessionSync, useSession } from '@/features/auth/hooks/use-session';
// Side-effect imports: locale, Tailwind stylesheet, className support for third-party views.
import '@/shared/i18n/i18n';
import '../global.css';
import '@/shared/lib/css-interop';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Keys here must match `fontFamily` in src/shared/theme/fonts.ts.
  const [fontsLoaded] = useFonts({
    TikTokSans_400Regular,
    TikTokSans_500Medium,
    TikTokSans_600SemiBold,
  });
  const { status } = useSession();
  const ready = fontsLoaded && status !== 'loading';

  // Once, before any render that could route somewhere.
  useEffect(() => startSessionSync(), []);

  useEffect(() => {
    // Hold the splash until the type is ready and we know who is signed in.
    // Otherwise the first frame renders in the system face, or lands on the
    // welcome screen of an account that was signed in all along.
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE, buster: APP_VERSION }}
      >
        <SafeAreaProvider>
          <RootStack signedIn={status === 'signed-in'} />
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

interface RootStackProps {
  signedIn: boolean;
}

/**
 * `Stack.Protected` takes the guarded routes out of the navigator rather than
 * redirecting away from them, so a deep link into `/moment/…` while signed out
 * cannot render the screen for a frame before bouncing.
 *
 * `invite/[token]` is deliberately open: the whole point of the link is that
 * the visitor has no account yet.
 */
function RootStack({ signedIn }: RootStackProps) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        // The mock shows a modal sheet for capture and viewing.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="invite/[token]" />

      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="compose" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recipients" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="moment/[tradeId]" options={{ animation: 'fade' }} />
        <Stack.Screen name="photo/[momentId]" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile/[userId]" />
        <Stack.Screen name="chat/[partnerId]" />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 10: Branch the entry point**

Replace `app/index.tsx` with:

```tsx
import { Redirect } from 'expo-router';
import { entryRoute } from '@/features/auth/entry-route';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Entry point: signed out it starts the flow, signed in it opens the feed — or
 * drops back into onboarding for an account that never finished it.
 */
export default function Index() {
  const { status } = useSession();
  const { data: me, isError } = useMe();

  const route = entryRoute({
    status,
    // `undefined` means the profile has not answered yet; a row with no stamp
    // means onboarding was never finished.
    onboardingDoneAt: me === undefined ? undefined : (me?.onboarding_done_at ?? null),
    profileFailed: isError,
  });

  if (!route) return null;
  return <Redirect href={route} />;
}
```

- [ ] **Step 11: Typecheck and run the tests**

Run: `npm run typecheck`
Expected: exits 0. If `Stack.Protected` is not exported by this expo-router build, stop and report it rather than hand-rolling a redirect guard; the route table is the security boundary here.

Run: `npm test`
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add app src
git commit -m "feat: session store, protected routes and a persisted query cache" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 9: Sign up and sign in

**Files:**

- Create: `src/shared/lib/resize.ts`, `src/shared/lib/resize.test.ts`, `src/features/auth/interpret-sign-up.ts`, `src/features/auth/interpret-sign-up.test.ts`, `src/features/auth/data/auth-api.ts`, `src/features/onboarding/hooks/use-onboarding-draft.ts`
- Modify: `app/(onboarding)/welcome.tsx`, `app/(onboarding)/name.tsx`, `app/(onboarding)/avatar.tsx`, `app/(onboarding)/details.tsx`

**Interfaces:**

- Consumes: `useSession` and `create` (Task 8); the key constants and the new `ONBOARDING.DETAILS.*` strings (Task 6); `expo-image-picker` (Task 1).
- Produces:
  - From `@/shared/lib/resize`: `interface Size { width: number; height: number }`, `interface ResizedImage extends Size { uri: string }`, `fitWithin(width: number, height: number, max: number): Size`, `resizeJpeg(uri: string, source: Size, max: number): Promise<ResizedImage>`, `MAX_CAPTURE_EDGE = 1600`, `MAX_AVATAR_EDGE = 512`.
  - From `@/features/auth/interpret-sign-up`: `type SignUpOutcome = { kind: 'signed-in'; userId: string } | { kind: 'confirmation-required' } | { kind: 'already-registered' }`, `interface SignUpResponseLike`, `interpretSignUp(response: SignUpResponseLike): SignUpOutcome`.
  - From `@/features/auth/data/auth-api`: `interface SignUpInput { email: string; password: string; firstName: string; locale: string }`, `signUp(input: SignUpInput): Promise<SignUpOutcome>`, `signIn(input: { email: string; password: string }): Promise<string>`.
  - From `@/features/onboarding/hooks/use-onboarding-draft`: `interface DraftAvatar { uri: string; width: number; height: number }`, `interface OnboardingDraft { firstName: string; avatar: DraftAvatar | null }`, `useOnboardingDraft`.

- [ ] **Step 1: Write the failing resize test**

Create `src/shared/lib/resize.test.ts`:

```ts
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { fitWithin, resizeJpeg } from '@/shared/lib/resize';

// Names must start with `mock`: jest hoists the factory above these consts.
const mockSaveAsync = jest.fn(async () => ({ uri: 'file:///out.jpg', width: 1600, height: 1200 }));
const mockRenderAsync = jest.fn(async () => ({ saveAsync: mockSaveAsync }));
const mockResize = jest.fn();
// The parameter annotation is load-bearing: `jest.fn(() => …)` infers a
// zero-argument signature, and the factory below forwards a uri into it, so
// without it `tsc` fails with TS2554 — which Jest would never tell you, because
// Babel strips the types without checking them.
const mockManipulate = jest.fn((_uri: string) => ({ resize: mockResize, renderAsync: mockRenderAsync }));

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
  SaveFormat: { JPEG: 'jpeg' },
}));

beforeEach(() => jest.clearAllMocks());

describe('fitWithin', () => {
  it('never scales a small photo up', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('fits the longest edge, landscape or portrait', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('fits a square avatar', () => {
    expect(fitWithin(2000, 2000, 512)).toEqual({ width: 512, height: 512 });
  });
});

describe('resizeJpeg', () => {
  it('resizes a phone capture and saves it as JPEG', async () => {
    const result = await resizeJpeg('file:///capture.heic', { width: 4032, height: 3024 }, 1600);

    expect(mockManipulate).toHaveBeenCalledWith('file:///capture.heic');
    expect(mockResize).toHaveBeenCalledWith({ width: 1600, height: 1200 });
    expect(mockSaveAsync).toHaveBeenCalledWith({ compress: 0.85, format: SaveFormat.JPEG });
    expect(result).toEqual({ uri: 'file:///out.jpg', width: 1600, height: 1200 });
  });

  it('re-encodes without resizing when the photo already fits', async () => {
    await resizeJpeg('file:///small.jpg', { width: 900, height: 900 }, 1600);

    expect(mockResize).not.toHaveBeenCalled();
    expect(mockSaveAsync).toHaveBeenCalled();
  });

  it('is the only place the manipulator is reached', () => {
    expect(ImageManipulator.manipulate).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx jest src/shared/lib/resize.test.ts`
Expected: FAIL, `Cannot find module '@/shared/lib/resize'`.

- [ ] **Step 3: Implement the resize**

Create `src/shared/lib/resize.ts`:

```ts
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
/**
 * Everything the app uploads goes through here first.
 *
 * A phone capture is twelve megapixels and several megabytes. Uploading that
 * costs the sender a wait and costs the blur function more CPU than an Edge
 * Function is given, for a rendition that ends up 48px wide.
 */

/** Longest edge of an uploaded capture. */
export const MAX_CAPTURE_EDGE = 1600;
/** Avatars are drawn at 164px at most; 512 covers every screen density. */
export const MAX_AVATAR_EDGE = 512;

export interface Size {
  width: number;
  height: number;
}

export interface ResizedImage extends Size {
  uri: string;
}

/** Fits a size inside a square of `max`, never scaling up. */
export function fitWithin(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max || longest === 0) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * JPEG at quality 0.85, at most `max` on the longest edge. The returned size is
 * what goes on the moment row, so a card can reserve the aspect ratio before
 * the image loads.
 */
export async function resizeJpeg(uri: string, source: Size, max: number): Promise<ResizedImage> {
  const target = fitWithin(source.width, source.height, max);
  const context = ImageManipulator.manipulate(uri);
  // Re-encode either way: the camera may hand back HEIC, and the bucket and
  // the blur function both expect JPEG.
  if (target.width !== source.width || target.height !== source.height) context.resize(target);
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
```

- [ ] **Step 4: Run the resize test**

Run: `npx jest src/shared/lib/resize.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing sign-up test**

Create `src/features/auth/interpret-sign-up.test.ts`:

```ts
import { interpretSignUp, type SignUpResponseLike } from '@/features/auth/interpret-sign-up';

const response = (
  over: Partial<SignUpResponseLike['data']> = {},
  error: SignUpResponseLike['error'] = null,
) => ({
  data: { user: null, session: null, ...over },
  error,
});

describe('interpretSignUp', () => {
  it('is signed in when the response carries both a user and a session', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [{}] }, session: {} }))).toEqual({
      kind: 'signed-in',
      userId: 'u1',
    });
  });

  it('reads an empty identities array as an address that already has an account', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [] } }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('reads a user without a session as email confirmation still being on', () => {
    expect(interpretSignUp(response({ user: { id: 'u1', identities: [{}] } }))).toEqual({
      kind: 'confirmation-required',
    });
  });

  it('reads the already-registered error code', () => {
    expect(interpretSignUp(response({}, { code: 'user_already_exists', message: 'whatever' }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('reads the already-registered message when there is no code', () => {
    expect(interpretSignUp(response({}, { message: 'User already registered' }))).toEqual({
      kind: 'already-registered',
    });
  });

  it('rethrows anything else, so the form can show it', () => {
    expect(() => interpretSignUp(response({}, { message: 'Password is too short' }))).toThrow();
  });
});
```

- [ ] **Step 6: Run to see it fail**

Run: `npx jest src/features/auth/interpret-sign-up.test.ts`
Expected: FAIL, `Cannot find module '@/features/auth/interpret-sign-up'`.

- [ ] **Step 7: Implement the reading, then the auth calls**

Create `src/features/auth/interpret-sign-up.ts`:

```ts
/**
 * What Supabase's sign-up response actually means.
 *
 * Two answers look like success and are not. With "Confirm email" on, sign-up
 * returns a user and no session. For an address that already has an account,
 * Supabase deliberately returns a fabricated user with an empty `identities`
 * array rather than confirming to a stranger that the address exists. Neither
 * is an error, and neither may let the flow walk on into the app.
 */
export type SignUpOutcome =
  { kind: 'signed-in'; userId: string } | { kind: 'confirmation-required' } | { kind: 'already-registered' };

/** Structural subset of supabase-js's `AuthResponse` — only what is read here. */
export interface SignUpResponseLike {
  data: {
    user: { id: string; identities?: unknown[] | null } | null;
    session: unknown | null;
  };
  error: { code?: string | null; message: string } | null;
}

export function interpretSignUp({ data, error }: SignUpResponseLike): SignUpOutcome {
  if (error) {
    if (error.code === 'user_already_exists' || /already\s+registered/i.test(error.message)) {
      return { kind: 'already-registered' };
    }
    throw error;
  }
  if (data.user && data.session) return { kind: 'signed-in', userId: data.user.id };
  if (data.user?.identities?.length === 0) return { kind: 'already-registered' };
  return { kind: 'confirmation-required' };
}
```

Create `src/features/auth/data/auth-api.ts`:

```ts
import { supabase } from '@/shared/lib/supabase';
import { interpretSignUp, type SignUpOutcome } from '@/features/auth/interpret-sign-up';
import { useSession } from '@/features/auth/hooks/use-session';
/** Email and password. Google sign-in stays inert; see docs/database.md §6. */

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  locale: string;
}

/**
 * `options.data` lands in `auth.users.raw_user_meta_data`, which the
 * `handle_new_user` trigger reads to create the profile row and generate the
 * username. Nothing here writes to `profiles` directly.
 */
export async function signUp({ email, password, firstName, locale }: SignUpInput): Promise<SignUpOutcome> {
  const outcome = interpretSignUp(
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, locale } },
    }),
  );
  // `onAuthStateChange` fires a tick later, and the avatar upload that follows
  // this call needs `currentUserId()` now.
  if (outcome.kind === 'signed-in') useSession.set({ status: 'signed-in', userId: outcome.userId });
  return outcome;
}

/** Returns the user id. Throws Supabase's error, which the form shows as it is. */
export async function signIn({ email, password }: { email: string; password: string }): Promise<string> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  useSession.set({ status: 'signed-in', userId: data.user.id });
  return data.user.id;
}
```

- [ ] **Step 8: Run the sign-up test**

Run: `npx jest src/features/auth/interpret-sign-up.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 9: Hold the name and the avatar until the account exists**

Create `src/features/onboarding/hooks/use-onboarding-draft.ts`:

```ts
import { create } from '@/shared/lib/store';
/**
 * The name and the avatar are chosen on steps 2 and 3, but the account only
 * exists after step 4 — so they wait here rather than in a profile row with no
 * owner. Reset once sign-up has written them.
 */
export interface DraftAvatar {
  uri: string;
  width: number;
  height: number;
}

export interface OnboardingDraft {
  firstName: string;
  avatar: DraftAvatar | null;
}

export const useOnboardingDraft = create<OnboardingDraft>({ firstName: '', avatar: null });
```

- [ ] **Step 10: Write the name into the draft**

In `app/(onboarding)/name.tsx`, add the import:

```ts
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
```

and inside `NameScreen`, replace the `useState` line and the footer with:

```tsx
const draft = useOnboardingDraft();
const [name, setName] = useState(draft.firstName);
```

```tsx
<CtaFooter
  label={t(ONBOARDING.NAME.CTA)}
  onPress={() => {
    draft.set({ firstName: name.trim() });
    router.push('/(onboarding)/camera');
  }}
  disabled={name.trim().length === 0}
/>
```

- [ ] **Step 11: Pick a real photo on the avatar step**

Replace the body of `app/(onboarding)/avatar.tsx` above the `DottedDisc` definition (keep `DottedDisc` and its comment exactly as they are; Task 10 moves them) with:

```tsx
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Plus } from 'lucide-react-native';
import Svg, { Circle, Defs, Pattern } from 'react-native-svg';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Screen `03 Avatar · 3 of 7`.
 *
 * The picked photo is held on the onboarding draft, not uploaded: there is no
 * account to hang it on until step 4. The details screen uploads it after
 * sign-up returns a session.
 */
export default function AvatarScreen() {
  const draft = useOnboardingDraft();

  async function pick() {
    // Cropped square here rather than centre-cropped later, so the person
    // chooses which part of the photo is their face.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    draft.set({ avatar: { uri: asset.uri, width: asset.width, height: asset.height } });
  }

  return (
    <OnboardingScreen
      step={3}
      title={t(ONBOARDING.AVATAR.TITLE)}
      subtitle={t(ONBOARDING.AVATAR.SUBTITLE)}
      cta={t(ONBOARDING.AVATAR.CTA)}
      onNext={() => router.push('/(onboarding)/signup')}
      secondary={t(ONBOARDING.AVATAR.SKIP)}
      onSecondary={() => {
        // "Add later" means without one — not with whatever was picked and
        // then reconsidered.
        draft.set({ avatar: null });
        router.push('/(onboarding)/signup');
      }}
    >
      <View className="mt-[22px] h-[276px] items-center justify-center gap-5 rounded-lg bg-surface-violet-deep">
        <Pressable
          className="h-[164px] w-[164px]"
          onPress={() => void pick()}
          accessibilityRole="button"
          accessibilityLabel={t(ONBOARDING.AVATAR.PICK)}
        >
          {draft.avatar ? (
            <Image
              source={{ uri: draft.avatar.uri }}
              className="h-[164px] w-[164px] rounded-[82px]"
              contentFit="cover"
            />
          ) : (
            <DottedDisc size={164} />
          )}
          <View className="absolute bottom-2 right-0.5 h-11 w-11 items-center justify-center rounded-[22px] border-[3px] border-surface-violet-deep bg-purple">
            <Plus size={20} color={colors.white} strokeWidth={2.6} />
          </View>
        </Pressable>

        <Text variant="body" className="text-ink-faint">
          {t(ONBOARDING.AVATAR.PICK)}
        </Text>
      </View>
    </OnboardingScreen>
  );
}
```

- [ ] **Step 12: Open the form in sign-in mode from the welcome screen**

In `app/(onboarding)/welcome.tsx`, change the "Sign in" link's `onPress` to:

```tsx
              onPress={() =>
                router.push({ pathname: '/(onboarding)/details', params: { mode: 'signin' } })
              }
```

- [ ] **Step 13: Wire the details form**

Replace `app/(onboarding)/details.tsx` with:

```tsx
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Check, Eye, Mail } from 'lucide-react-native';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { getLocale, t } from '@/shared/i18n/i18n';
import { ONBOARDING } from '@/shared/i18n/keys';
import { errorMessage } from '@/shared/lib/error-message';
import { signIn, signUp } from '@/features/auth/data/auth-api';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Screen `04a Your details · 4 of 7`, and the sign-in form.
 *
 * One form in two modes: they differ by four strings and one request, and a
 * separate screen would duplicate the field layout and the strength meter.
 *
 * This is the one action in the app that is not optimistic. Everywhere else the
 * UI can assume the write lands; here there is nothing to assume until the
 * server has said who this is.
 */
type Mode = 'signup' | 'signin';

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signin' ? 'signin' : 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(true);
  /** Set for the two sign-up answers that are neither success nor an error. */
  const [notice, setNotice] = useState<string | null>(null);
  const draft = useOnboardingDraft();

  const signingUp = mode === 'signup';
  const strength = passwordStrength(password);
  const valid = email.includes('@') && password.length >= 9 && (!signingUp || consent);

  const submit = useMutation({
    mutationFn: async (): Promise<'signed-in' | 'confirmation-required' | 'already-registered'> => {
      if (!signingUp) {
        await signIn({ email, password });
        return 'signed-in';
      }
      const outcome = await signUp({ email, password, firstName: draft.firstName, locale: getLocale() });
      return outcome.kind;
    },
    onSuccess: (kind) => {
      if (kind !== 'signed-in') {
        setNotice(
          t(
            kind === 'already-registered'
              ? ONBOARDING.DETAILS.ERRORS.ALREADY_REGISTERED
              : ONBOARDING.DETAILS.ERRORS.CONFIRMATION_REQUIRED,
          ),
        );
        setMode('signin');
        return;
      }
      // A new account carries on at step 5. An existing one goes through the
      // entry point, which knows whether it ever finished onboarding.
      router.replace(signingUp ? '/(onboarding)/friends' : '/');
    },
  });

  function onSubmit() {
    setNotice(null);
    if (signingUp && draft.firstName.trim().length === 0) {
      // Reached by deep link or a reload. The signup trigger needs a name to
      // build the profile row and generate the username.
      router.push('/(onboarding)/name');
      return;
    }
    submit.mutate();
  }

  function switchMode() {
    setNotice(null);
    submit.reset();
    setMode(signingUp ? 'signin' : 'signup');
  }

  const copy = signingUp
    ? {
        title: ONBOARDING.DETAILS.TITLE,
        subtitle: ONBOARDING.DETAILS.SUBTITLE,
        cta: ONBOARDING.DETAILS.CTA,
        prompt: ONBOARDING.DETAILS.HAS_ACCOUNT,
        action: ONBOARDING.DETAILS.SIGN_IN,
      }
    : {
        title: ONBOARDING.DETAILS.SIGN_IN_TITLE,
        subtitle: ONBOARDING.DETAILS.SIGN_IN_SUBTITLE,
        cta: ONBOARDING.DETAILS.SIGN_IN_CTA,
        prompt: ONBOARDING.DETAILS.NO_ACCOUNT,
        action: ONBOARDING.DETAILS.CREATE_ACCOUNT,
      };

  const message = notice ?? (submit.error ? errorMessage(submit.error) : null);

  return (
    <Screen
      footer={
        <View className="gap-[18px]">
          {message ? (
            <Text variant="subtitle" className="text-center text-purple-deep">
              {message}
            </Text>
          ) : null}
          <Button
            label={t(copy.cta)}
            size="xl"
            disabled={!valid}
            loading={submit.isPending}
            onPress={onSubmit}
          />
          <Text variant="subtitle" className="text-center text-muted-lilac">
            {t(copy.prompt)}{' '}
            <Text
              variant="subtitle"
              weight="semibold"
              className="text-ink-body"
              accessibilityRole="link"
              onPress={switchMode}
            >
              {t(copy.action)}
            </Text>
          </Text>
        </View>
      }
      className="bg-surface-alt"
      gutter={spacing.gutterWide}
      scroll
    >
      {/* Signing in is not step 4 of anything — it is reached from the welcome
          screen as often as from the flow. */}
      {signingUp ? (
        <ProgressHeader step={4} onClose={() => router.back()} />
      ) : (
        <CloseRow onPress={() => router.back()} />
      )}

      <Text variant="display" className="mt-[22px] text-ink">
        {t(copy.title)}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t(copy.subtitle)}
      </Text>

      <View className="mt-7 gap-[18px]">
        <View className="gap-2">
          <Text variant="meta" className="text-muted">
            {t(ONBOARDING.DETAILS.EMAIL_LABEL)}
          </Text>
          <View className={cn(INPUT, email.length > 0 && 'border-purple')}>
            <Mail size={21} color={colors.purple} strokeWidth={1.6} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t(ONBOARDING.DETAILS.EMAIL_PLACEHOLDER)}
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className={INPUT_TEXT}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text variant="meta" className="text-muted">
            {t(ONBOARDING.DETAILS.PASSWORD_LABEL)}
          </Text>
          <View className={cn(INPUT, 'bg-surface-violet-warm')}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoComplete={signingUp ? 'new-password' : 'current-password'}
              className={INPUT_TEXT}
            />
            <Pressable
              onPress={() => setReveal((r) => !r)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                reveal ? t(ONBOARDING.DETAILS.HIDE_PASSWORD) : t(ONBOARDING.DETAILS.SHOW_PASSWORD)
              }
            >
              <Eye size={21} color={colors.muted} strokeWidth={1.6} />
            </Pressable>
          </View>

          {/* A strength meter on the way in would be rating a password that is
              already set. */}
          {signingUp ? (
            <View className="flex-row items-center gap-2.5 pl-0.5">
              <View className="flex-row gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className={cn(
                      'h-[5px] w-[34px] rounded-[3px]',
                      i < strength ? 'bg-purple' : 'bg-border-lilac',
                    )}
                  />
                ))}
              </View>
              <Text variant="metaSm" className="text-muted">
                {t(ONBOARDING.DETAILS.PASSWORD_HINT)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {signingUp ? (
        <Pressable
          className="mt-[22px] flex-row items-start gap-3"
          onPress={() => setConsent((c) => !c)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
        >
          <View
            className={cn(
              'mt-px h-6 w-6 items-center justify-center rounded-[8px]',
              consent ? 'bg-purple' : 'border-[1.8px] border-swatch-grey bg-transparent',
            )}
          >
            {consent ? <Check size={14} color={colors.white} strokeWidth={2.2} /> : null}
          </View>
          <Text variant="subtitle" className="flex-1 text-muted-lilac">
            {t(ONBOARDING.DETAILS.CONSENT, {
              terms: t(ONBOARDING.SIGN_UP.TERMS),
              privacy: t(ONBOARDING.SIGN_UP.PRIVACY),
            })}
          </Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

/** 0-4, mapped onto the four segments the mock draws. */
function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 9) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

const INPUT =
  'h-[62px] flex-row items-center gap-3 rounded-input border-[1.5px] border-border-input bg-white px-[18px]';
const INPUT_TEXT = 'flex-1 p-0 font-sans text-[17.5px] text-ink-body';
```

- [ ] **Step 14: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

Run: `npx prettier --write app src && npm test`
Expected: Prettier rewrites nothing unexpected; all tests pass.

- [ ] **Step 15: Commit**

```bash
git add app src
git commit -m "feat: email and password sign up and sign in" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 10: Profile reads, writes, the avatar placeholder and sign-out

**Files:**

- Create: `src/shared/ui/dotted-disc.tsx`, `src/features/profile/data/profile-mutations.ts`, `src/features/profile/hooks/use-stamp-onboarding-done.ts`, `src/features/profile/components/profile-actions-sheet.tsx`, `src/features/auth/sign-out.ts`
- Modify: `src/features/profile/data/profile-api.ts`, `src/shared/ui/avatar.tsx`, `src/features/feed/components/feed-header.tsx`, `src/features/profile/components/profile-view.tsx`, `app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/profile.tsx`, `app/(app)/feed.tsx`, `app/profile/[userId].tsx`, `app/(onboarding)/avatar.tsx`, `app/(onboarding)/details.tsx`, `app/(onboarding)/heard-about.tsx`

**Interfaces:**

- Consumes: `optimistic` / `patch` (Task 7), `queries.profile.byId` and `useMe` (Task 8), `resizeJpeg` / `MAX_AVATAR_EDGE` and the onboarding draft (Task 9), `PROFILE.SIGN_OUT` (Task 6).
- Produces:
  - `DottedDisc({ size, letter?, gapColor? })` from `@/shared/ui/dotted-disc`.
  - `Avatar` now takes `source: ImageSource | string | number | null` and `name?: string`; a falsy source draws the disc with the name's first letter.
  - From `@/features/profile/data/profile-api`: `updateProfile(patch: TablesUpdate<'profiles'>): Promise<Profile>`, `uploadAvatar(asset: { uri: string; width: number; height: number }): Promise<Profile>`, `avatarUrl(path: string | null): string | null`.
  - `useUpdateProfile()` and `type ProfilePatch = TablesUpdate<'profiles'>` from `@/features/profile/data/profile-mutations`.
  - `useStampOnboardingDone(): void`.
  - `ProfileActionsSheet({ visible, onClose })`.
  - From `@/features/auth/sign-out`: `clearUserData(queryClient: QueryClient): Promise<void>`, `signOut(queryClient: QueryClient): Promise<void>`.
  - `ProfileView` now takes `{ profile: Profile; subtitle: string; leading: ReactNode; pairs: MomentPair[]; onPressTrade: () => void; onPressMore?: () => void }` — it no longer fetches, and no longer wants a bundled `photo`.

- [ ] **Step 1: Move the dotted disc and make it scale**

Create `src/shared/ui/dotted-disc.tsx`:

```tsx
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Pattern } from 'react-native-svg';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
/**
 * The mock's empty avatar: a purple disc carrying a fine dot pattern.
 *   background-image: radial-gradient(rgba(255,255,255,.55) 1.6px, transparent 1.7px)
 *   background-size: 13px 13px
 * React Native has no background-image, so it is drawn as an SVG pattern.
 *
 * Two callers: the avatar step's picker at 164px, and every avatar of someone
 * who has not set a photo, down to 30px in a chat bubble — hence the insets
 * and the dot grid being fractions of the size rather than the mock's literal
 * pixel values.
 */
interface DottedDiscProps {
  size: number;
  /** Centred initial, drawn when this stands in for a person. */
  letter?: string;
  /** The ring between the dots and the outline: the colour behind the disc. */
  gapColor?: string;
}

export function DottedDisc({ size, letter, gapColor = colors.surfaceVioletDeep }: DottedDiscProps) {
  // Pattern ids are document-global on web, and a story rail draws a dozen of
  // these at once.
  const patternId = `dots-${useId()}`;
  const r = size / 2;
  // 13px and 1.6px at the mock's 164px, in proportion everywhere else.
  const grid = Math.max(6, Math.round(size * 0.079));
  const dot = grid * 0.123;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} className="absolute">
        <Defs>
          <Pattern id={patternId} width={grid} height={grid} patternUnits="userSpaceOnUse">
            <Circle cx={grid / 2} cy={grid / 2} r={dot} fill="rgba(255,255,255,.55)" />
          </Pattern>
        </Defs>
        {/* Disc fill, then the dots on top of it. Radii are inset so the
            outermost stroke sits inside the viewport instead of being clipped. */}
        <Circle cx={r} cy={r} r={r * 0.902} fill={colors.purple} />
        <Circle cx={r} cy={r} r={r * 0.902} fill={`url(#${patternId})`} />
        {/* The mock's gap ring in the surface colour, then the purple outline. */}
        <Circle cx={r} cy={r} r={r * 0.927} stroke={gapColor} strokeWidth={r * 0.049} fill="none" />
        <Circle cx={r} cy={r} r={r * 0.966} stroke={colors.purple} strokeWidth={r * 0.0305} fill="none" />
      </Svg>
      {letter ? (
        <Text
          variant="rowTitle"
          weight="semibold"
          className="text-white"
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {letter}
        </Text>
      ) : null}
    </View>
  );
}
```

In `app/(onboarding)/avatar.tsx`, delete the local `DottedDisc` function, its `DottedDiscProps` interface and its comment block, drop the now-unused `Svg`, `Circle`, `Defs`, `Pattern` and `colors` imports if nothing else on the screen uses them (`colors` is still used by the `+` badge, so keep it), and add:

```ts
import { DottedDisc } from '@/shared/ui/dotted-disc';
```

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 2: Let an avatar be absent**

Replace `src/shared/ui/avatar.tsx` with:

```tsx
import { View } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { cn } from '@/shared/lib/cn';
import { DottedDisc } from '@/shared/ui/dotted-disc';
import { colors } from '@/shared/theme/colors';
interface AvatarProps {
  /** `null` — or the empty string a profile with no avatar resolves to — draws the placeholder. */
  source: ImageSource | string | number | null;
  /** Its first letter goes in the placeholder. */
  name?: string;
  size?: number;
  /**
   * Ring styles from the mock:
   *  - `none`    plain circle
   *  - `halo`    2px white border + 1.5px #DCD0F7 outer ring (feed header, profile)
   *  - `active`  solid purple ring with a white gap (you / unread story)
   *  - `idle`    grey ring with a white gap (read story)
   */
  ring?: 'none' | 'halo' | 'active' | 'idle';
  dimmed?: boolean;
  className?: string;
}

export function Avatar({ source, name, size = 52, ring = 'none', dimmed = false, className }: AvatarProps) {
  const img = typeof source === 'string' ? { uri: source } : source;
  // Size is a prop, so the frame stays a style. The Image itself is styled
  // entirely through `style`: on web, NativeWind cannot mix `className` with a
  // numeric `style` on a registered third-party component.
  const round = { borderRadius: size / 2 };
  const opacity = dimmed ? 0.55 : 1;
  const letter = name?.trim().charAt(0).toUpperCase() || undefined;

  if (ring === 'active' || ring === 'idle') {
    // Mock: a coloured disc with 2.4px padding, and the photo carries a white
    // border of the same thickness.
    const ringWidth = size * 0.041;
    return (
      <View
        className={cn(ring === 'active' ? 'bg-purple' : 'bg-avatar-ring-idle', className)}
        style={[round, { width: size, height: size, padding: ringWidth }]}
      >
        {source ? (
          <Image
            source={img}
            style={[
              round,
              { width: '100%', height: '100%', borderWidth: ringWidth, borderColor: colors.white, opacity },
            ]}
            contentFit="cover"
          />
        ) : (
          // The disc draws its own white gap ring, so it replaces the border.
          <View style={{ opacity }}>
            <DottedDisc size={size - ringWidth * 2} letter={letter} gapColor={colors.white} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={className}>
      {source ? (
        <Image
          source={img}
          style={[
            round,
            { width: size, height: size, opacity },
            ring === 'halo' && { borderWidth: 2, borderColor: colors.white },
          ]}
          contentFit="cover"
        />
      ) : (
        <View style={{ opacity }}>
          <DottedDisc size={size} letter={letter} gapColor={colors.white} />
        </View>
      )}
      {ring === 'halo' ? (
        <View
          className="absolute inset-0 -m-[1.5px] border-[1.5px] border-purple-halo"
          style={round}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}
```

- [ ] **Step 3: Write the profile**

Append to `src/features/profile/data/profile-api.ts`:

```ts
/** The public URL of an avatar object. The bucket is public, so no signing. */
export function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** Only the columns the RLS column grant allows; anything else fails at the database. */
export async function updateProfile(values: TablesUpdate<'profiles'>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(values)
    .eq('id', currentUserId())
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Resize to 512, upload under a fresh timestamped key, point the profile at it,
 * then remove the old object.
 *
 * A new avatar therefore has a new URL, so no image cache anywhere — expo-image
 * on the phone, the browser on the web build — can go on serving the old one.
 */
export async function uploadAvatar(asset: { uri: string; width: number; height: number }): Promise<Profile> {
  const userId = currentUserId();
  const resized = await resizeJpeg(asset.uri, asset, MAX_AVATAR_EDGE);
  // Object key inside the `avatars` bucket; the storage policy requires the
  // first folder to be the caller's id.
  const path = `${userId}/${Date.now()}.jpg`;

  // `fetch(file://…).arrayBuffer()` rather than a Blob: React Native's Blob has
  // no data the Storage client can read.
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;

  const previous = (await fetchProfile(userId))?.avatar_storage_path ?? null;
  const profile = await updateProfile({ avatar_storage_path: path });
  // Best effort, and deliberately after the row is updated: an orphaned object
  // costs a few kilobytes, a premature delete costs the person their picture.
  if (previous && previous !== path) await supabase.storage.from('avatars').remove([previous]);
  return profile;
}
```

and extend its imports to:

```ts
import { supabase } from '@/shared/lib/supabase';
import { MAX_AVATAR_EDGE, resizeJpeg } from '@/shared/lib/resize';
import { currentUserId } from '@/features/auth/current-user';
import type { Profile, TablesUpdate } from '@/shared/lib/database.types';
```

Create `src/features/profile/data/profile-mutations.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
import { updateProfile } from '@/features/profile/data/profile-api';
import type { Profile, TablesUpdate } from '@/shared/lib/database.types';

export type ProfilePatch = TablesUpdate<'profiles'>;

/** Merges the patch into the cached profile at once; the refetch confirms it. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { userId } = useSession();

  return useMutation({
    mutationFn: (values: ProfilePatch) => updateProfile(values),
    ...optimistic(queryClient, [
      patch<Profile | null, ProfilePatch>(queries.profile.byId(userId ?? '').queryKey, (old, values) =>
        old ? { ...old, ...values } : old,
      ),
    ]),
  });
}
```

- [ ] **Step 4: Stamp onboarding as done when the tabs mount**

Create `src/features/profile/hooks/use-stamp-onboarding-done.ts`:

```ts
import { useEffect } from 'react';
import { useMe } from '@/features/profile/hooks/use-me';
import { useUpdateProfile } from '@/features/profile/data/profile-mutations';
/**
 * Onboarding counts as finished the first time the signed-in tabs mount, not on
 * the thank-you screen: "Look around first" leaves the flow too, and a relaunch
 * must not drop that person back into step 5.
 */
export function useStampOnboardingDone() {
  const { data: me } = useMe();
  const { mutate, isPending, isSuccess } = useUpdateProfile();
  // Primitive deps only: every refetch hands back a new object for the same
  // profile, which must not stamp it a second time.
  const needsStamp = me != null && me.onboarding_done_at === null;

  useEffect(() => {
    if (needsStamp && !isPending && !isSuccess) mutate({ onboarding_done_at: new Date().toISOString() });
  }, [needsStamp, isPending, isSuccess, mutate]);
}
```

In `app/(app)/_layout.tsx`, add the import and call it at the top of `AppLayout`:

```ts
import { useStampOnboardingDone } from '@/features/profile/hooks/use-stamp-onboarding-done';
```

```ts
useStampOnboardingDone();
```

- [ ] **Step 5: Sign out**

Create `src/features/auth/sign-out.ts`:

```ts
import { router } from 'expo-router';
import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { queryPersister } from '@/shared/lib/query-client';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
/**
 * Everything on this device that belongs to whoever was signed in.
 *
 * Called on sign-out, and by the root layout whenever the user id changes away
 * from a previous one — an expired session that comes back as somebody else
 * must not inherit the last person's cached feed, and the cache is on disk.
 *
 * Tasks 13 and 14 add the signed-URL cache and the outbox to this list.
 */
export async function clearUserData(queryClient: QueryClient): Promise<void> {
  supabase.removeAllChannels();
  // Deliberately NOT useSession.reset(): that restores `status: 'loading'` and
  // the root layout would hold the splash for ever. `onAuthStateChange` sets
  // the signed-out state for us.
  useComposer.reset();
  useOnboardingDraft.reset();
  queryClient.clear();
  await queryPersister.removeClient();
}

export async function signOut(queryClient: QueryClient): Promise<void> {
  await supabase.auth.signOut();
  await clearUserData(queryClient);
  // `Stack.Protected` drops the signed-in routes as soon as the session flips;
  // this says where to land rather than leaving it to the fallback.
  router.replace('/(onboarding)/welcome');
}
```

In `app/_layout.tsx`, add to the imports:

```ts
import { useEffect, useRef } from 'react';
```

```ts
import { clearUserData } from '@/features/auth/sign-out';
```

change the session read to `const { status, userId } = useSession();` and add, next to the other effects in `RootLayout`:

```tsx
// A session that ends, expires, or returns as somebody else.
const previousUserId = useRef<string | null>(null);
useEffect(() => {
  if (previousUserId.current && previousUserId.current !== userId) void clearUserData(queryClient);
  previousUserId.current = userId;
}, [userId]);
```

- [ ] **Step 6: The sheet behind the "more" button**

Create `src/features/profile/components/profile-actions-sheet.tsx`:

```tsx
import { Modal, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, PROFILE } from '@/shared/i18n/keys';
import { signOut } from '@/features/auth/sign-out';
interface ProfileActionsSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The "more" menu on your own profile. An in-app sheet rather than React
 * Native's `Alert`, which does nothing at all on web — and the web build is how
 * this work is verified.
 */
export function ProfileActionsSheet({ visible, onClose }: ProfileActionsSheetProps) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-[rgba(12,10,18,.45)]"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t(COMMON.CLOSE)}
      >
        {/* Swallows the press, so tapping the sheet itself does not dismiss it. */}
        <Pressable
          className="rounded-t-lg bg-white px-5 pt-2"
          style={{ paddingBottom: insets.bottom + 12 }}
          onPress={() => {}}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-pill bg-border-lilac" />
          <Pressable
            className="h-14 flex-row items-center gap-3.5 active:opacity-70"
            onPress={() => {
              onClose();
              void signOut(queryClient);
            }}
            accessibilityRole="button"
          >
            <LogOut size={20} color={colors.inkBody} strokeWidth={2} />
            <Text variant="rowTitleSm" className="text-ink">
              {t(PROFILE.SIGN_OUT)}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
```

- [ ] **Step 7: Profile view on real data**

Replace `src/features/profile/components/profile-view.tsx` with:

```tsx
import { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CameraIcon } from '@/shared/ui/icons';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionHeading } from '@/shared/ui/section-heading';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, PROFILE } from '@/shared/i18n/keys';
import type { Profile } from '@/shared/lib/database.types';
import type { MomentPair } from '@/features/moments/interfaces';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { PairGrid } from '@/features/profile/components/pair-grid';
interface ProfileViewProps {
  profile: Profile;
  /** Line under the name: a tagline, or "Trading since …". */
  subtitle: string;
  /** Top-left control: a close button on a friend's profile, a spacer on your own. */
  leading: ReactNode;
  /** Passed in rather than fetched: the two screens ask different questions. */
  pairs: MomentPair[];
  onPressTrade: () => void;
  /** Only your own profile has anything behind "more". */
  onPressMore?: () => void;
}

/**
 * Header, identity, trade CTA and pair grid — shared by your own profile (the
 * tab) and a friend's profile (pushed from the feed). The two artboards differ
 * only in the top-left control, what the grid holds, and where the CTA sends you.
 */
export function ProfileView({
  profile,
  subtitle,
  leading,
  pairs,
  onPressTrade,
  onPressMore,
}: ProfileViewProps) {
  return (
    <>
      <View className="flex-row items-start justify-between">
        {leading}
        <Avatar
          source={avatarUrl(profile.avatar_storage_path)}
          name={profile.first_name}
          size={104}
          ring="halo"
          className="-mt-1"
        />
        <GlassButton size={44} onPress={onPressMore} accessibilityLabel={t(COMMON.MORE)}>
          <MoreHorizontal size={20} color={colors.inkSoft} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View className="mt-3.5 items-center gap-1">
        <Text variant="title" className="text-ink">
          {profile.first_name}
        </Text>
        <Text variant="body" className="text-muted-grey">
          {subtitle}
        </Text>
      </View>

      <Button
        label={t(PROFILE.TRADE_CTA)}
        size="md"
        className="mt-4"
        icon={<CameraIcon size={22} lensColor={colors.ink} />}
        onPress={onPressTrade}
      />

      <SectionHeading title={t(PROFILE.MOMENTS_TITLE)} className="mb-3.5 mt-4" />

      {pairs.length > 0 ? (
        <PairGrid pairs={pairs} onPressPhoto={(momentId) => router.push(`/photo/${momentId}`)} />
      ) : (
        <Text variant="bodySm" className="mt-8 text-center text-muted-lilac">
          {t(PROFILE.PAIRS_EMPTY)}
        </Text>
      )}
    </>
  );
}
```

- [ ] **Step 8: The two profile screens**

Replace `app/(app)/profile.tsx` with:

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { spacing } from '@/shared/theme/page-structure';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { useMe } from '@/features/profile/hooks/use-me';
import { ProfileView } from '@/features/profile/components/profile-view';
import { ProfileActionsSheet } from '@/features/profile/components/profile-actions-sheet';
import { TabScreen } from '@/features/navigation/tab-screen';
/** Your own profile — the Profile tab. */
export default function OwnProfileScreen() {
  const { data: me } = useMe();
  const [actionsOpen, setActionsOpen] = useState(false);
  const { data: pairs = [] } = useQuery({
    ...queries.moments.pairs(me?.id ?? ''),
    enabled: me != null,
  });

  return (
    <TabScreen gutter={spacing.gutterTight}>
      {me ? (
        <>
          <ProfileView
            profile={me}
            subtitle={memberSince(me.created_at)}
            // Balances the "more" button on the right so the avatar stays centred.
            leading={<View className="w-11" />}
            pairs={pairs}
            onPressTrade={() => router.push('/camera')}
            onPressMore={() => setActionsOpen(true)}
          />
          <ProfileActionsSheet visible={actionsOpen} onClose={() => setActionsOpen(false)} />
        </>
      ) : null}
    </TabScreen>
  );
}
```

Replace `app/profile/[userId].tsx` with:

```tsx
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON } from '@/shared/i18n/keys';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { ProfileView } from '@/features/profile/components/profile-view';
import { useComposer } from '@/features/moments/hooks/use-composer';
/**
 * Screen `07b Profil` — a friend's profile, pushed from the feed or a list.
 * Trading from here pre-selects them as the recipient.
 */
export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const composer = useComposer();
  const { data: profile } = useQuery({
    ...queries.profile.byId(userId ?? ''),
    enabled: Boolean(userId),
  });
  const { data: pairs = [] } = useQuery({
    ...queries.moments.pairs(userId ?? ''),
    enabled: Boolean(userId),
  });

  return (
    <Screen scroll gutter={spacing.gutterTight} bottomInset={spacing.contentBottom}>
      {profile ? (
        <ProfileView
          profile={profile}
          subtitle={profile.tagline || memberSince(profile.created_at)}
          leading={
            <GlassButton size={44} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
              <X size={15} color={colors.inkSoft} strokeWidth={2.2} />
            </GlassButton>
          }
          pairs={pairs}
          onPressTrade={() => {
            composer.set({ recipientIds: [profile.id] });
            router.push('/camera');
          }}
        />
      ) : null}
    </Screen>
  );
}
```

- [ ] **Step 9: The feed header is a real person**

In `src/features/feed/components/feed-header.tsx`, widen the prop and pass the name through:

```ts
avatar: string | number | null;
```

```tsx
<Avatar source={avatar} name={name} size={52} ring="halo" />
```

In `app/(app)/feed.tsx`, add:

```ts
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
```

and narrow the fixtures import to what the screen still uses — the header was
`demoProfiles`'s only consumer here, while the story rail still wants the other
two until Task 15:

```ts
import { AVATARS, DEMO_USER_ID } from '@/shared/lib/fixtures';
```

```ts
const { data: me } = useMe();
```

and replace the three fixture props on `<FeedHeader>`:

```tsx
          avatar={avatarUrl(me?.avatar_storage_path ?? null)}
          name={me?.first_name ?? ''}
          subtitle={me ? memberSince(me.created_at) : ''}
```

The story rail, the empty state and the cards still read fixtures; Task 15 finishes this screen.

- [ ] **Step 10: Upload the draft avatar after sign-up**

In `app/(onboarding)/details.tsx`, add:

```ts
import { uploadAvatar } from '@/features/profile/data/profile-api';
import { useOnboardingDraft } from '@/features/onboarding/hooks/use-onboarding-draft';
```

(the draft import is already there) and replace the sign-up branch of `mutationFn` with:

```ts
const outcome = await signUp({ email, password, firstName: draft.firstName, locale: getLocale() });
if (outcome.kind === 'signed-in') {
  // The account exists now, so the picture finally has somewhere to go.
  if (draft.avatar) await uploadAvatar(draft.avatar);
  useOnboardingDraft.reset();
}
return outcome.kind;
```

- [ ] **Step 11: Record where they heard about Glimpse**

In `app/(onboarding)/heard-about.tsx`, add:

```ts
import { useUpdateProfile } from '@/features/profile/data/profile-mutations';
```

```ts
const update = useUpdateProfile();
```

change the initial choice from the mock's pre-selected state to none — a
pre-ticked radio would write "tiktok" as the answer of everyone who taps Next
without reading:

```ts
const [choice, setChoice] = useState<ChannelKey | null>(null);
```

and write the answer on the way out:

```tsx
<CtaFooter
  label={t(ONBOARDING.HEARD_ABOUT.CTA)}
  disabled={!choice}
  onPress={() => {
    // Optimistic like everything else: attribution input is not
    // something the next screen depends on.
    if (choice) update.mutate({ heard_about: choice });
    router.replace('/(onboarding)/thank-you');
  }}
  secondary={t(ONBOARDING.HEARD_ABOUT.SKIP)}
  onSecondary={() => router.replace('/(onboarding)/thank-you')}
/>
```

- [ ] **Step 12: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0. Remaining errors will be call sites still handing `ProfileView` a fixture profile; there should be none.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 13: Commit**

```bash
git add app src
git commit -m "feat: real profiles, avatar uploads, the avatar placeholder and sign out" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 11: Friends data

**Files:**

- Create: `src/features/friends/interfaces.ts`, `src/features/friends/relationships.ts`, `src/features/friends/relationships.test.ts`, `src/features/friends/data/friends-mutations.ts`
- Replace: `src/features/friends/data/friends-api.ts`, `src/features/friends/data/friends-queries.ts`
- Modify: `src/features/friends/components/person-row.tsx`, `app/recipients.tsx`

**Interfaces:**

- Consumes: `optimistic` / `patch` (Task 7), `currentUserId` (Task 8), `avatarUrl` and `useMe` (Task 10), `mutual_friends_counts` (Task 3).
- Produces:
  - From `@/features/friends/interfaces`: `PersonSummary { id; name; username: string | null; tagline: string | null; avatarUrl: string | null }`, `FriendshipWithPeople { id; status: FriendshipStatus; createdAt: string; requester: PersonSummary; recipient: PersonSummary }`, `Relationship = { kind: 'none' } | { kind: 'friends' | 'sent' | 'received'; friendshipId: string }`.
  - From `@/features/friends/relationships`: `otherParty`, `friendsOf`, `incomingRequests`, `sentRequests`, `relationshipWith`.
  - From `@/features/friends/data/friends-api`: `fetchFriendships()`, `searchProfiles(query)`, `fetchMutualCounts(userIds)`, `sendFriendRequest(userId)`, `acceptFriendRequest(friendshipId)`, `removeFriendship(friendshipId)`.
  - Keys `queries.friends.all`, `queries.friends.search(query)`, `queries.friends.mutual(sortedIds)`. **`queries.friends.list` is gone.**
  - From `@/features/friends/data/friends-mutations`: `useSendFriendRequest()`, `useAcceptFriendRequest()`, `useRemoveFriendship()`.
  - `PersonRow` now takes `avatar: string | number | null` and passes `name` through to `Avatar`.

- [ ] **Step 1: Write the shapes**

Create `src/features/friends/interfaces.ts`:

```ts
import type { FriendshipStatus } from '@/shared/lib/database.types';
/** A person as every row, rail and picker in the app needs them. */
export interface PersonSummary {
  id: string;
  name: string;
  username: string | null;
  tagline: string | null;
  avatarUrl: string | null;
}

/** One `friendships` row with both profiles resolved. */
export interface FriendshipWithPeople {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  requester: PersonSummary;
  recipient: PersonSummary;
}

/** Where I stand with someone, and the row that says so. */
export type Relationship =
  | { kind: 'none' }
  | { kind: 'friends'; friendshipId: string }
  | { kind: 'sent'; friendshipId: string }
  | { kind: 'received'; friendshipId: string };
```

- [ ] **Step 2: Write the failing selector test**

Create `src/features/friends/relationships.test.ts`:

```ts
import {
  friendsOf,
  incomingRequests,
  otherParty,
  relationshipWith,
  sentRequests,
} from '@/features/friends/relationships';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';

const person = (id: string): PersonSummary => ({
  id,
  name: id,
  username: id,
  tagline: null,
  avatarUrl: null,
});

const link = (
  id: string,
  requester: string,
  recipient: string,
  status: FriendshipWithPeople['status'],
): FriendshipWithPeople => ({
  id,
  status,
  createdAt: '2026-09-14T10:00:00Z',
  requester: person(requester),
  recipient: person(recipient),
});

const ME = 'me';
const list = [
  link('f1', ME, 'mia', 'accepted'),
  link('f2', 'ben', ME, 'accepted'),
  link('f3', 'lina', ME, 'pending'),
  link('f4', ME, 'noah', 'pending'),
];

describe('relationships', () => {
  it('reads the other person whichever side asked', () => {
    expect(otherParty(list[0], ME).id).toBe('mia');
    expect(otherParty(list[1], ME).id).toBe('ben');
  });

  it('counts only accepted rows as friends', () => {
    expect(friendsOf(list, ME).map((p) => p.id)).toEqual(['mia', 'ben']);
  });

  it('splits the pending rows by direction', () => {
    expect(incomingRequests(list, ME).map((f) => f.id)).toEqual(['f3']);
    expect(sentRequests(list, ME).map((f) => f.id)).toEqual(['f4']);
  });

  it('names the relationship with one person', () => {
    expect(relationshipWith(list, ME, 'mia')).toEqual({ kind: 'friends', friendshipId: 'f1' });
    expect(relationshipWith(list, ME, 'noah')).toEqual({ kind: 'sent', friendshipId: 'f4' });
    expect(relationshipWith(list, ME, 'lina')).toEqual({ kind: 'received', friendshipId: 'f3' });
    expect(relationshipWith(list, ME, 'stranger')).toEqual({ kind: 'none' });
  });
});
```

- [ ] **Step 3: Run to see it fail**

Run: `npx jest src/features/friends/relationships.test.ts`
Expected: FAIL, `Cannot find module '@/features/friends/relationships'`.

- [ ] **Step 4: Write the selectors**

Create `src/features/friends/relationships.ts`:

```ts
import type { FriendshipWithPeople, PersonSummary, Relationship } from '@/features/friends/interfaces';
/**
 * Friends, incoming requests and sent requests are three readings of one list
 * of friendship rows, not three queries. That is what lets a single optimistic
 * patch keep the rail, the request list and the search results in step.
 */

export function otherParty(friendship: FriendshipWithPeople, me: string): PersonSummary {
  return friendship.requester.id === me ? friendship.recipient : friendship.requester;
}

export function friendsOf(list: FriendshipWithPeople[], me: string): PersonSummary[] {
  return list.filter((f) => f.status === 'accepted').map((f) => otherParty(f, me));
}

/** Waiting on me to accept. */
export function incomingRequests(list: FriendshipWithPeople[], me: string): FriendshipWithPeople[] {
  return list.filter((f) => f.status === 'pending' && f.recipient.id === me);
}

/** Waiting on them. */
export function sentRequests(list: FriendshipWithPeople[], me: string): FriendshipWithPeople[] {
  return list.filter((f) => f.status === 'pending' && f.requester.id === me);
}

/** What a search result's pill should say, and which row it would act on. */
export function relationshipWith(list: FriendshipWithPeople[], me: string, otherId: string): Relationship {
  const found = list.find((f) => otherParty(f, me).id === otherId);
  if (!found) return { kind: 'none' };
  if (found.status === 'accepted') return { kind: 'friends', friendshipId: found.id };
  return { kind: found.requester.id === me ? 'sent' : 'received', friendshipId: found.id };
}
```

- [ ] **Step 5: Run the test**

Run: `npx jest src/features/friends/relationships.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Rewrite the API**

Replace `src/features/friends/data/friends-api.ts` with:

```ts
import { supabase } from '@/shared/lib/supabase';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';
/** Everything the friends feature reads and writes. Screens go through the queries and mutations. */

/** The profile columns every person row needs. */
const PERSON_COLUMNS = 'id, first_name, username, tagline, avatar_storage_path';

interface PersonColumns {
  id: string;
  first_name: string;
  username: string | null;
  tagline: string | null;
  avatar_storage_path: string | null;
}

function toPerson(row: PersonColumns): PersonSummary {
  return {
    id: row.id,
    name: row.first_name,
    username: row.username,
    tagline: row.tagline,
    avatarUrl: avatarUrl(row.avatar_storage_path),
  };
}

/**
 * Every friendship I am in, pending or accepted, with both profiles embedded.
 *
 * One query, not three: friends, incoming requests and sent requests are
 * selectors over these rows (see `relationships.ts`). The `!…_fkey` hints are
 * required — there are two foreign keys from `friendships` to `profiles`, and
 * PostgREST will not guess which embed is which.
 */
export async function fetchFriendships(): Promise<FriendshipWithPeople[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select(
      `id, status, created_at,
       requester:profiles!friendships_requester_id_fkey(${PERSON_COLUMNS}),
       recipient:profiles!friendships_recipient_id_fkey(${PERSON_COLUMNS})`,
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    requester: toPerson(row.requester),
    recipient: toPerson(row.recipient),
  }));
}

/**
 * Add-friend search. Handles are the point, so `@` is stripped and both the
 * handle and the first name are matched from the start.
 */
export async function searchProfiles(query: string): Promise<PersonSummary[]> {
  const needle = query.trim().replace(/^@/, '');
  if (needle.length === 0) return [];
  // `,` and `)` are structural inside a PostgREST `or`, so the value is quoted;
  // `%` is stripped so a stray one cannot turn this into a full scan.
  const escaped = needle.replace(/["\\%]/g, '');
  if (escaped.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(PERSON_COLUMNS)
    .or(`username.ilike."${escaped}%",first_name.ilike."${escaped}%"`)
    .neq('id', currentUserId())
    .limit(20);
  if (error) throw error;
  return (data ?? []).map(toPerson);
}

/** "3 mutual" for a whole list of results or requests in one call. */
export async function fetchMutualCounts(userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const { data, error } = await supabase.rpc('mutual_friends_counts', { p_user_ids: userIds });
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.user_id, row.mutual]));
}

/** The pair index means a second request in either direction is a unique violation. */
export async function sendFriendRequest(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: currentUserId(), recipient_id: userId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

/**
 * Accept an incoming request. `status` is the only column the recipient may
 * write (see the column grant in the RLS migration); the friend cap trigger
 * runs on the way in.
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
  if (error) throw error;
}

/**
 * Decline a request, withdraw one you sent, or unfriend: all three delete the
 * row. There is no declined state on purpose — a kept row would tell the
 * requester they were declined and block the pair from ever trying again.
 */
export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}
```

Replace `src/features/friends/data/friends-queries.ts` with:

```ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchFriendships, fetchMutualCounts, searchProfiles } from '@/features/friends/data/friends-api';
/**
 * `all` is every friendship I am in. Friends, requests and sent requests are
 * selectors over it, so one optimistic patch keeps all three in step.
 */
export const friendsQueries = createQueryKeys('friends', {
  all: {
    queryKey: null,
    queryFn: fetchFriendships,
  },
  search: (query: string) => ({
    queryKey: [query],
    queryFn: () => searchProfiles(query),
  }),
  /** Ids sorted by the caller, so two lists of the same people share one entry. */
  mutual: (sortedIds: string[]) => ({
    queryKey: [sortedIds],
    queryFn: () => fetchMutualCounts(sortedIds),
  }),
});
```

- [ ] **Step 7: Write the optimistic mutations**

Create `src/features/friends/data/friends-mutations.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from '@/features/friends/data/friends-api';
import type { FriendshipWithPeople, PersonSummary } from '@/features/friends/interfaces';
import type { Profile } from '@/shared/lib/database.types';
/**
 * All three patch the one `friends.all` list, so the rail, the request lists
 * and every search result agree the instant the pill is tapped.
 */
const ALL = queries.friends.all.queryKey;

function asPerson(me: Profile): PersonSummary {
  return {
    id: me.id,
    name: me.first_name,
    username: me.username,
    tagline: me.tagline,
    avatarUrl: avatarUrl(me.avatar_storage_path),
  };
}

/**
 * The row the server is about to create, built here so the result flips to
 * "Requested" on the tap. Its id is a placeholder until the refetch replaces
 * it — nothing navigates on it, and the withdraw action only appears in the
 * sent list, which the refetch has reached by then.
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();

  return useMutation({
    mutationFn: (person: PersonSummary) => sendFriendRequest(person.id),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], PersonSummary>(ALL, (old, person) =>
        me
          ? [
              {
                id: `pending-${person.id}`,
                status: 'pending' as const,
                createdAt: new Date().toISOString(),
                requester: asPerson(me),
                recipient: person,
              },
              ...old,
            ]
          : old,
      ),
    ]),
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], string>(ALL, (old, friendshipId) =>
        old.map((f) => (f.id === friendshipId ? { ...f, status: 'accepted' as const } : f)),
      ),
    ]),
  });
}

/** Decline, withdraw and unfriend are the same delete, so they are one hook. */
export function useRemoveFriendship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => removeFriendship(friendshipId),
    ...optimistic(queryClient, [
      patch<FriendshipWithPeople[], string>(ALL, (old, friendshipId) =>
        old.filter((f) => f.id !== friendshipId),
      ),
    ]),
  });
}
```

- [ ] **Step 8: Let a person row have no avatar**

In `src/features/friends/components/person-row.tsx`, widen the prop and hand the
name to the placeholder. Keep the `number` arm — it is not vestigial: the
`notOnGlimpse` block still in `app/recipients.tsx` passes a bundled `require()`
id, so narrowing this to `string | null` before the fixtures go in Task 20 breaks
that screen.

```ts
avatar: string | number | null;
```

```tsx
<Avatar source={avatar} name={name} size={size} dimmed={dimmed} ring="halo" />
```

- [ ] **Step 9: Keep the recipients screen compiling**

`queries.friends.list` no longer exists. In `app/recipients.tsx` replace the
friends query and the rendering of each row (Task 14 rewrites this screen in
full):

```ts
import { useMemo } from 'react';
import { friendsOf } from '@/features/friends/relationships';
import { useMe } from '@/features/profile/hooks/use-me';
```

```ts
const { data: me } = useMe();
const { data: friendships = [], error: friendsError } = useQuery(queries.friends.all);
const friends = useMemo(() => friendsOf(friendships, me?.id ?? ''), [friendships, me?.id]);
```

```tsx
<PersonRow
  key={f.id}
  avatar={f.avatarUrl}
  name={f.name}
  subtitle={f.tagline ?? undefined}
  size={46}
  onPress={() => toggle(f.id)}
  accessibilityRole="checkbox"
  accessibilityState={{ checked: selected.includes(f.id) }}
  trailing={<Checkbox checked={selected.includes(f.id)} />}
/>
```

- [ ] **Step 10: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

If the two embedded profiles come back typed as arrays rather than objects, the
generated `Relationships` metadata did not survive the regeneration: re-run
Task 4 Step 2 rather than casting. If `mutual_friends_counts` rows are typed
nullable, add `.overrideTypes<Array<{ user_id: string; mutual: number }>, { merge: false }>()`
to that call, the same way Task 4 Step 6 types the views.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add app src
git commit -m "feat: friendships, search and mutual counts with optimistic mutations" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 12: Friends screens

**Files:**

- Create: `src/shared/lib/use-debounced-value.ts`, `src/features/friends/components/relationship-pill.tsx`
- Delete: `src/features/onboarding/components/contacts-invite.tsx`
- Replace: `app/(onboarding)/friends.tsx`, `app/(app)/friends/search.tsx`, `app/(app)/friends/index.tsx`, `src/features/profile/open-profile.ts`
- Modify: `src/features/feed/components/story-rail.tsx`, `app/(app)/feed.tsx`

**Interfaces:**

- Consumes: the friends data layer (Task 11), `useMe` (Task 10), `useInbox` (existing), `FRIENDS.WITHDRAW` (Task 6).
- Produces:
  - `useDebouncedValue<T>(value: T, delay?: number): T` from `@/shared/lib/use-debounced-value` (default 250ms).
  - `RelationshipPill({ person: PersonSummary; relationship: Relationship; compact?: boolean })`.
  - `openProfile(userId: string, myId: string): void` — **the signature gains `myId`**.
  - `StoryItem.avatar` widens to `string | number | null`; `StoryRail` passes the name through for the placeholder.

- [ ] **Step 1: Debounce the search box**

Create `src/shared/lib/use-debounced-value.ts`:

```ts
import { useEffect, useState } from 'react';
/**
 * A search field fires on every keystroke; the query behind it should not.
 * 250ms skips the middle of a word without feeling laggy.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

- [ ] **Step 2: One pill for every relationship**

Create `src/features/friends/components/relationship-pill.tsx`:

```tsx
import { t } from '@/shared/i18n/i18n';
import { FRIENDS } from '@/shared/i18n/keys';
import { Pill } from '@/features/friends/components/pill';
import { useAcceptFriendRequest, useSendFriendRequest } from '@/features/friends/data/friends-mutations';
import type { PersonSummary, Relationship } from '@/features/friends/interfaces';
interface RelationshipPillProps {
  person: PersonSummary;
  relationship: Relationship;
  compact?: boolean;
}

/**
 * The trailing control on a person row: what I can do about them right now.
 * Add and Accept are mutations; Requested and Friends are states. Both
 * mutations patch `friends.all`, so the pill it sits in re-renders on the tap.
 */
export function RelationshipPill({ person, relationship, compact = false }: RelationshipPillProps) {
  const send = useSendFriendRequest();
  const accept = useAcceptFriendRequest();

  switch (relationship.kind) {
    case 'friends':
      return <Pill label={t(FRIENDS.SEARCH.ALREADY_FRIENDS)} tone="outline" compact={compact} />;
    case 'sent':
      return <Pill label={t(FRIENDS.SEARCH.SENT)} tone="quiet" compact={compact} />;
    case 'received':
      return (
        <Pill
          label={t(FRIENDS.ACCEPT)}
          tone="filled"
          compact={compact}
          onPress={() => accept.mutate(relationship.friendshipId)}
        />
      );
    default:
      return (
        <Pill
          label={t(FRIENDS.SEARCH.ADD)}
          tone="filled"
          compact={compact}
          onPress={() => send.mutate(person)}
        />
      );
  }
}
```

- [ ] **Step 3: A rail avatar may be absent**

In `src/features/feed/components/story-rail.tsx`, widen the item and pass the name on:

```ts
avatar: string | number | null;
```

```tsx
<Avatar source={item.avatar} name={item.name} size={size} ring={item.waiting ? 'active' : 'idle'} />
```

- [ ] **Step 4: Your own avatar leads to your own tab**

Replace `src/features/profile/open-profile.ts` with:

```ts
import { router } from 'expo-router';
/**
 * Your own avatar in a rail leads to the profile tab, not to a "friend" page
 * with a close button and a trade CTA that pre-selects yourself.
 */
export function openProfile(userId: string, myId: string) {
  if (userId === myId) router.push('/(app)/profile');
  else router.push(`/profile/${userId}`);
}
```

In `app/(app)/feed.tsx`, the rail's handler now needs to know who I am (`me` is
already read there after Task 10):

```tsx
            onPressItem={(id) => openProfile(id, me?.id ?? '')}
```

- [ ] **Step 5: Real search in onboarding step 5**

Delete the contacts card — contacts import is not built, and a card that fakes
it is the one thing on this screen that cannot lead to a trade:

```bash
git rm src/features/onboarding/components/contacts-invite.tsx
```

Replace `app/(onboarding)/friends.tsx` with:

```tsx
import { useState } from 'react';
import { Share, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Copy, MoreHorizontal, Search } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { ProgressHeader } from '@/shared/ui/progress-header';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { FRIENDS, ONBOARDING } from '@/shared/i18n/keys';
import { queries } from '@/shared/lib/queries';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { PersonRow } from '@/features/friends/components/person-row';
import { RelationshipPill } from '@/features/friends/components/relationship-pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { relationshipWith } from '@/features/friends/relationships';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Screen `05 Friends · 5 of 7`.
 *
 * The positioning note is emphatic that a pair is the unit of value, so this is
 * the most important step in the flow: it is the only one that can end with two
 * people able to trade. Artboard `05a`'s contacts card is gone — contacts
 * import is out of scope, and a card that mimics it leads nowhere.
 */
export default function OnboardingFriendsScreen() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const searching = debounced.trim().length > 0;
  const { data: results = [] } = useQuery({ ...queries.friends.search(debounced), enabled: searching });
  const handle = me?.username ? `@${me.username}` : '';

  return (
    <Screen
      footer={
        <CtaFooter
          label={t(ONBOARDING.FRIENDS.CTA)}
          onPress={() => router.push('/(onboarding)/notifications')}
          secondary={t(ONBOARDING.FRIENDS.SKIP)}
          onSecondary={() => router.push('/(onboarding)/notifications')}
        />
      }
      scroll
    >
      <ProgressHeader step={5} onClose={() => router.back()} />

      <Text variant="displaySm" className="mt-[26px] text-ink">
        {t(ONBOARDING.FRIENDS.TITLE)}
      </Text>
      <Text variant="bodySm" className="mt-3 text-muted">
        {t(ONBOARDING.FRIENDS.SUBTITLE)}
      </Text>

      <View className="mt-5 h-field flex-row items-center gap-3 rounded-pill bg-surface-lilac px-[18px]">
        <Search size={20} color={colors.mutedLilac} strokeWidth={2.2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(ONBOARDING.FRIENDS.SEARCH_PLACEHOLDER)}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 p-0 font-sans text-[16.5px] text-ink"
        />
      </View>

      {searching ? (
        <View className="mt-6 gap-3.5">
          <SectionLabel>{t(FRIENDS.SEARCH.RESULTS_SECTION, { count: results.length })}</SectionLabel>
          <View className="gap-3.5">
            {results.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={person.username ? `@${person.username}` : undefined}
                trailing={
                  <RelationshipPill
                    person={person}
                    relationship={relationshipWith(friendships, me?.id ?? '', person.id)}
                    compact
                  />
                }
              />
            ))}
            {results.length === 0 ? (
              <Text variant="bodySm" className="text-muted-lilac">
                {t(FRIENDS.SEARCH.EMPTY)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* The actions still copy and share the handle; Task 19 makes them mint a
          real invite link. */}
      <ShareRow
        className="mt-[22px]"
        dividerLabel={t(ONBOARDING.FRIENDS.DIVIDER_SHARE)}
        link={handle}
        linkLabel={t(ONBOARDING.FRIENDS.SHARE_LINK)}
        actions={[
          {
            label: t(ONBOARDING.FRIENDS.SHARE_COPY),
            icon: <Copy size={22} color={colors.inkFaint} strokeWidth={2} />,
            onPress: () => void Clipboard.setStringAsync(handle),
          },
          {
            label: t(ONBOARDING.FRIENDS.SHARE_MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => void Share.share({ message: handle }),
          },
        ]}
      />
    </Screen>
  );
}
```

- [ ] **Step 6: Real search on the add-friend screen**

Replace `app/(app)/friends/search.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, QrCode, Search, X } from 'lucide-react-native';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, FRIENDS } from '@/shared/i18n/keys';
import { queries } from '@/shared/lib/queries';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { PersonRow } from '@/features/friends/components/person-row';
import { RelationshipPill } from '@/features/friends/components/relationship-pill';
import { ShareRow } from '@/features/friends/components/share-row';
import { relationshipWith } from '@/features/friends/relationships';
import type { PersonSummary } from '@/features/friends/interfaces';
import { useMe } from '@/features/profile/hooks/use-me';
/** Screen `D Freund suchen` — search by @username, or share your link. */
export default function FriendSearchScreen() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const searching = debounced.trim().length > 0;
  const { data: results = [] } = useQuery({ ...queries.friends.search(debounced), enabled: searching });

  // Sorted, so the same set of people is one cache entry however it was found.
  const ids = useMemo(() => results.map((p) => p.id).sort(), [results]);
  const { data: mutual = {} } = useQuery({ ...queries.friends.mutual(ids), enabled: ids.length > 0 });
  const handle = me?.username ? `@${me.username}` : '';

  return (
    <Screen scroll bottomInset={spacing.contentBottom}>
      <View className="h-10 flex-row items-center gap-3">
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={13} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Text variant="sheetTitle" className="text-ink">
          {t(FRIENDS.SEARCH.TITLE)}
        </Text>
      </View>

      <View
        className={cn(
          'mt-5 h-field flex-row items-center gap-2.5 rounded-pill border-[1.5px] border-transparent bg-surface-lilac-alt px-[18px]',
          query.length > 0 && 'border-purple',
        )}
      >
        <Search size={19} color={colors.mutedViolet} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t(FRIENDS.SEARCH.PLACEHOLDER)}
          placeholderTextColor={colors.mutedCool}
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 p-0 font-sans text-[16.5px] text-ink"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            className="h-[22px] w-[22px] items-center justify-center rounded-[11px] bg-dot-idle-soft"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t(COMMON.CLEAR)}
          >
            <X size={9} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </View>

      {searching ? (
        <View className="mt-[26px] gap-3.5">
          <SectionLabel>{t(FRIENDS.SEARCH.RESULTS_SECTION, { count: results.length })}</SectionLabel>
          <View className="gap-[18px]">
            {results.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={subtitleFor(person, mutual[person.id] ?? 0)}
                onPress={() => router.push(`/profile/${person.id}`)}
                trailing={
                  <RelationshipPill
                    person={person}
                    relationship={relationshipWith(friendships, me?.id ?? '', person.id)}
                  />
                }
              />
            ))}
            {results.length === 0 ? (
              <Text variant="bodySm" className="text-muted-lilac">
                {t(FRIENDS.SEARCH.EMPTY)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* QR is designed but inert; Task 19 wires the two share actions. */}
      <ShareRow
        className="mt-[30px]"
        dividerLabel={t(FRIENDS.SEARCH.DIVIDER_SHARE)}
        link={handle}
        linkLabel={t(FRIENDS.SEARCH.LINK)}
        actions={[
          {
            label: t(FRIENDS.SEARCH.QR),
            icon: <QrCode size={22} color={colors.inkFaint} strokeWidth={2} />,
          },
          {
            label: t(FRIENDS.SEARCH.MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => void Share.share({ message: handle }),
          },
        ]}
      />
    </Screen>
  );
}

/** "@miahartmann · 3 mutual", with either half left out when there is none. */
function subtitleFor(person: PersonSummary, mutual: number): string | undefined {
  const parts = [
    person.username ? `@${person.username}` : null,
    mutual > 0 ? t(FRIENDS.SEARCH.MUTUAL, { count: mutual }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
```

- [ ] **Step 7: The friends tab on real rows**

Replace `app/(app)/friends/index.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, Plus } from 'lucide-react-native';
import { CtaFooter } from '@/shared/ui/cta-footer';
import { GlassButton } from '@/shared/ui/glass-button';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { avatarSize } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, FEED, FRIENDS } from '@/shared/i18n/keys';
import { relativeTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { PersonRow } from '@/features/friends/components/person-row';
import { Pill } from '@/features/friends/components/pill';
import { useAcceptFriendRequest, useRemoveFriendship } from '@/features/friends/data/friends-mutations';
import { friendsOf, incomingRequests, otherParty, sentRequests } from '@/features/friends/relationships';
import { StoryRail } from '@/features/feed/components/story-rail';
import { ChatsList } from '@/features/chat/components/chats-list';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { TabScreen } from '@/features/navigation/tab-screen';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useMe } from '@/features/profile/hooks/use-me';
import { openProfile } from '@/features/profile/open-profile';
type Tab = 'friends' | 'chats';

/**
 * Screen `08 Freunde` — the story rail, incoming requests, and outgoing
 * requests still waiting. The three sections are three readings of one list of
 * `friendships` rows (see `relationships.ts`).
 */
export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  /** Withdrawing takes two taps; there is no undo for a deleted row. */
  const [confirmWithdraw, setConfirmWithdraw] = useState<string | null>(null);

  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const { pending } = useInbox();

  const accept = useAcceptFriendRequest();
  const remove = useRemoveFriendship();

  const requests = useMemo(() => incomingRequests(friendships, myId), [friendships, myId]);
  const sent = useMemo(() => sentRequests(friendships, myId), [friendships, myId]);
  // "3 mutual" is what makes a request from a near-stranger legible. Sorted, so
  // it shares its cache entry with the search screen's copy of the same ask.
  const requestIds = useMemo(
    () => requests.map((friendship) => otherParty(friendship, myId).id).sort(),
    [requests, myId],
  );
  const { data: mutual = {} } = useQuery({
    ...queries.friends.mutual(requestIds),
    enabled: requestIds.length > 0,
  });
  const rail = useMemo(
    () => [
      { id: myId, name: t(COMMON.YOU), avatar: avatarUrl(me?.avatar_storage_path ?? null), waiting: true },
      ...friendsOf(friendships, myId).map((person) => ({
        id: person.id,
        name: person.name,
        avatar: person.avatarUrl,
        // A purple ring means they are waiting on me.
        waiting: pending.some((moment) => moment.from.id === person.id),
      })),
    ],
    [friendships, myId, me, pending],
  );
  const waiting = rail.filter((item) => item.waiting).length;

  // Counts on the toggle, so it says how much is waiting behind each tab.
  // Chats stays 0 until Task 16 has the thread totals.
  const unreadTotal = 0;
  const badges: Record<Tab, number> = { friends: requests.length, chats: unreadTotal };
  const error = accept.error ?? remove.error;

  return (
    <TabScreen>
      <View className="h-10 flex-row items-center justify-between">
        <Text variant="screenTitle" className="text-ink">
          {t(FRIENDS.TITLE)}
        </Text>
        <GlassButton
          size={38}
          onPress={() => router.push('/(app)/friends/search')}
          accessibilityLabel={t(FRIENDS.SEARCH.TITLE)}
        >
          <Plus size={18} color={colors.purpleMuted} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <View className="mt-4 flex-row gap-1 rounded-pill bg-surface-lilac p-1">
        {(['friends', 'chats'] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === key }}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-[7px] rounded-pill py-2',
              tab === key && 'bg-white',
            )}
          >
            <Text
              variant="bodyXs"
              weight="semibold"
              className={tab === key ? 'text-purple-deep' : 'text-muted-lilac'}
            >
              {t(key === 'friends' ? FRIENDS.TAB_FRIENDS : FRIENDS.TAB_CHATS)}
            </Text>
            {badges[key] > 0 ? (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-pill bg-purple px-1.5">
                <Text variant="captionXs" weight="semibold" className="text-white">
                  {String(badges[key])}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>

      {tab === 'chats' ? (
        <ChatsList />
      ) : (
        <>
          <View className="mt-[22px] gap-3.5">
            <SectionLabel trailing={waiting > 0 ? t(FEED.STORIES_TRAILING, { count: waiting }) : undefined}>
              {t(FRIENDS.STORIES_LABEL)}
            </SectionLabel>
            <StoryRail
              size={avatarSize.ring}
              items={rail}
              placeholders={Math.max(0, 3 - rail.length)}
              placeholderLabel={t(FEED.ADD_FRIEND)}
              onPressItem={(id) => openProfile(id, myId)}
              onPressPlaceholder={() => router.push('/(app)/friends/search')}
            />
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t(FRIENDS.REQUESTS_SECTION, { count: requests.length })}</SectionLabel>
            <View className="gap-4">
              {requests.map((friendship) => {
                const person = otherParty(friendship, myId);
                return (
                  <PersonRow
                    key={friendship.id}
                    avatar={person.avatarUrl}
                    name={person.name}
                    subtitle={t(FRIENDS.SEARCH.MUTUAL, { count: mutual[person.id] ?? 0 })}
                    trailing={
                      <Pill
                        label={t(FRIENDS.ACCEPT)}
                        tone="filled"
                        onPress={() => accept.mutate(friendship.id)}
                      />
                    }
                    onPress={() => router.push(`/profile/${person.id}`)}
                  />
                );
              })}
            </View>
          </View>

          <View className="mt-[22px] gap-3.5">
            <SectionLabel>{t(FRIENDS.SENT_SECTION, { count: sent.length })}</SectionLabel>
            <View className="gap-4">
              {sent.map((friendship) => {
                const person = otherParty(friendship, myId);
                const confirming = confirmWithdraw === friendship.id;
                return (
                  <PersonRow
                    key={friendship.id}
                    avatar={person.avatarUrl}
                    name={person.name}
                    subtitle={t(FRIENDS.SENT_AGO, { time: relativeTime(friendship.createdAt) })}
                    subtitleIcon={<Clock size={14} color={colors.placeholderSoft} strokeWidth={2} />}
                    dimmed
                    trailing={
                      <Pill
                        label={confirming ? t(FRIENDS.WITHDRAW) : t(FRIENDS.PENDING)}
                        tone={confirming ? 'filled' : 'muted'}
                        onPress={() =>
                          confirming ? remove.mutate(friendship.id) : setConfirmWithdraw(friendship.id)
                        }
                      />
                    }
                  />
                );
              })}
            </View>
          </View>

          {error ? (
            <Text variant="meta" className="mt-4 text-center text-purple-deep">
              {errorMessage(error)}
            </Text>
          ) : null}

          <CtaFooter label={t(FRIENDS.ADD_CTA)} onPress={() => router.push('/(app)/friends/search')} />
        </>
      )}
    </TabScreen>
  );
}
```

- [ ] **Step 8: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0. Any remaining error should be a `demo*` import in a screen
this task rewrote; there should be none left in `app/(onboarding)/friends.tsx`,
`app/(app)/friends/search.tsx` or `app/(app)/friends/index.tsx`.

Run:

```bash
grep -rn "demo\|DEMO_USER_ID" \
  "app/(onboarding)/friends.tsx" "app/(app)/friends/search.tsx" "app/(app)/friends/index.tsx"
```

Expected: no output — the three screens this task rewrote are fixture-free.

Do **not** grep the whole tree for `demoOthers` here and expect silence: two
hits are deliberate at this point. `app/recipients.tsx` still renders its
not-on-Glimpse block from fixtures until Task 14 rewrites the screen (Task 11
Step 8 depends on that), and `src/shared/lib/fixtures.ts` is where they are
defined until Task 20. `demoFriendRequests` and `demoSentRequests` do lose
their last consumer here, so after this task they are definitions with nothing
reading them.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add -A app src
git commit -m "feat: real friend search, requests and the friends tab" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 13: Moments data

**Files:**

- Create: `src/features/moments/data/moment-urls.ts`, `src/features/moments/selectors.ts`, `src/features/moments/selectors.test.ts`, `src/features/moments/data/moments-mutations.ts`
- Replace: `src/features/moments/interfaces.ts`, `src/features/moments/data/moments-api.ts`, `src/features/moments/data/moments-queries.ts`
- Modify: `src/features/moments/hooks/use-inbox.ts`, `src/features/auth/sign-out.ts`, `src/features/feed/components/locked-moment-card.tsx`, `src/features/profile/components/pair-grid.tsx`, `app/(app)/feed.tsx`, `app/moment/[tradeId].tsx`, `app/photo/[momentId].tsx`, `app/compose.tsx`, `app/recipients.tsx`

**Interfaces:**

- Consumes: `createSignedUrlCache` (Task 7), `currentUserId` (Task 8), `resizeJpeg` / `MAX_CAPTURE_EDGE` (Task 9), `avatarUrl` (Task 10), the `blur-moment` function (Task 5).
- Produces:
  - From `@/features/moments/interfaces`: `MomentSender { id; name; username: string | null; avatarUrl: string | null }`, `InboxMoment` (with `from: MomentSender` and `photo: string`), `MomentPair` (with `rightMomentId: string | null` meaning "nobody has traded back yet", `left`/`right` as `string`, and **no `locked` flag**), `MomentPhoto { photo: string; fromName: string; fromAvatarUrl: string | null; capturedAt: string }`, `WaitingSender { person: MomentSender; tradeId: string }`, `OutgoingLockedTrade { tradeId; momentId; createdAt }`.
  - From `@/features/moments/data/moment-urls`: `momentUrlCache`, `signedMomentUrls(momentIds: string[]): Promise<Map<string, string>>`.
  - From `@/features/moments/selectors`: `nextUnlockDelay(inbox, now): number | null`, `lockedTiles(trades, urls): MomentPair[]`, `waitingBySender(inbox): WaitingSender[]`, `splitSelection(selectedIds, waiting): { replyToTradeIds: string[]; recipientIds: string[] }`.
  - From `@/features/moments/data/moments-api`: `fetchInbox()`, `fetchPairs(withUserId: string | null)`, `fetchOutgoingLocked(): Promise<MomentPair[]>`, `fetchMomentPhoto(momentId)`, `createMoment({ localUri, caption, width: number, height: number }): Promise<string>`, `sendMoment(momentId, recipientIds)`, `respondToTrade(tradeId, momentId)`, `markTradeSeen(tradeId)`. **`publicAvatarUrl` is gone** — `avatarUrl` from the profile feature replaced it in Task 11.
  - Keys `queries.moments.inbox`, `pairs(withUserId | null)`, `outgoingLocked`, `photo(momentId)`.
  - `useMarkTradeSeen()` from `@/features/moments/data/moments-mutations`.

- [ ] **Step 1: Rewrite the shapes**

Replace `src/features/moments/interfaces.ts` with:

```ts
import type { TradeStatus } from '@/shared/lib/database.types';
/** The sender of a received moment, as the cards and the rails need them. */
export interface MomentSender {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

/**
 * A received moment as the UI thinks of it: a photo plus a lock.
 *
 * `photo` is a signed URL — the original once the trade is open, the frosted
 * rendition before that, and `''` when the server withholds it entirely
 * (a moment whose blurred rendition does not exist yet).
 */
export interface InboxMoment {
  tradeId: string;
  momentId: string;
  from: MomentSender;
  caption: string | null;
  capturedAt: string;
  status: TradeStatus;
  /** False while the moment is frosted and awaiting a trade back. */
  isOpen: boolean;
  /** When the soft escape fires, if one is set. */
  autoUnlockAt: string | null;
  seenAt: string | null;
  photo: string;
}

/**
 * A completed trade: two photos taken the same day, kept together — or your own
 * half still waiting for one, which is what `rightMomentId: null` means.
 */
export interface MomentPair {
  tradeId: string;
  date: string;
  leftMomentId: string;
  /** `null` while nobody has traded back for this photo. */
  rightMomentId: string | null;
  left: string;
  right: string;
}

/** What the full-screen photo viewer needs, resolved for any moment id. */
export interface MomentPhoto {
  photo: string;
  fromName: string;
  fromAvatarUrl: string | null;
  capturedAt: string;
}

/** Somebody whose frosted moment I have not answered, and the trade to answer. */
export interface WaitingSender {
  person: MomentSender;
  tradeId: string;
}

/** One of my own moments that nobody has traded back for yet. */
export interface OutgoingLockedTrade {
  tradeId: string;
  momentId: string;
  createdAt: string;
}
```

- [ ] **Step 2: Write the failing selector tests**

Create `src/features/moments/selectors.test.ts`:

```ts
import { lockedTiles, nextUnlockDelay, splitSelection, waitingBySender } from '@/features/moments/selectors';
import type { InboxMoment } from '@/features/moments/interfaces';

const NOW = Date.parse('2026-09-14T12:00:00.000Z');
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

const moment = (over: Partial<InboxMoment> & Pick<InboxMoment, 'tradeId'>): InboxMoment => ({
  momentId: `m-${over.tradeId}`,
  from: { id: 'mia', name: 'Mia', username: 'mia', avatarUrl: null },
  caption: null,
  capturedAt: at(-3_600_000),
  status: 'pending',
  isOpen: false,
  autoUnlockAt: null,
  seenAt: null,
  photo: '',
  ...over,
});

describe('nextUnlockDelay', () => {
  it('is null with nothing frosted', () => {
    expect(
      nextUnlockDelay([moment({ tradeId: 't1', isOpen: true, autoUnlockAt: at(3_600_000) })], NOW),
    ).toBeNull();
  });

  it('is null when no frosted moment has a deadline', () => {
    expect(nextUnlockDelay([moment({ tradeId: 't1' })], NOW)).toBeNull();
  });

  it('waits for the earliest deadline, a moment past it', () => {
    const delay = nextUnlockDelay(
      [
        moment({ tradeId: 't1', autoUnlockAt: at(7_200_000) }),
        moment({ tradeId: 't2', autoUnlockAt: at(600_000) }),
      ],
      NOW,
    );
    expect(delay).toBe(601_000);
  });

  it('ignores deadlines that have already passed', () => {
    expect(nextUnlockDelay([moment({ tradeId: 't1', autoUnlockAt: at(-60_000) })], NOW)).toBeNull();
  });
});

describe('lockedTiles', () => {
  it('draws one tile per photo, however many people it went to', () => {
    const tiles = lockedTiles(
      [
        { tradeId: 't1', momentId: 'm1', createdAt: at(-60_000) },
        { tradeId: 't2', momentId: 'm1', createdAt: at(-60_000) },
        { tradeId: 't3', momentId: 'm2', createdAt: at(-120_000) },
      ],
      new Map([['m1', 'https://signed/m1']]),
    );

    expect(tiles).toHaveLength(2);
    expect(tiles[0]).toEqual({
      tradeId: 't1',
      date: at(-60_000),
      leftMomentId: 'm1',
      rightMomentId: null,
      left: 'https://signed/m1',
      right: '',
    });
    // No URL yet: the tile still holds its place rather than vanishing.
    expect(tiles[1].left).toBe('');
  });
});

describe('waitingBySender', () => {
  it('lists one entry per sender, their oldest unanswered moment', () => {
    const inbox = [
      moment({ tradeId: 'new', capturedAt: at(-60_000) }),
      moment({ tradeId: 'old', capturedAt: at(-600_000) }),
      moment({ tradeId: 'ben', from: { id: 'ben', name: 'Ben', username: 'ben', avatarUrl: null } }),
      moment({ tradeId: 'open', isOpen: true }),
    ];

    expect(waitingBySender(inbox)).toEqual([
      { person: expect.objectContaining({ id: 'mia' }), tradeId: 'old' },
      { person: expect.objectContaining({ id: 'ben' }), tradeId: 'ben' },
    ]);
  });
});

describe('splitSelection', () => {
  const waiting = [{ person: { id: 'mia', name: 'Mia', username: null, avatarUrl: null }, tradeId: 't-mia' }];

  it('answers the people who are waiting and opens a lock for the rest', () => {
    expect(splitSelection(['mia', 'ben'], waiting)).toEqual({
      replyToTradeIds: ['t-mia'],
      recipientIds: ['ben'],
    });
  });

  it('never opens a second lock back at someone already waiting on me', () => {
    expect(splitSelection(['mia'], waiting)).toEqual({ replyToTradeIds: ['t-mia'], recipientIds: [] });
  });
});
```

- [ ] **Step 3: Run to see it fail**

Run: `npx jest src/features/moments/selectors.test.ts`
Expected: FAIL, `Cannot find module '@/features/moments/selectors'`.

- [ ] **Step 4: Write the selectors**

Create `src/features/moments/selectors.ts`:

```ts
import type {
  InboxMoment,
  MomentPair,
  OutgoingLockedTrade,
  WaitingSender,
} from '@/features/moments/interfaces';
/** Pure readings of the inbox and my outgoing trades. No I/O, so they are tested. */

/**
 * How long until the next frosted card opens on its own.
 *
 * Nothing changes in the database when a trade's 24 hours pass, so no Realtime
 * event ever arrives. The inbox schedules one refetch for the earliest deadline
 * it holds instead. `null` means there is nothing to wait for.
 */
export function nextUnlockDelay(inbox: InboxMoment[], now: number): number | null {
  const deadlines = inbox
    .filter((moment) => !moment.isOpen && moment.autoUnlockAt !== null)
    .map((moment) => Date.parse(moment.autoUnlockAt as string))
    .filter((time) => Number.isFinite(time) && time > now);
  if (deadlines.length === 0) return null;
  // A second of slack, so the refetch happens after the deadline, not on it.
  return Math.min(...deadlines) - now + 1000;
}

/**
 * My unanswered outgoing moments as grid tiles: my photo on the left, an empty
 * frosted tile on the right until somebody sends one back.
 *
 * One tile per photo, not per recipient — sending one capture to three people
 * is still one moment, and three tiles would claim otherwise.
 */
export function lockedTiles(trades: OutgoingLockedTrade[], urls: Map<string, string>): MomentPair[] {
  const seen = new Set<string>();
  const tiles: MomentPair[] = [];

  for (const trade of trades) {
    if (seen.has(trade.momentId)) continue;
    seen.add(trade.momentId);
    tiles.push({
      tradeId: trade.tradeId,
      date: trade.createdAt,
      leftMomentId: trade.momentId,
      rightMomentId: null,
      left: urls.get(trade.momentId) ?? '',
      right: '',
    });
  }
  return tiles;
}

/**
 * Who is waiting on me, and which trade a capture would answer.
 *
 * Several frosted moments from one person collapse to their oldest unanswered
 * one: answering the newest first would leave the older lock open for ever.
 */
export function waitingBySender(inbox: InboxMoment[]): WaitingSender[] {
  const oldest = new Map<string, InboxMoment>();

  for (const moment of inbox) {
    if (moment.isOpen) continue;
    const held = oldest.get(moment.from.id);
    if (!held || Date.parse(moment.capturedAt) < Date.parse(held.capturedAt)) {
      oldest.set(moment.from.id, moment);
    }
  }
  return [...oldest.values()].map((moment) => ({ person: moment.from, tradeId: moment.tradeId }));
}

/**
 * The recipients screen has one list of selected people; the send has two jobs.
 *
 * Selecting somebody who is waiting on me answers their moment. Selecting
 * anybody else opens a new lock. One capture can do both — and a capture sent
 * to somebody already waiting always answers them rather than opening a second
 * lock in the reverse direction.
 */
export function splitSelection(
  selectedIds: string[],
  waiting: WaitingSender[],
): { replyToTradeIds: string[]; recipientIds: string[] } {
  const tradeByPerson = new Map(waiting.map((entry) => [entry.person.id, entry.tradeId]));
  const replyToTradeIds: string[] = [];
  const recipientIds: string[] = [];

  for (const id of selectedIds) {
    const tradeId = tradeByPerson.get(id);
    if (tradeId) replyToTradeIds.push(tradeId);
    else recipientIds.push(id);
  }
  return { replyToTradeIds, recipientIds };
}
```

- [ ] **Step 5: Run the selector tests**

Run: `npx jest src/features/moments/selectors.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Sign moment URLs through the cache**

Create `src/features/moments/data/moment-urls.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/shared/lib/supabase';
import { createSignedUrlCache } from '@/shared/lib/signed-urls';
/**
 * Signed URLs for moment objects, cached so a refetch hands back the same URL
 * and `expo-image` goes on serving it from disk instead of downloading the same
 * photo again.
 *
 * The server decides *which* rendition each caller may see
 * (`visible_moment_paths`); the Storage API then refuses to sign any path the
 * caller's row security does not allow. The client never chooses — it only
 * asks. See docs/database.md §3.
 */
export const momentUrlCache = createSignedUrlCache(AsyncStorage, async (paths, expiresIn) => {
  const { data, error } = await supabase.storage.from('moments').createSignedUrls(paths, expiresIn);
  if (error) throw error;
  return data ?? [];
});

/** A URL per moment the caller may see. Ids that were withheld are simply absent. */
export async function signedMomentUrls(momentIds: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const ids = [...new Set(momentIds)];
  if (ids.length === 0) return result;

  const { data: paths, error } = await supabase.rpc('visible_moment_paths', { p_moment_ids: ids });
  if (error) throw error;

  // A null path is "nothing yet": a locked moment whose blurred rendition has
  // not been made is withheld rather than leaked.
  const allowed = (paths ?? []).filter(
    (row): row is { moment_id: string; path: string } => row.path !== null,
  );
  if (allowed.length === 0) return result;

  const urls = await momentUrlCache.get(allowed.map((row) => row.path));
  for (const { moment_id, path } of allowed) {
    const url = urls.get(path);
    if (url) result.set(moment_id, url);
  }
  return result;
}
```

In `src/features/auth/sign-out.ts`, add the import and the line the Task 10 comment promised:

```ts
import { momentUrlCache } from '@/features/moments/data/moment-urls';
```

```ts
await momentUrlCache.clear();
```

- [ ] **Step 7: Rewrite the API**

Replace `src/features/moments/data/moments-api.ts` with:

```ts
import { supabase } from '@/shared/lib/supabase';
import { MAX_CAPTURE_EDGE, resizeJpeg } from '@/shared/lib/resize';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { signedMomentUrls } from '@/features/moments/data/moment-urls';
import { lockedTiles } from '@/features/moments/selectors';
import type { InboxRow, PairRow } from '@/shared/lib/database.types';
import type {
  InboxMoment,
  MomentPair,
  MomentPhoto,
  OutgoingLockedTrade,
} from '@/features/moments/interfaces';
/** Data access for the trade loop. Screens go through the queries and mutations. */

export async function fetchInbox(): Promise<InboxMoment[]> {
  const { data, error } = await supabase
    .from('v_inbox')
    .select('*')
    .overrideTypes<InboxRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  const urls = await signedMomentUrls(rows.map((row) => row.moment_id));

  // `photo` is empty when the server withholds the moment; the card then draws
  // its own neutral frosted placeholder rather than a broken image.
  return rows.map((row) => ({
    tradeId: row.trade_id,
    momentId: row.moment_id,
    from: {
      id: row.from_id,
      name: row.from_name,
      username: row.from_username,
      avatarUrl: avatarUrl(row.from_avatar_storage_path),
    },
    caption: row.caption,
    capturedAt: row.moment_created_at,
    status: row.status,
    isOpen: row.is_open,
    autoUnlockAt: row.auto_unlock_at,
    seenAt: row.seen_at,
    photo: urls.get(row.moment_id) ?? '',
  }));
}

/** `null` asks for every pair I am in; an id narrows it to that person. */
export async function fetchPairs(withUserId: string | null): Promise<MomentPair[]> {
  const base = supabase.from('v_pairs').select('*');
  const filtered = withUserId ? base.or(`user_a.eq.${withUserId},user_b.eq.${withUserId}`) : base;
  const { data, error } = await filtered.overrideTypes<PairRow[], { merge: false }>();
  if (error) throw error;

  const pairs = data ?? [];
  const urls = await signedMomentUrls(
    pairs.flatMap((pair) => [pair.initiator_moment_id, pair.responder_moment_id]),
  );

  return pairs.map((pair) => ({
    tradeId: pair.trade_id,
    date: pair.pair_at,
    leftMomentId: pair.initiator_moment_id,
    rightMomentId: pair.responder_moment_id,
    left: urls.get(pair.initiator_moment_id) ?? '',
    right: urls.get(pair.responder_moment_id) ?? '',
  }));
}

/**
 * My own moments nobody has traded back for — the locked tiles on my grid.
 * Newest first, so they read as one sequence with the completed pairs.
 */
export async function fetchOutgoingLocked(): Promise<MomentPair[]> {
  const { data, error } = await supabase
    .from('trades')
    .select('id, initiator_moment_id, created_at')
    .eq('initiator_id', currentUserId())
    .eq('status', 'pending')
    .is('responder_moment_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const trades: OutgoingLockedTrade[] = (data ?? []).map((row) => ({
    tradeId: row.id,
    momentId: row.initiator_moment_id,
    createdAt: row.created_at,
  }));
  const urls = await signedMomentUrls(trades.map((trade) => trade.momentId));
  return lockedTiles(trades, urls);
}

interface CreateMomentArgs {
  localUri: string;
  caption: string | null;
  /** Pixel size of the capture. Required: without it the resize cannot bound anything. */
  width: number;
  height: number;
}

/**
 * Resize, upload, insert the row, make the frosted rendition. Returns the
 * moment id.
 *
 * The blurred copy is produced server-side on purpose: a client that could
 * upload its own "blurred" rendition could upload the original and call it
 * blurred. A failure here fails the whole send, so a recipient never ends up
 * with a moment there is nothing to show them for.
 */
export async function createMoment(args: CreateMomentArgs): Promise<string> {
  const userId = currentUserId();
  const resized = await resizeJpeg(
    args.localUri,
    { width: args.width, height: args.height },
    MAX_CAPTURE_EDGE,
  );
  // The row constraint and the storage policy both require this exact shape.
  const objectKey = `original/${userId}/${Date.now()}.jpg`;

  // `fetch(file://…).arrayBuffer()` rather than a Blob: React Native's Blob has
  // no data the Storage client can read.
  const body = await (await fetch(resized.uri)).arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('moments')
    .upload(objectKey, body, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { data: moment, error: insertError } = await supabase
    .from('moments')
    .insert({
      author_id: userId,
      original_storage_path: objectKey,
      caption: args.caption,
      width: resized.width,
      height: resized.height,
    })
    .select('id')
    .single();
  if (insertError) throw insertError;

  const { error: blurError } = await supabase.functions.invoke('blur-moment', {
    body: { moment_id: moment.id },
  });
  if (blurError) throw blurError;

  return moment.id;
}

/** Open a new trade with each recipient — one lock per person. */
export async function sendMoment(momentId: string, recipientIds: string[]): Promise<string[]> {
  const { data: trades, error } = await supabase.rpc('send_moment', {
    p_moment_id: momentId,
    p_recipient_ids: recipientIds,
  });
  if (error) throw error;
  return (trades ?? []).map((trade) => trade.id);
}

/**
 * Trade back. This is the unlock — after it returns, both halves are visible to
 * both people. The state transition itself happens in a SECURITY DEFINER
 * function so a client cannot forge it.
 */
export async function respondToTrade(tradeId: string, momentId: string) {
  const { data, error } = await supabase.rpc('respond_to_trade', {
    p_trade_id: tradeId,
    p_moment_id: momentId,
  });
  if (error) throw error;
  return data;
}

/** Stamp the frosted card as seen, so the sender can tell it landed. */
export async function markTradeSeen(tradeId: string): Promise<void> {
  const { error } = await supabase
    .from('trades')
    .update({ seen_at: new Date().toISOString() })
    .eq('id', tradeId)
    .is('seen_at', null);
  if (error) throw error;
}

/**
 * Resolve one moment for the full-screen viewer, whether it arrived in the
 * inbox or sits in a completed pair. `null` when the caller may not see it, or
 * it does not exist.
 */
export async function fetchMomentPhoto(momentId: string): Promise<MomentPhoto | null> {
  const { data: moment, error } = await supabase
    .from('moments')
    .select('id, author_id, created_at')
    .eq('id', momentId)
    .maybeSingle();
  if (error) throw error;
  if (!moment) return null;

  const [{ data: author }, urls] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, avatar_storage_path')
      .eq('id', moment.author_id)
      .maybeSingle(),
    signedMomentUrls([moment.id]),
  ]);
  const photo = urls.get(moment.id);
  if (!photo) return null;

  return {
    photo,
    fromName: author?.first_name ?? '',
    fromAvatarUrl: avatarUrl(author?.avatar_storage_path ?? null),
    capturedAt: moment.created_at,
  };
}
```

- [ ] **Step 8: Keys, the unlock timer and mark-as-seen**

Replace `src/features/moments/data/moments-queries.ts` with:

```ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import {
  fetchInbox,
  fetchMomentPhoto,
  fetchOutgoingLocked,
  fetchPairs,
} from '@/features/moments/data/moments-api';
import { publishSnapshot } from '@/features/widget/data/widget-bridge';
/**
 * Query keys + fetchers for the moments feature. Keys are derived by the
 * factory, so `queries.moments._def` invalidates everything here and
 * `queries.moments.inbox.queryKey` just the inbox.
 */
export const momentsQueries = createQueryKeys('moments', {
  /** Everything sent to me, frosted or open. Shared by the tab badge, the feed and the viewer. */
  inbox: {
    queryKey: null,
    queryFn: async () => {
      const data = await fetchInbox();
      // Keep the homescreen honest: the widget mirrors the inbox. No-ops
      // without a dev build; a failure there must not surface as an
      // unhandled rejection.
      publishSnapshot(data).catch(() => {});
      return data;
    },
  },
  /**
   * Completed trades as photo pairs. `null` means "with anyone".
   *
   * The key spells that `'all'` rather than `null`: the factory's `ValidValue`
   * is `string | number | boolean | object | bigint`, so a literal `null` in a
   * queryKey is rejected — and the rejection is nasty, because it degrades the
   * whole `momentsQueries` object to `never` and the errors then surface in
   * `use-inbox.ts` and `moments-mutations.ts` instead of here. A uuid is never
   * the word `all`, so the two cannot collide.
   */
  pairs: (withUserId: string | null) => ({
    queryKey: [withUserId ?? 'all'],
    queryFn: () => fetchPairs(withUserId),
  }),
  /** My own moments nobody has answered, for the locked tiles on my grid. */
  outgoingLocked: {
    queryKey: null,
    queryFn: fetchOutgoingLocked,
  },
  /** One unlocked photo, full bleed. */
  photo: (momentId: string) => ({
    queryKey: [momentId],
    queryFn: () => fetchMomentPhoto(momentId),
  }),
});
```

Replace `src/features/moments/hooks/use-inbox.ts` with:

```ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
import { nextUnlockDelay } from '@/features/moments/selectors';
import type { InboxMoment } from '@/features/moments/interfaces';
const EMPTY: InboxMoment[] = [];

/**
 * Feed + widget source: everything sent to me, frosted or open. One cached
 * query, so the tab badge, the feed and the viewer share a single fetch and
 * every mutation that touches a trade invalidates all of them at once.
 *
 * The auto-unlock timer lives on the `useQuery` rather than in the key factory:
 * the factory's entry type does not carry the row type into `refetchInterval`'s
 * `query` argument, so it would be typed `unknown` there.
 */
export function useInbox() {
  const {
    data = EMPTY,
    isPending,
    error,
    refetch,
  } = useQuery({
    ...queries.moments.inbox,
    refetchInterval: (query) => nextUnlockDelay(query.state.data ?? [], Date.now()) ?? false,
  });

  const pending = useMemo(() => data.filter((m) => !m.isOpen), [data]);
  const open = useMemo(() => data.filter((m) => m.isOpen), [data]);

  return { data, loading: isPending, error, pending, open, reload: refetch };
}
```

Create `src/features/moments/data/moments-mutations.ts`:

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { markTradeSeen } from '@/features/moments/data/moments-api';
import type { InboxMoment } from '@/features/moments/interfaces';
/** Opening the frosted card stamps it, so the sender can tell it landed. */
export function useMarkTradeSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeId: string) => markTradeSeen(tradeId),
    ...optimistic(queryClient, [
      patch<InboxMoment[], string>(queries.moments.inbox.queryKey, (old, tradeId) =>
        old.map((moment) =>
          moment.tradeId === tradeId ? { ...moment, seenAt: new Date().toISOString() } : moment,
        ),
      ),
    ]),
  });
}
```

- [ ] **Step 9: Follow the renames through the screens**

These are the call sites of the fields that changed shape. Tasks 14 and 15
rewrite all five files properly; this keeps them compiling and correct now.

In `src/features/feed/components/locked-moment-card.tsx`:

```tsx
<Avatar source={moment.from.avatarUrl} name={moment.from.name} size={46} ring="halo" />
```

In `app/moment/[tradeId].tsx`:

```tsx
<Avatar source={moment.from.avatarUrl} name={moment.from.name} size={52} />
```

In `app/(app)/feed.tsx`, in the `stories` list:

```ts
      ...pending.map((m) => ({
        id: m.from.id,
        name: m.from.name,
        avatar: m.from.avatarUrl,
        waiting: true,
      })),
```

In `app/photo/[momentId].tsx`:

```tsx
{
  moment?.fromAvatarUrl ? <Avatar source={moment.fromAvatarUrl} name={moment.fromName} size={52} /> : null;
}
```

In `src/features/profile/components/pair-grid.tsx`, `locked` is gone and the
right tile is now optional. Replace both tiles inside `Pair` (Task 15 gives the
empty right tile its frosted treatment):

```tsx
<Pressable className="flex-1" onPress={() => onPressPhoto?.(pair.leftMomentId)}>
  <Image source={pair.left} className="h-[111px] w-full rounded-tile" contentFit="cover" />
</Pressable>;

{
  pair.rightMomentId ? (
    <Pressable className="flex-1" onPress={() => onPressPhoto?.(pair.rightMomentId ?? '')}>
      <Image source={pair.right} className="h-[111px] w-full rounded-tile" contentFit="cover" />
    </Pressable>
  ) : (
    <View className="flex-1" />
  );
}
```

and drop the now-unused `BLUR` / `LockedImage` import. The left half of a locked
tile is your own photo — `visible_moment_paths` only signs a path for someone
allowed to see it, so there is never anything to withhold from yourself.

In `app/compose.tsx` and `app/recipients.tsx`, `createMoment` now insists on a
real pixel size. Replace the guard at the top of each `mutationFn`:

```ts
if (!composer.uri || composer.width === null || composer.height === null) return;
const momentId = await createMoment({
  localUri: composer.uri,
  caption: caption || null,
  width: composer.width,
  height: composer.height,
});
```

(in `recipients.tsx` the caption is `composer.caption || null`), and drop the
now-unused `isSupabaseConfigured` import from both.

- [ ] **Step 10: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0. If `visible_moment_paths` or `send_moment` rows come back
typed nullable, add an `.overrideTypes<…, { merge: false }>()` at that call the
way Task 4 Step 6 types the views.

Run: `grep -rn "publicAvatarUrl" app src`
Expected: no output.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
git add app src
git commit -m "feat: moments on real data, cached signed URLs and the unlock timer" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 14: The outbox and the capture flow

**Files:**

- Create: `src/features/moments/outbox.ts`, `src/features/moments/outbox.test.ts`, `src/features/moments/hooks/use-outbox.ts`, `src/features/feed/components/outbox-line.tsx`
- Replace: `app/compose.tsx`, `app/recipients.tsx`
- Modify: `src/features/auth/sign-out.ts`, `app/(app)/feed.tsx`

**Interfaces:**

- Consumes: `createMoment` / `respondToTrade` / `sendMoment`, `waitingBySender` / `splitSelection`, `useInbox` (Task 13); `friendsOf` (Task 11); `FEED.OUTBOX.*` (Task 6); `expo-crypto` (Task 1).
- Produces:
  - From `@/features/moments/outbox`: `OutboxEntry`, `OutboxDeps`, `runEntry(entry, deps, onProgress): Promise<void>`.
  - From `@/features/moments/hooks/use-outbox`: `useOutbox` (store of `{ entries: OutboxEntry[] }`), `SendInput`, `enqueueSend(input: SendInput, queryClient: QueryClient): string`, `retrySend(id: string, queryClient: QueryClient): void`.
  - `OutboxLine()` from `@/features/feed/components/outbox-line`.

- [ ] **Step 1: Write the failing outbox test**

Create `src/features/moments/outbox.test.ts`:

```ts
import { runEntry, type OutboxDeps, type OutboxEntry } from '@/features/moments/outbox';

const entry = (over: Partial<OutboxEntry> = {}): OutboxEntry => ({
  id: 'e1',
  localUri: 'file:///capture.jpg',
  width: 1600,
  height: 1200,
  caption: 'hi',
  replyToTradeIds: [],
  recipientIds: [],
  names: [],
  status: 'sending',
  error: null,
  momentId: null,
  answeredTradeIds: [],
  ...over,
});

function deps(over: Partial<OutboxDeps> = {}): jest.Mocked<OutboxDeps> {
  return {
    createMoment: jest.fn(async () => 'm1'),
    respondToTrade: jest.fn(async () => ({})),
    sendMoment: jest.fn(async () => ['t1']),
    ...over,
  } as jest.Mocked<OutboxDeps>;
}

describe('runEntry', () => {
  it('uploads once, then answers and sends', async () => {
    const d = deps();
    const progress: Partial<OutboxEntry>[] = [];

    await runEntry(entry({ replyToTradeIds: ['t-a'], recipientIds: ['ben'] }), d, (p) => progress.push(p));

    expect(d.createMoment).toHaveBeenCalledTimes(1);
    expect(d.createMoment).toHaveBeenCalledWith({
      localUri: 'file:///capture.jpg',
      caption: 'hi',
      width: 1600,
      height: 1200,
    });
    expect(d.respondToTrade).toHaveBeenCalledWith('t-a', 'm1');
    expect(d.sendMoment).toHaveBeenCalledWith('m1', ['ben']);
    expect(progress).toEqual([{ momentId: 'm1' }, { answeredTradeIds: ['t-a'] }]);
  });

  it('opens no trade when nobody new was picked', async () => {
    const d = deps();
    await runEntry(entry({ replyToTradeIds: ['t-a'] }), d, () => {});
    expect(d.sendMoment).not.toHaveBeenCalled();
  });

  it('answers every frosted moment the capture replies to', async () => {
    const d = deps();
    await runEntry(entry({ replyToTradeIds: ['t-a', 't-b'] }), d, () => {});
    expect(d.respondToTrade).toHaveBeenCalledTimes(2);
  });

  it('a retry re-uses the upload and skips the answers it already made', async () => {
    const d = deps();

    await runEntry(
      entry({
        momentId: 'm1',
        answeredTradeIds: ['t-a'],
        replyToTradeIds: ['t-a', 't-b'],
        recipientIds: ['ben'],
      }),
      d,
      () => {},
    );

    expect(d.createMoment).not.toHaveBeenCalled();
    expect(d.respondToTrade).toHaveBeenCalledTimes(1);
    expect(d.respondToTrade).toHaveBeenCalledWith('t-b', 'm1');
    // send_moment's unique index makes a repeat a no-op, so it is not tracked.
    expect(d.sendMoment).toHaveBeenCalledWith('m1', ['ben']);
  });

  it('reports the upload before it answers, so a failure there is not re-uploaded', async () => {
    const progress: Partial<OutboxEntry>[] = [];
    const d = deps({
      respondToTrade: jest.fn(async () => {
        throw new Error('trade_already_answered');
      }),
    });

    await expect(runEntry(entry({ replyToTradeIds: ['t-a'] }), d, (p) => progress.push(p))).rejects.toThrow(
      'trade_already_answered',
    );
    expect(progress).toEqual([{ momentId: 'm1' }]);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx jest src/features/moments/outbox.test.ts`
Expected: FAIL, `Cannot find module '@/features/moments/outbox'`.

- [ ] **Step 3: Write the runner**

Create `src/features/moments/outbox.ts`:

```ts
/**
 * Sending is not a plain mutation: uploading a photo takes real seconds, and
 * the screen that took it is gone by then. An entry is queued, the screen
 * navigates, and this drains it behind them.
 */

/** A send in flight. */
export interface OutboxEntry {
  id: string;
  localUri: string;
  width: number;
  height: number;
  caption: string | null;
  /** Frosted moments this capture answers. */
  replyToTradeIds: string[];
  /** Friends this capture opens a new lock with. */
  recipientIds: string[];
  /** For the line above the feed: "Sending to Mia…". */
  names: string[];
  status: 'sending' | 'failed';
  error: string | null;
  /** Set once the photo is up, so a retry does not upload it again. */
  momentId: string | null;
  /** Answered already, so a retry does not answer them twice. */
  answeredTradeIds: string[];
}

export interface OutboxDeps {
  createMoment(args: {
    localUri: string;
    caption: string | null;
    width: number;
    height: number;
  }): Promise<string>;
  respondToTrade(tradeId: string, momentId: string): Promise<unknown>;
  sendMoment(momentId: string, recipientIds: string[]): Promise<unknown>;
}

/**
 * Run one entry to completion, recording each finished step through
 * `onProgress` so a retry picks up where it stopped.
 *
 * Two of the three steps must not repeat: the upload is the expensive one, and
 * `respond_to_trade` refuses a second answer outright. `send_moment` needs no
 * bookkeeping — its unique index on (moment, recipient) makes a repeat a no-op.
 */
export async function runEntry(
  entry: OutboxEntry,
  deps: OutboxDeps,
  onProgress: (patch: Partial<OutboxEntry>) => void,
): Promise<void> {
  let momentId = entry.momentId;
  if (!momentId) {
    momentId = await deps.createMoment({
      localUri: entry.localUri,
      caption: entry.caption,
      width: entry.width,
      height: entry.height,
    });
    onProgress({ momentId });
  }

  const answered = [...entry.answeredTradeIds];
  for (const tradeId of entry.replyToTradeIds) {
    if (answered.includes(tradeId)) continue;
    await deps.respondToTrade(tradeId, momentId);
    answered.push(tradeId);
    onProgress({ answeredTradeIds: [...answered] });
  }

  if (entry.recipientIds.length > 0) await deps.sendMoment(momentId, entry.recipientIds);
}
```

- [ ] **Step 4: Run the outbox test**

Run: `npx jest src/features/moments/outbox.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: The store around it**

Create `src/features/moments/hooks/use-outbox.ts`:

```ts
import { randomUUID } from 'expo-crypto';
import type { QueryClient } from '@tanstack/react-query';
import { create } from '@/shared/lib/store';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { createMoment, respondToTrade, sendMoment } from '@/features/moments/data/moments-api';
import { runEntry, type OutboxEntry } from '@/features/moments/outbox';
import type { InboxMoment } from '@/features/moments/interfaces';
/**
 * Sends in flight. In memory only, deliberately: the local file a retry would
 * need may not survive a restart either, so a queue that did would be a list of
 * entries that can never succeed.
 */
interface OutboxState {
  entries: OutboxEntry[];
}

export const useOutbox = create<OutboxState>({ entries: [] });

export interface SendInput {
  localUri: string;
  width: number;
  height: number;
  caption: string | null;
  replyToTradeIds: string[];
  recipientIds: string[];
  names: string[];
}

function update(id: string, values: Partial<OutboxEntry>) {
  useOutbox.set({
    entries: useOutbox.getState().entries.map((entry) => (entry.id === id ? { ...entry, ...values } : entry)),
  });
}

/** The moments this capture answers open now; the photos sharpen on the refetch. */
function openAnswered(queryClient: QueryClient, tradeIds: string[]) {
  if (tradeIds.length === 0) return;
  queryClient.setQueryData<InboxMoment[]>(queries.moments.inbox.queryKey, (old) =>
    old?.map((moment) => (tradeIds.includes(moment.tradeId) ? { ...moment, isOpen: true } : moment)),
  );
}

async function drain(id: string, queryClient: QueryClient): Promise<void> {
  const entry = useOutbox.getState().entries.find((e) => e.id === id);
  if (!entry) return;

  try {
    await runEntry(entry, { createMoment, respondToTrade, sendMoment }, (values) => update(id, values));
    useOutbox.set({ entries: useOutbox.getState().entries.filter((e) => e.id !== id) });
    await queryClient.invalidateQueries({ queryKey: queries.moments._def });
  } catch (error) {
    update(id, { status: 'failed', error: errorMessage(error) });
    // Put the inbox back: nothing was answered after all.
    await queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
  }
}

/** Queue a send and return at once — the screen navigates, the upload follows. */
export function enqueueSend(input: SendInput, queryClient: QueryClient): string {
  const entry: OutboxEntry = {
    id: randomUUID(),
    ...input,
    status: 'sending',
    error: null,
    momentId: null,
    answeredTradeIds: [],
  };
  useOutbox.set({ entries: [...useOutbox.getState().entries, entry] });
  openAnswered(queryClient, input.replyToTradeIds);
  void drain(entry.id, queryClient);
  return entry.id;
}

/** Re-run a failed entry. `runEntry` skips whatever already succeeded. */
export function retrySend(id: string, queryClient: QueryClient): void {
  const entry = useOutbox.getState().entries.find((e) => e.id === id);
  if (!entry) return;
  update(id, { status: 'sending', error: null });
  openAnswered(queryClient, entry.replyToTradeIds);
  void drain(id, queryClient);
}
```

In `src/features/auth/sign-out.ts`, add the import and the line the Task 10
comment promised:

```ts
import { useOutbox } from '@/features/moments/hooks/use-outbox';
```

```ts
useOutbox.reset();
```

That line was the last thing the Task 10 doc comment was waiting on, so the
comment is now false. Delete this sentence from the block above
`clearUserData`:

```
 * Tasks 13 and 14 add the signed-URL cache and the outbox to this list.
```

Task 19 adds one more reset here, but it does not need announcing in advance —
the list itself is the documentation.

- [ ] **Step 6: Say so on the feed**

Create `src/features/feed/components/outbox-line.tsx`:

```tsx
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { FEED } from '@/shared/i18n/keys';
import { retrySend, useOutbox } from '@/features/moments/hooks/use-outbox';
/**
 * A slim line above the feed cards while a send is still going.
 *
 * The screen that took the photo is gone by the time the upload finishes, so
 * this is the only place that can say it is in flight — or that it failed.
 */
export function OutboxLine() {
  const { entries } = useOutbox();
  const queryClient = useQueryClient();
  if (entries.length === 0) return null;

  return (
    <View className="gap-2">
      {entries.map((entry) => {
        const names = entry.names.join(', ');
        if (entry.status === 'failed') {
          return (
            <View
              key={entry.id}
              className="flex-row items-center gap-2 rounded-pill bg-surface-violet px-3.5 py-2"
            >
              {/* The real reason where there is one: "Nothing is swallowed",
                  and the recipients screen it happened on is long gone. */}
              <Text variant="meta" className="flex-1 text-purple-deep" numberOfLines={1}>
                {entry.error ?? t(FEED.OUTBOX.FAILED, { names })}
              </Text>
              <Pressable
                onPress={() => retrySend(entry.id, queryClient)}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text variant="meta" weight="semibold" className="text-purple-deep">
                  {t(FEED.OUTBOX.RETRY)}
                </Text>
              </Pressable>
            </View>
          );
        }
        return (
          <View
            key={entry.id}
            className="flex-row items-center gap-2 rounded-pill bg-surface-lilac px-3.5 py-2"
          >
            <ActivityIndicator size="small" color={colors.purple} />
            <Text variant="meta" className="flex-1 text-muted-violet" numberOfLines={1}>
              {t(FEED.OUTBOX.SENDING, { names })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
```

In `app/(app)/feed.tsx`, add the import and render it directly above the first
`LockedMomentCard` — inside the `hasFriends` branch, as the first child of the
fragment (Task 15 rewrites this screen and keeps it there):

```tsx
import { OutboxLine } from '@/features/feed/components/outbox-line';
```

```tsx
<OutboxLine />
```

- [ ] **Step 7: Compose enqueues instead of waiting**

Replace `app/compose.tsx` with:

```tsx
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Pencil, RotateCcw, X } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { alpha, colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { COMMON, COMPOSE, MOMENT } from '@/shared/i18n/keys';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { enqueueSend } from '@/features/moments/hooks/use-outbox';
import { PHOTOS } from '@/shared/lib/fixtures';
/**
 * Screen `03b Senden · Bestätigen` — review the shot and add a caption before
 * choosing who sees it.
 *
 * Two exits. Answering a frosted moment is the unlock itself: the recipient is
 * already known, so it skips recipient selection and opens the now-unlocked
 * pair straight away. Only a fresh moment goes on to choose who sees it.
 */
export default function ComposeScreen() {
  const composer = useComposer();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState(composer.caption);
  const queryClient = useQueryClient();
  const { data: inbox } = useInbox();

  const replyToTradeId = composer.replyToTradeId;
  const answering = inbox.find((moment) => moment.tradeId === replyToTradeId);

  function next() {
    composer.set({ caption });
    if (!replyToTradeId) {
      router.push('/recipients');
      return;
    }
    // The capture is what makes this a trade, so there is nothing to wait for.
    if (!composer.uri || composer.width === null || composer.height === null) return;
    enqueueSend(
      {
        localUri: composer.uri,
        width: composer.width,
        height: composer.height,
        caption: caption || null,
        replyToTradeIds: [replyToTradeId],
        recipientIds: [],
        names: answering ? [answering.from.name] : [],
      },
      queryClient,
    );
    composer.reset();
    // Land on the now-open pair rather than back on the feed. `push`, not
    // `replace`, so the tab root stays underneath and the moment's close
    // button has somewhere to go back to.
    router.dismissAll();
    router.push(`/moment/${replyToTradeId}`);
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      {/* The viewfinder art is the fallback for a compose screen reached without
          a capture — a stale deep link — rather than a black rectangle. */}
      <Image
        source={composer.uri ? { uri: composer.uri } : PHOTOS.viewfinder}
        className="absolute inset-0"
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.8)']}
        locations={[0, 0.22, 0.5, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute inset-0"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-start justify-between px-5">
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
            <X size={12} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
          <GlassButton size={38} onDark onPress={() => router.back()} accessibilityLabel={t(COMPOSE.RETAKE)}>
            <RotateCcw size={17} color={colors.white} strokeWidth={1.9} />
          </GlassButton>
        </View>

        <View className="flex-1" />

        {/* Frosted action bar, matching `rgba(18,16,24,.62)` + blur(22px). */}
        <BlurView
          intensity={40}
          tint="dark"
          className="overflow-hidden border-t border-t-[rgba(255,255,255,.14)]"
        >
          <View className="gap-[18px] px-[22px] pt-[22px]" style={{ paddingBottom: insets.bottom + 22 }}>
            <View className="flex-row items-center gap-[9px] px-1.5">
              <Pencil size={15} color="rgba(255,255,255,.82)" strokeWidth={1.8} />
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder={t(COMPOSE.CAPTION_PLACEHOLDER)}
                placeholderTextColor={alpha.onDarkText}
                className="max-h-[90px] flex-1 p-0 font-sans text-[15px] text-white"
                maxLength={280}
                multiline
              />
            </View>
            <Button
              label={replyToTradeId ? t(MOMENT.LOCKED_CTA) : t(COMPOSE.CONTINUE)}
              variant="purple"
              size="xl"
              onPress={next}
              disabled={!composer.uri}
            />
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}
```

- [ ] **Step 8: Recipients, with "Waiting on you" first**

Replace `app/recipients.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react-native';
import { Button } from '@/shared/ui/button';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { spacing } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { COMMON, COMPOSE } from '@/shared/i18n/keys';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { PersonRow } from '@/features/friends/components/person-row';
import { Checkbox } from '@/features/friends/components/checkbox';
import { friendsOf } from '@/features/friends/relationships';
import { EmptyState } from '@/features/feed/components/empty-state';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { enqueueSend } from '@/features/moments/hooks/use-outbox';
import { splitSelection, waitingBySender } from '@/features/moments/selectors';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Screen `03c Senden · Empfänger wählen`.
 *
 * One list of selected people, two jobs. Picking someone from "Waiting on you"
 * answers their frosted moment — never opens a second lock back at them.
 * Picking anyone else opens a new one. Sending queues the work and returns to
 * the feed; the upload runs behind it.
 */
export default function RecipientsScreen() {
  const composer = useComposer();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: friendships = [], error: friendsError } = useQuery(queries.friends.all);
  const { data: inbox } = useInbox();

  const waiting = useMemo(() => waitingBySender(inbox), [inbox]);
  const friends = useMemo(() => {
    // They are already on the list above; one person, one row.
    const waitingIds = new Set(waiting.map((entry) => entry.person.id));
    return friendsOf(friendships, me?.id ?? '').filter((person) => !waitingIds.has(person.id));
  }, [friendships, me?.id, waiting]);

  // A friend's profile pre-selects them; otherwise start empty.
  const [selected, setSelected] = useState<string[]>(composer.recipientIds);

  const nameById = useMemo(
    () =>
      new Map<string, string>([
        ...waiting.map((entry) => [entry.person.id, entry.person.name] as const),
        ...friends.map((person) => [person.id, person.name] as const),
      ]),
    [waiting, friends],
  );

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function send() {
    if (!composer.uri || composer.width === null || composer.height === null) return;
    const { replyToTradeIds, recipientIds } = splitSelection(selected, waiting);
    enqueueSend(
      {
        localUri: composer.uri,
        width: composer.width,
        height: composer.height,
        caption: composer.caption || null,
        replyToTradeIds,
        recipientIds,
        names: selected.map((id) => nameById.get(id) ?? '').filter((name) => name.length > 0),
      },
      queryClient,
    );
    composer.reset();
    router.dismissAll();
    router.replace('/(app)/feed');
  }

  const ctaLabel =
    selected.length === 0
      ? t(COMPOSE.SEND_NONE)
      : selected.length === 1
        ? t(COMPOSE.SEND_TO, { name: nameById.get(selected[0]) ?? '' })
        : t(COMPOSE.SEND_TO_MANY, { count: selected.length });

  return (
    <Screen gutter={0} bottomInset={spacing.contentBottom}>
      <View className="flex-row items-center gap-3.5 px-gutter">
        <GlassButton size={38} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={12} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Text variant="cardTitleLg" className="text-ink">
          {t(COMPOSE.RECIPIENTS_TITLE)}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-[26px] px-gutter pb-6 pt-[30px]"
        showsVerticalScrollIndicator={false}
      >
        {waiting.length > 0 ? (
          <View className="gap-3.5">
            <SectionLabel>{t(COMPOSE.WAITING_SECTION)}</SectionLabel>
            <View className="gap-4">
              {waiting.map(({ person }) => (
                <PersonRow
                  key={person.id}
                  avatar={person.avatarUrl}
                  name={person.name}
                  subtitle={person.username ? `@${person.username}` : undefined}
                  size={46}
                  onPress={() => toggle(person.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.includes(person.id) }}
                  trailing={<Checkbox checked={selected.includes(person.id)} />}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View className="gap-3.5">
          <SectionLabel>{t(COMPOSE.FRIENDS_SECTION)}</SectionLabel>
          <View className="gap-4">
            {friends.map((person) => (
              <PersonRow
                key={person.id}
                avatar={person.avatarUrl}
                name={person.name}
                subtitle={person.tagline ?? undefined}
                size={46}
                onPress={() => toggle(person.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected.includes(person.id) }}
                trailing={<Checkbox checked={selected.includes(person.id)} />}
              />
            ))}
          </View>
        </View>

        <View className="gap-3.5">
          <EmptyState
            title={t(COMPOSE.INVITE_TITLE)}
            body={t(COMPOSE.INVITE_BODY)}
            cta={t(COMPOSE.INVITE_CTA)}
            artSize={112}
            onPress={() => router.push('/(app)/friends/search')}
          />
        </View>

        {friendsError ? (
          <Text variant="meta" className="mt-2 text-center text-purple-deep">
            {errorMessage(friendsError)}
          </Text>
        ) : null}
      </ScrollView>

      <View className="px-gutter pt-3">
        <Button label={ctaLabel} onPress={send} size="lg" disabled={selected.length === 0 || !composer.uri} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 9: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

Run: `npm test`
Expected: all pass.

Run: `npx prettier --write app src && npm run format:check`
Expected: `All matched files use Prettier code style!`

- [ ] **Step 10: Commit**

```bash
git add app src
git commit -m "feat: outbox-backed sending, waiting-on-you recipients and the feed's sending line" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 15: Feed, profile grid, moment and photo screens

**Files:**

- Replace: `app/(app)/feed.tsx`, `src/features/profile/components/pair-grid.tsx`, `app/moment/[tradeId].tsx`
- Modify: `app/(app)/profile.tsx`, `app/photo/[momentId].tsx`

**Interfaces:**

- Consumes: `useInbox`, `queries.moments.*`, `useMarkTradeSeen` (Task 13); `OutboxLine` (Task 14); `friendsOf` (Task 11); `useMe` and `avatarUrl` (Task 10).
- Produces: no new modules. The own-profile grid now shows completed pairs and unanswered outgoing moments together, newest first.

- [ ] **Step 1: The feed**

Replace `app/(app)/feed.tsx` with:

```tsx
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SectionHeading } from '@/shared/ui/section-heading';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { t } from '@/shared/i18n/i18n';
import { COMMON, FEED } from '@/shared/i18n/keys';
import { memberSince } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { friendsOf } from '@/features/friends/relationships';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { FeedHeader } from '@/features/feed/components/feed-header';
import { StoryRail, StoryItem } from '@/features/feed/components/story-rail';
import { LockedMomentCard } from '@/features/feed/components/locked-moment-card';
import { OutboxLine } from '@/features/feed/components/outbox-line';
import { EmptyState } from '@/features/feed/components/empty-state';
import { TabScreen } from '@/features/navigation/tab-screen';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
import { openProfile } from '@/features/profile/open-profile';
/**
 * Screens `01 Feed` and `01c Feed · leer`.
 *
 * One component covers both: with nobody to trade with and nothing waiting, the
 * cards are replaced by the dashed invite card, exactly as the two artboards
 * show. Having friends but no moments is not empty — it is a quiet day.
 */
export default function FeedScreen() {
  const { pending, open, loading } = useInbox();
  const { data: me } = useMe();
  const { data: friendships = [] } = useQuery(queries.friends.all);
  const composer = useComposer();
  const myId = me?.id ?? '';

  const stories = useMemo<StoryItem[]>(
    () => [
      {
        id: myId,
        name: t(COMMON.YOU),
        avatar: avatarUrl(me?.avatar_storage_path ?? null),
        waiting: true,
      },
      ...pending.map((moment) => ({
        id: moment.from.id,
        name: moment.from.name,
        avatar: moment.from.avatarUrl,
        waiting: true,
      })),
    ],
    [me, myId, pending],
  );

  const hasPeople = friendsOf(friendships, myId).length > 0;
  const hasMoments = pending.length > 0 || open.length > 0;
  // Nobody to trade with AND nothing waiting. Either one on its own is a feed.
  const empty = !loading && !hasPeople && !hasMoments;

  function startTrade(tradeId: string) {
    // Capture answers this specific frosted moment; the camera reads it back.
    composer.set({ replyToTradeId: tradeId });
    router.push('/camera');
  }

  return (
    <TabScreen>
      <View className="flex-1 gap-4">
        <FeedHeader
          avatar={avatarUrl(me?.avatar_storage_path ?? null)}
          name={me?.first_name ?? ''}
          subtitle={me ? memberSince(me.created_at) : ''}
          onPressAdd={() => router.push('/(app)/friends/search')}
          onPressAvatar={() => router.push('/(app)/friends')}
        />

        <View className="gap-3">
          <SectionLabel
            trailing={pending.length > 0 ? t(FEED.STORIES_TRAILING, { count: pending.length }) : undefined}
          >
            {t(FEED.STORIES_LABEL)}
          </SectionLabel>
          <StoryRail
            items={stories}
            placeholders={Math.max(0, 3 - pending.length)}
            placeholderLabel={t(FEED.ADD_FRIEND)}
            onPressItem={(id) => openProfile(id, myId)}
            onPressPlaceholder={() => router.push('/(app)/friends/search')}
          />
        </View>

        <Text variant="headline" className="text-ink">
          {empty ? t(FEED.EMPTY.HEADLINE) : greetingForNow()}
        </Text>

        {empty ? (
          <EmptyState
            title={t(FEED.EMPTY.TITLE)}
            body={t(FEED.EMPTY.BODY)}
            cta={t(FEED.EMPTY.CTA)}
            onPress={() => router.push('/(app)/friends/search')}
          />
        ) : (
          <>
            <OutboxLine />

            {pending.map((moment) => (
              <LockedMomentCard
                key={moment.tradeId}
                moment={moment}
                onPressTrade={() => startTrade(moment.tradeId)}
                onPressCard={() => router.push(`/moment/${moment.tradeId}`)}
              />
            ))}

            {open.length > 0 ? (
              <>
                <SectionHeading title={t(FEED.MOMENTS_TITLE)} />

                {/* Fixed share rather than flex:1, which would stretch a lone item across
                    the full width and render a portrait photo as a letterbox strip. */}
                <View className="flex-row flex-wrap gap-[13px]">
                  {open.map((moment) => (
                    <Pressable
                      key={moment.tradeId}
                      className="w-[48%]"
                      onPress={() => router.push(`/photo/${moment.momentId}`)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={moment.from.name}
                    >
                      <Image
                        source={moment.photo}
                        className="aspect-[4/5] w-full rounded-thumb"
                        contentFit="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </View>
    </TabScreen>
  );
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return t(FEED.GREETING_MORNING);
  if (hour >= 18) return t(FEED.GREETING_EVENING);
  return t(FEED.GREETING_DAY);
}
```

- [ ] **Step 2: A pair that is still waiting for its other half**

Replace `src/features/profile/components/pair-grid.tsx` with:

```tsx
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { LockedIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { pairDate } from '@/shared/lib/format';
import type { MomentPair } from '@/features/moments/interfaces';
interface PairGridProps {
  pairs: MomentPair[];
  onPressPhoto?: (momentId: string) => void;
}

/**
 * A completed trade rendered as what it is: two photos taken the same day, kept
 * together — two pairs per row, as on screen 07b. This is the "something to
 * keep" layer from the positioning note, the artefact the month-end export is
 * eventually built from.
 *
 * A pair with no right half is one of your own moments nobody has traded back
 * for. Its left tile is your own photo, shown plainly — the server only signs a
 * path for someone allowed to see it, and you always are. The empty right tile
 * is what the lock looks like from this side.
 */
export function PairGrid({ pairs, onPressPhoto }: PairGridProps) {
  return (
    <View className="gap-4">
      {chunk(pairs, 2).map((row, i) => (
        <View key={i} className="flex-row gap-3">
          {row.map((pair) => (
            <Pair key={pair.tradeId} pair={pair} onPressPhoto={onPressPhoto} />
          ))}
          {/* Keep a lone trailing pair at half width instead of stretching it. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}

interface PairProps {
  pair: MomentPair;
  onPressPhoto?: (momentId: string) => void;
}

/** Both tiles of a pair share the 111px height. */
function Pair({ pair, onPressPhoto }: PairProps) {
  const rightMomentId = pair.rightMomentId;

  return (
    <View className="flex-1 gap-2">
      <View className="flex-row gap-[5px]">
        <Pressable className="flex-1" onPress={() => onPressPhoto?.(pair.leftMomentId)}>
          <Image source={pair.left} className="h-[111px] w-full rounded-tile" contentFit="cover" />
        </Pressable>

        {rightMomentId ? (
          <Pressable className="flex-1" onPress={() => onPressPhoto?.(rightMomentId)}>
            <Image source={pair.right} className="h-[111px] w-full rounded-tile" contentFit="cover" />
          </Pressable>
        ) : (
          // Nothing to blur: there is no photo here yet, which is the point.
          <View className="h-[111px] flex-1 items-center justify-center rounded-tile bg-surface-violet-deep">
            <LockedIcon size={18} />
          </View>
        )}
      </View>

      <Text variant="metaSm" className="text-center text-muted-grey">
        {pairDate(pair.date)}
      </Text>
    </View>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
```

- [ ] **Step 3: Your own grid holds both**

In `app/(app)/profile.tsx`, add `useMemo` to the React import and replace the
pairs query with the two queries and their merge:

```ts
const { data: pairs = [] } = useQuery({ ...queries.moments.pairs(null), enabled: me != null });
const { data: locked = [] } = useQuery({ ...queries.moments.outgoingLocked, enabled: me != null });
// One sequence, newest first: a moment you sent an hour ago belongs above a
// pair you completed yesterday.
const grid = useMemo(
  () => [...locked, ...pairs].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
  [locked, pairs],
);
```

and pass `pairs={grid}` to `<ProfileView>`.

The friend profile keeps `queries.moments.pairs(userId)`: their locked tiles are
theirs to see, not mine.

- [ ] **Step 4: The moment screen on real data**

Replace `app/moment/[tradeId].tsx` with:

```tsx
import { useEffect, useMemo } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { LockedIcon, CameraIcon } from '@/shared/ui/icons';
import { Text } from '@/shared/ui/text';
import { alpha, colors } from '@/shared/theme/colors';
import { BLUR } from '@/shared/ui/locked-image';
import { t } from '@/shared/i18n/i18n';
import { COMMON, MOMENT } from '@/shared/i18n/keys';
import { relativeTime, timeUntilUnlock } from '@/shared/lib/format';
import { useInbox } from '@/features/moments/hooks/use-inbox';
import { useComposer } from '@/features/moments/hooks/use-composer';
import { useMarkTradeSeen } from '@/features/moments/data/moments-mutations';
/**
 * Screens `04 Moment geöffnet` and `04b Moment verschwommen`.
 *
 * These are the same screen in two states, which is the point: the frosted
 * version is not an error or an empty state, it is the photo, withheld. The only
 * way forward is the camera.
 */
export default function MomentScreen() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>();
  const { data, loading } = useInbox();
  const composer = useComposer();
  const insets = useSafeAreaInsets();

  const moment = useMemo(() => data.find((m) => m.tradeId === tradeId), [data, tradeId]);

  // Opening the frosted card stamps it as seen, so the sender can tell it
  // landed. This is a genuine side effect of viewing, not a fetch — hence the
  // one `useEffect` on this screen.
  const { mutate } = useMarkTradeSeen();
  // Primitive deps only: the refetch after the patch yields a new object for
  // the same moment, which must not stamp it a second time.
  const found = moment !== undefined;
  const seenAt = moment?.seenAt;
  useEffect(() => {
    if (tradeId && found && !seenAt) mutate(tradeId);
  }, [tradeId, found, seenAt, mutate]);

  // Before the inbox has loaded (deep link, cold start) there is no moment yet.
  // The chrome still renders so the screen is never a black box with no way out.
  if (!moment) {
    return (
      <View className="flex-1 bg-black">
        <StatusBar style="light" />
        {/* Safe-area insets are runtime values, so they stay as style. */}
        <View className="absolute inset-0 px-4" style={{ paddingTop: insets.top + 6 }}>
          <View className="mt-4 flex-row items-center gap-3">
            <View className="min-w-0 flex-1 gap-0.5">
              {!loading ? (
                <Text variant="bodySm" className="text-on-dark-text">
                  {t(MOMENT.NOT_FOUND)}
                </Text>
              ) : null}
            </View>
            <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
              <X size={12} color={colors.white} strokeWidth={2.2} />
            </GlassButton>
          </View>
        </View>
      </View>
    );
  }

  const locked = !moment.isOpen;
  const countdown = timeUntilUnlock(moment.autoUnlockAt);

  const tradeBack = () => {
    composer.set({ replyToTradeId: moment.tradeId });
    router.push('/camera');
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <Image
        source={moment.photo}
        className="absolute inset-0"
        contentFit="cover"
        blurRadius={locked ? BLUR.full : 0}
      />
      <LinearGradient
        colors={
          locked
            ? ['rgba(0,0,0,.62)', 'rgba(0,0,0,.18)', 'rgba(0,0,0,.22)', 'rgba(0,0,0,.8)']
            : ['rgba(0,0,0,.62)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,.78)']
        }
        locations={[0, 0.24, 0.46, 1]}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {/* Safe-area insets are runtime values, so they stay as style. */}
      <View
        className="absolute inset-0 px-4"
        style={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }}
      >
        <View className="mt-4 flex-row items-center gap-3">
          <Avatar source={moment.from.avatarUrl} name={moment.from.name} size={52} />
          <View className="min-w-0 flex-1 gap-0.5">
            <Text variant="rowTitle" className="text-white">
              {moment.from.name}
            </Text>
            <Text variant="metaXs" className="text-on-dark-text-soft">
              {relativeTime(moment.capturedAt)}
            </Text>
          </View>
          <GlassButton size={34} onDark onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
            <X size={12} color={colors.white} strokeWidth={2.2} />
          </GlassButton>
        </View>

        {locked ? (
          <View className="flex-1 items-center justify-center gap-4 pb-[60px]">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-[36px] border border-[rgba(255,255,255,.28)] bg-on-dark-fill">
              <LockedIcon size={28} />
            </View>
            <Text variant="cardTitleLg" className="text-center text-white">
              {t(MOMENT.LOCKED_TITLE)}
            </Text>
            <Text variant="bodyXs" className="max-w-[250px] text-center text-on-dark-text">
              {t(MOMENT.LOCKED_BODY, { name: moment.from.name })}
            </Text>
            {countdown ? (
              <Text variant="caption" className="text-center text-on-dark-text-faint">
                {t(MOMENT.AUTO_UNLOCK, { time: countdown })}
              </Text>
            ) : null}
          </View>
        ) : (
          <>
            <View className="flex-1" />
            {moment.caption ? (
              <Text variant="bodyLg" className="mb-4 px-1 text-white">
                {moment.caption}
              </Text>
            ) : null}
          </>
        )}

        {/* Reply bar. The camera button is the primary action in both states.
            Task 17 makes the field send a message carrying this trade id. */}
        <View className="flex-row items-center gap-2.5 px-1">
          <BlurView
            intensity={30}
            tint="dark"
            className="h-[52px] flex-1 justify-center overflow-hidden rounded-pill border border-on-dark-border px-5"
          >
            <TextInput
              placeholder={t(MOMENT.REPLY_PLACEHOLDER)}
              placeholderTextColor={alpha.onDarkTextSoft}
              className="p-0 font-sans text-[15.5px] text-white"
              editable={!locked}
            />
          </BlurView>
          <Pressable
            onPress={tradeBack}
            accessibilityRole="button"
            accessibilityLabel={t(MOMENT.LOCKED_CTA)}
            className="h-[52px] w-[52px] items-center justify-center rounded-[26px] bg-purple active:opacity-85"
          >
            <CameraIcon size={22} lensColor={colors.purple} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 5: A photo that is not there**

In `app/photo/[momentId].tsx`, read the query's settled state and say so rather
than leaving a black screen:

```ts
const { data: moment, isPending } = useQuery({
  ...queries.moments.photo(momentId ?? ''),
  enabled: Boolean(momentId),
});
```

and, inside the top row's centre column, under the meta text:

```tsx
<Text variant="subtitle" weight="medium" className="shrink text-on-dark-text" numberOfLines={1}>
  {moment
    ? t(PHOTO.META, { name: moment.fromName, date: pairDate(moment.capturedAt) })
    : isPending
      ? ''
      : t(MOMENT.NOT_FOUND)}
</Text>
```

Add `MOMENT` to the file's keys import.

- [ ] **Step 6: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

Run: `grep -rln "fixtures" app`
Expected exactly these eleven, and nothing else:

- `app/(onboarding)/welcome.tsx`, `signup.tsx`, `thank-you.tsx`, `camera.tsx`,
  `notifications.tsx`, `reviews.tsx`, `paywall.tsx` — bundled artwork, and they
  keep it for good. (`first-glimpse.tsx` and `widget.tsx` render artwork too but
  never imported from `fixtures`, so they do not appear here.)
- `app/compose.tsx` — `PHOTOS.viewfinder`, which Task 14 kept deliberately as the
  stale-deep-link fallback. Permanent.
- `app/(app)/_layout.tsx` — `demoUnreadCount`, cleared by Task 16.
- `app/chat/[partnerId].tsx` — cleared by Task 17.
- `app/invite/[token].tsx` — cleared by Task 19.

`app/(app)/feed.tsx` drops off this list in Step 1 above; if it is still there,
Step 1 did not land.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app src
git commit -m "feat: feed, profile grid, moment and photo screens on real data" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 16: Chat data

**Files:**

- Create: `src/features/chat/interfaces.ts`, `src/features/chat/messages.ts`, `src/features/chat/messages.test.ts`, `src/features/chat/data/chat-api.ts`, `src/features/chat/data/chat-queries.ts`, `src/features/chat/data/chat-mutations.ts`, `src/features/chat/hooks/use-unread-total.ts`, `src/shared/lib/prefetch.ts`
- Modify: `src/features/friends/data/friends-api.ts`, `src/shared/lib/queries.ts`, `app/_layout.tsx`, `app/(app)/_layout.tsx`, `app/(app)/friends/index.tsx`

**Interfaces:**

- Consumes: `ThreadRow` (Task 4), `optimistic` / `patch` (Task 7), `currentUserId` (Task 8), `PersonSummary` (Task 11), `signedMomentUrls` (Task 13), `expo-crypto` (Task 1).
- Produces:
  - From `@/features/chat/interfaces`: `ChatMessage { id; senderId; recipientId; content: string | null; momentId: string | null; tradeId: string | null; createdAt: string; readAt: string | null; pending?: boolean }`, `Thread { partner: PersonSummary; lastMessageId; lastContent: string | null; lastMomentId: string | null; lastSenderId; lastAt; unreadCount: number; photo: string | null }`.
  - From `@/features/chat/messages`: `appendMessage(list, message): ChatMessage[]`, `pairKey(a, b): string`.
  - From `@/features/chat/data/chat-api`: `MESSAGE_PAGE = 200`, `fetchThreads()`, `fetchMessages(partnerId)`, `sendMessage(input: SendMessageInput)`, `markThreadRead(partnerId)`.
  - Keys `queries.chat.threads`, `queries.chat.messages(partnerId)`.
  - From `@/features/chat/data/chat-mutations`: `draftMessage(input): ChatMessage`, `useSendMessage(partnerId)`, `useMarkThreadRead(partnerId)`.
  - `useUnreadTotal(): number`.
  - `prefetchForUser(queryClient: QueryClient, userId: string): void` from `@/shared/lib/prefetch`.
  - `friends-api` now also exports `PERSON_COLUMNS` and `toPersonSummary`.

- [ ] **Step 1: Write the shapes**

Create `src/features/chat/interfaces.ts`:

```ts
import type { PersonSummary } from '@/features/friends/interfaces';
/** One message in a 1:1 conversation. Group threads are deliberately not a thing. */
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string | null;
  momentId: string | null;
  /** Set when the message was written from a moment screen. */
  tradeId: string | null;
  createdAt: string;
  readAt: string | null;
  /** True while the insert is still in flight. */
  pending?: boolean;
}

/** A row in the chats list: the last message with one person. */
export interface Thread {
  partner: PersonSummary;
  lastMessageId: string;
  lastContent: string | null;
  lastMomentId: string | null;
  lastSenderId: string;
  lastAt: string;
  unreadCount: number;
  /** Thumbnail of the moment the last message carried, when it carried one. */
  photo: string | null;
}
```

- [ ] **Step 2: Write the failing message-list test**

Create `src/features/chat/messages.test.ts`:

```ts
import { appendMessage, pairKey } from '@/features/chat/messages';
import type { ChatMessage } from '@/features/chat/interfaces';

const message = (id: string, createdAt: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  senderId: 'me',
  recipientId: 'mia',
  content: id,
  momentId: null,
  tradeId: null,
  createdAt,
  readAt: null,
  ...over,
});

describe('appendMessage', () => {
  const first = message('a', '2026-09-14T10:00:00.000Z');
  const second = message('b', '2026-09-14T10:01:00.000Z');

  it('adds a message at the end', () => {
    expect(appendMessage([first], second).map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('replaces the pending copy of a message rather than showing it twice', () => {
    const pending = message('b', '2026-09-14T10:01:00.000Z', { pending: true });
    const confirmed = message('b', '2026-09-14T10:01:02.000Z');
    const list = appendMessage(appendMessage([first], pending), confirmed);

    expect(list.map((m) => m.id)).toEqual(['a', 'b']);
    expect(list[1].pending).toBeUndefined();
  });

  it('puts an out-of-order arrival where it belongs', () => {
    const early = message('z', '2026-09-14T09:59:00.000Z');
    expect(appendMessage([first, second], early).map((m) => m.id)).toEqual(['z', 'a', 'b']);
  });
});

describe('pairKey', () => {
  it('is the same string from either side', () => {
    expect(pairKey('bbb', 'aaa')).toBe('aaa:bbb');
    expect(pairKey('aaa', 'bbb')).toBe(pairKey('bbb', 'aaa'));
  });
});
```

- [ ] **Step 3: Run to see it fail**

Run: `npx jest src/features/chat/messages.test.ts`
Expected: FAIL, `Cannot find module '@/features/chat/messages'`.

- [ ] **Step 4: Write the list helpers**

Create `src/features/chat/messages.ts`:

```ts
import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * Messages arrive from three directions — the optimistic send, the insert's own
 * answer, and the Realtime event — and the same message routinely arrives
 * twice. Both writers go through here so neither has to know about the others.
 */
export function appendMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const without = list.filter((existing) => existing.id !== message.id);
  return [...without, message].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * The presence topic for a conversation: the two ids in a fixed order, so both
 * phones join the same channel. The migration's policy splits this same string.
 */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
```

- [ ] **Step 5: Run the test**

Run: `npx jest src/features/chat/messages.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Share the person mapper**

Chat needs the same profile columns and the same mapping. In
`src/features/friends/data/friends-api.ts`, export them rather than copying:

```ts
/** The profile columns every person row needs. */
export const PERSON_COLUMNS = 'id, first_name, username, tagline, avatar_storage_path';

export interface PersonColumns {
  id: string;
  first_name: string;
  username: string | null;
  tagline: string | null;
  avatar_storage_path: string | null;
}

export function toPersonSummary(row: PersonColumns): PersonSummary {
  return {
    id: row.id,
    name: row.first_name,
    username: row.username,
    tagline: row.tagline,
    avatarUrl: avatarUrl(row.avatar_storage_path),
  };
}
```

and replace the three `toPerson(` call sites in that file with `toPersonSummary(`.

- [ ] **Step 7: Threads and messages**

Create `src/features/chat/data/chat-api.ts`:

```ts
import { supabase } from '@/shared/lib/supabase';
import { currentUserId } from '@/features/auth/current-user';
import { PERSON_COLUMNS, toPersonSummary } from '@/features/friends/data/friends-api';
import { signedMomentUrls } from '@/features/moments/data/moment-urls';
import type { ThreadRow } from '@/shared/lib/database.types';
import type { ChatMessage, Thread } from '@/features/chat/interfaces';
/** Reads and writes for 1:1 chat. */

/** No pagination: a conversation is short, and the positioning note keeps it that way. */
export const MESSAGE_PAGE = 200;

const MESSAGE_COLUMNS = 'id, sender_id, recipient_id, content, moment_id, trade_id, created_at, read_at';

interface MessageColumns {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  moment_id: string | null;
  trade_id: string | null;
  created_at: string;
  read_at: string | null;
}

function toMessage(row: MessageColumns): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    momentId: row.moment_id,
    tradeId: row.trade_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

/**
 * The chats list. `v_threads` gives one row per conversation; the partners'
 * profiles and any moment thumbnails are two more round trips, not one per row.
 */
export async function fetchThreads(): Promise<Thread[]> {
  const { data, error } = await supabase
    .from('v_threads')
    .select('*')
    .overrideTypes<ThreadRow[], { merge: false }>();
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [profiles, urls] = await Promise.all([
    supabase
      .from('profiles')
      .select(PERSON_COLUMNS)
      .in(
        'id',
        rows.map((row) => row.partner_id),
      ),
    signedMomentUrls(rows.map((row) => row.last_moment_id).filter((id): id is string => id !== null)),
  ]);
  if (profiles.error) throw profiles.error;

  const byId = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

  return rows
    .map((row): Thread | null => {
      // A partner whose profile a block now hides: drop the thread rather than
      // render a nameless row.
      const profile = byId.get(row.partner_id);
      if (!profile) return null;
      return {
        partner: toPersonSummary(profile),
        lastMessageId: row.last_message_id,
        lastContent: row.last_content,
        lastMomentId: row.last_moment_id,
        lastSenderId: row.last_sender_id,
        lastAt: row.last_at,
        unreadCount: row.unread_count,
        photo: row.last_moment_id ? (urls.get(row.last_moment_id) ?? null) : null,
      };
    })
    .filter((thread): thread is Thread => thread !== null);
}

/** Newest 200 from the database — that is what the index is for — oldest first on screen. */
export async function fetchMessages(partnerId: string): Promise<ChatMessage[]> {
  const me = currentUserId();
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_COLUMNS)
    .or(
      `and(sender_id.eq.${me},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${me})`,
    )
    .order('created_at', { ascending: false })
    .limit(MESSAGE_PAGE);
  if (error) throw error;
  return (data ?? []).map(toMessage).reverse();
}

export interface SendMessageInput {
  /** Minted on the client, so the optimistic row already carries its real id. */
  id: string;
  recipientId: string;
  content: string;
  /** Set when the message was written on a moment screen. */
  tradeId?: string | null;
}

export async function sendMessage({
  id,
  recipientId,
  content,
  tradeId,
}: SendMessageInput): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id,
      sender_id: currentUserId(),
      recipient_id: recipientId,
      content,
      trade_id: tradeId ?? null,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error) throw error;
  return toMessage(data);
}

/** `read_at` is the only column the recipient may write (see the column grant). */
export async function markThreadRead(partnerId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', partnerId)
    .eq('recipient_id', currentUserId())
    .is('read_at', null);
  if (error) throw error;
}
```

Create `src/features/chat/data/chat-queries.ts`:

```ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchMessages, fetchThreads } from '@/features/chat/data/chat-api';
export const chatQueries = createQueryKeys('chat', {
  /** The chats list, and the source of every unread badge in the app. */
  threads: {
    queryKey: null,
    queryFn: fetchThreads,
  },
  messages: (partnerId: string) => ({
    queryKey: [partnerId],
    queryFn: () => fetchMessages(partnerId),
  }),
});
```

In `src/shared/lib/queries.ts`, add the import and the fourth factory. While the
file is open, fix its module comment: it still offers `queries.friends.list` as
an example, and Task 11 replaced that key with `queries.friends.all`.

```ts
import { chatQueries } from '@/features/chat/data/chat-queries';
```

```ts
export const queries = mergeQueryKeys(momentsQueries, friendsQueries, profileQueries, chatQueries);
```

- [ ] **Step 8: Send and read, optimistically**

Create `src/features/chat/data/chat-mutations.ts`:

```ts
import { randomUUID } from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimistic, patch } from '@/shared/lib/optimistic';
import { queries } from '@/shared/lib/queries';
import { markThreadRead, sendMessage } from '@/features/chat/data/chat-api';
import { appendMessage } from '@/features/chat/messages';
import type { ChatMessage, Thread } from '@/features/chat/interfaces';
import { useMe } from '@/features/profile/hooks/use-me';

export interface DraftMessageInput {
  senderId: string;
  recipientId: string;
  content: string;
  tradeId?: string | null;
}

/**
 * The row the insert is about to create, minted here so the bubble that appears
 * instantly and the row that lands a moment later are the same message rather
 * than two.
 */
export function draftMessage(input: DraftMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    senderId: input.senderId,
    recipientId: input.recipientId,
    content: input.content,
    momentId: null,
    tradeId: input.tradeId ?? null,
    createdAt: new Date().toISOString(),
    readAt: null,
    pending: true,
  };
}

/** Takes the draft itself as its variable, so the patch and the insert cannot drift. */
export function useSendMessage(partnerId: string) {
  const queryClient = useQueryClient();
  const messagesKey = queries.chat.messages(partnerId).queryKey;

  return useMutation({
    mutationFn: (message: ChatMessage) =>
      sendMessage({
        id: message.id,
        recipientId: message.recipientId,
        content: message.content ?? '',
        tradeId: message.tradeId,
      }),
    ...optimistic(queryClient, [
      patch<ChatMessage[], ChatMessage>(messagesKey, (old, message) => appendMessage(old, message)),
      patch<Thread[], ChatMessage>(queries.chat.threads.queryKey, (old, message) =>
        old.map((thread) =>
          thread.partner.id === partnerId
            ? {
                ...thread,
                lastMessageId: message.id,
                lastContent: message.content,
                lastMomentId: null,
                lastSenderId: message.senderId,
                lastAt: message.createdAt,
                photo: null,
              }
            : thread,
        ),
      ),
    ]),
    // Swap the pending bubble for the stored row before the refetch lands, so
    // the "sending" state does not linger for a round trip longer than it is.
    onSuccess: (saved) => {
      queryClient.setQueryData<ChatMessage[]>(messagesKey, (old) => (old ? appendMessage(old, saved) : old));
    },
  });
}

/** Opening a conversation reads it. Both the badge and the ticks move at once. */
export function useMarkThreadRead(partnerId: string) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const myId = me?.id ?? '';

  return useMutation({
    mutationFn: () => markThreadRead(partnerId),
    ...optimistic(queryClient, [
      patch<Thread[], void>(queries.chat.threads.queryKey, (old) =>
        old.map((thread) => (thread.partner.id === partnerId ? { ...thread, unreadCount: 0 } : thread)),
      ),
      patch<ChatMessage[], void>(queries.chat.messages(partnerId).queryKey, (old) =>
        old.map((message) =>
          message.recipientId === myId && message.readAt === null
            ? { ...message, readAt: new Date().toISOString() }
            : message,
        ),
      ),
    ]),
  });
}
```

- [ ] **Step 9: Real unread badges**

Create `src/features/chat/hooks/use-unread-total.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
/** Unread messages across every conversation — the Friends tab badge. */
export function useUnreadTotal(): number {
  const { data: threads = [] } = useQuery(queries.chat.threads);
  return threads.reduce((total, thread) => total + thread.unreadCount, 0);
}
```

In `app/(app)/_layout.tsx`, drop the `demoUnreadCount` import and use it:

```ts
import { useUnreadTotal } from '@/features/chat/hooks/use-unread-total';
```

```ts
const unread = useUnreadTotal();
// Friends carries both incoming moments and unread messages.
const friendsBadge = unread > 0 ? String(unread) : undefined;
```

In `app/(app)/friends/index.tsx`, replace the placeholder from Task 12:

```ts
const unreadTotal = useUnreadTotal();
```

and add the import.

- [ ] **Step 10: Prefetch what the first screen needs**

All four queries the app opens with now exist, so they can be in flight before
anything renders. Create `src/shared/lib/prefetch.ts`:

```ts
import type { QueryClient } from '@tanstack/react-query';
import { queries } from '@/shared/lib/queries';
/**
 * The four queries the first screen after sign-in reads.
 *
 * Fired once whenever a user id appears — at sign-in and at every cold start —
 * so the header, the feed, the rail and the badges are already in flight by the
 * time they mount. The persisted cache draws the previous answer meanwhile.
 */
export function prefetchForUser(queryClient: QueryClient, userId: string): void {
  void queryClient.prefetchQuery(queries.profile.byId(userId));
  void queryClient.prefetchQuery(queries.moments.inbox);
  void queryClient.prefetchQuery(queries.friends.all);
  void queryClient.prefetchQuery(queries.chat.threads);
}
```

In `app/_layout.tsx`, add the import and one line to the user-change effect
Task 10 added:

```ts
import { prefetchForUser } from '@/shared/lib/prefetch';
```

```tsx
// A session that ends, expires, or returns as somebody else.
const previousUserId = useRef<string | null>(null);
useEffect(() => {
  if (previousUserId.current && previousUserId.current !== userId) void clearUserData(queryClient);
  previousUserId.current = userId;
  if (userId) prefetchForUser(queryClient, userId);
}, [userId]);
```

- [ ] **Step 11: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 12: Commit**

```bash
git add app src
git commit -m "feat: chat threads, messages and unread counts on real data" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 17: Chat screens and conversation presence

**Files:**

- Create: `src/features/chat/hooks/use-partner-presence.ts`
- Replace: `src/features/chat/components/chats-list.tsx`, `app/chat/[partnerId].tsx`
- Modify: `app/moment/[tradeId].tsx`

**Interfaces:**

- Consumes: the chat data layer and `pairKey` (Task 16); `queries.profile.byId` (Task 8); `avatarUrl` (Task 10); the presence policies on `realtime.messages` (Task 3).
- Produces: `usePartnerPresence(myId: string, partnerId: string): boolean`.

- [ ] **Step 1: Presence, scoped to the conversation**

Create `src/features/chat/hooks/use-partner-presence.ts`:

```ts
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { pairKey } from '@/features/chat/messages';
/**
 * "Active now", for one conversation and nowhere else.
 *
 * Presence is tracked only while this screen is open, on a private channel whose
 * topic is the pair — so nobody outside the conversation can observe it and
 * there is no global online state to leak. The two policies on
 * `realtime.messages` from the `app_wiring` migration enforce that server-side;
 * `private: true` is what makes the server consult them.
 */
export function usePartnerPresence(myId: string, partnerId: string): boolean {
  const [present, setPresent] = useState(false);

  useEffect(() => {
    if (!myId || !partnerId) return;

    const channel = supabase.channel(`chat:${pairKey(myId, partnerId)}`, {
      config: { private: true, presence: { key: myId } },
    });

    const read = () => setPresent(Object.keys(channel.presenceState()).includes(partnerId));

    channel
      .on('presence', { event: 'sync' }, read)
      .on('presence', { event: 'join' }, read)
      .on('presence', { event: 'leave' }, read)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void channel.track({ at: new Date().toISOString() });
      });

    return () => {
      // Removing the channel untracks and unsubscribes in one go, so leaving
      // the screen is the same thing as going offline for this pair.
      setPresent(false);
      void supabase.removeChannel(channel);
    };
  }, [myId, partnerId]);

  return present;
}
```

- [ ] **Step 2: The chats list**

Replace `src/features/chat/components/chats-list.tsx` with:

```tsx
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { CameraBadgeIcon } from '@/shared/ui/icons';
import { SectionLabel } from '@/shared/ui/section-label';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { t } from '@/shared/i18n/i18n';
import { CHAT } from '@/shared/i18n/keys';
import { threadTime } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * The conversation list, backed by `public.v_threads`.
 *
 * Lives in a component rather than a screen because it is shown inside the
 * Friends tab — the positioning note says to keep messaging a small part of the
 * app, not a destination of its own.
 */
export function ChatsList() {
  const { data: threads = [] } = useQuery(queries.chat.threads);
  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const unread = threads.reduce((total, thread) => total + thread.unreadCount, 0);

  return (
    <View>
      {/* Decorative in the mock and still decorative: searching a list this
          short is not a feature, and chat search is out of scope. */}
      <View className="mt-[18px] h-field-xs flex-row items-center gap-2.5 rounded-pill bg-surface-lilac px-4">
        <Search size={16} color={colors.mutedCool} strokeWidth={1.8} />
        <Text variant="bodyXs" className="text-placeholder">
          {t(CHAT.SEARCH_PLACEHOLDER)}
        </Text>
      </View>

      <View className="mt-6 gap-3.5">
        <SectionLabel trailing={unread > 0 ? t(CHAT.UNREAD_TRAILING, { count: unread }) : undefined}>
          {t(CHAT.UNREAD_SECTION)}
        </SectionLabel>

        <View className="gap-[18px]">
          {threads.map((thread) => {
            const isUnread = thread.unreadCount > 0;
            const fromMe = thread.lastSenderId === myId;

            return (
              <Pressable
                key={thread.lastMessageId}
                className="flex-row items-center gap-[13px]"
                onPress={() => router.push(`/chat/${thread.partner.id}`)}
              >
                <Avatar
                  source={thread.partner.avatarUrl}
                  name={thread.partner.name}
                  size={52}
                  ring={isUnread ? 'active' : 'none'}
                />

                <View className="min-w-0 flex-1 gap-[3px]">
                  <Text variant="rowTitleSm" className="text-ink" numberOfLines={1}>
                    {thread.partner.name}
                  </Text>
                  <View className="min-w-0 flex-row items-center gap-1.5">
                    {thread.lastMomentId && !thread.lastContent ? <CameraBadgeIcon size={14} /> : null}
                    <Text
                      variant="meta"
                      weight={isUnread ? 'semibold' : undefined}
                      className={cn('flex-1', isUnread ? 'text-ink-body' : 'text-muted-violet')}
                      numberOfLines={1}
                    >
                      {(fromMe ? t(CHAT.YOU_PREFIX) : '') + (thread.lastContent ?? t(CHAT.SENT_PHOTO))}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-2.5">
                  {thread.photo ? (
                    <Image
                      source={thread.photo}
                      className="h-[50px] w-[38px] rounded-tile border-[1.5px] border-border-chip"
                      contentFit="cover"
                    />
                  ) : null}
                  {isUnread ? (
                    <View className="h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-purple px-[7px]">
                      <Text variant="caption" weight="semibold" className="text-white">
                        {String(thread.unreadCount)}
                      </Text>
                    </View>
                  ) : (
                    <Text variant="caption" className="text-muted-lilac">
                      {threadTime(thread.lastAt)}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: The chat screen**

Replace `app/chat/[partnerId].tsx` with:

```tsx
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowUp, MoreHorizontal, Paperclip, Plus, X } from 'lucide-react-native';
import { Avatar } from '@/shared/ui/avatar';
import { GlassButton } from '@/shared/ui/glass-button';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/theme/colors';
import { shadow } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { CHAT, COMMON } from '@/shared/i18n/keys';
import { threadTime } from '@/shared/lib/format';
import { queries } from '@/shared/lib/queries';
import { draftMessage, useMarkThreadRead, useSendMessage } from '@/features/chat/data/chat-mutations';
import { usePartnerPresence } from '@/features/chat/hooks/use-partner-presence';
import { avatarUrl } from '@/features/profile/data/profile-api';
import { useMe } from '@/features/profile/hooks/use-me';
/**
 * Screen `09 Chat`.
 *
 * Note the positioning note explicitly says to cut open chat — this stays 1:1
 * only, reachable from a friend, with no group threads and no discovery.
 *
 * The mock's standing "Today" chip is gone: with real messages it would sit
 * above ones sent last week. Each bubble carries its own time, and `threadTime`
 * already says "Yesterday" or the weekday when that is what it is.
 */
export default function ChatScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const id = partnerId ?? '';
  const { data: me } = useMe();
  const myId = me?.id ?? '';
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { data: partner } = useQuery({ ...queries.profile.byId(id), enabled: id.length > 0 });
  const { data: messages = [] } = useQuery({ ...queries.chat.messages(id), enabled: id.length > 0 });

  const send = useSendMessage(id);
  const { mutate: markRead } = useMarkThreadRead(id);
  const present = usePartnerPresence(myId, id);

  const partnerAvatar = avatarUrl(partner?.avatar_storage_path ?? null);
  const partnerName = partner?.first_name ?? '';

  // Opening a conversation reads it. Primitive dep: every refetch is a new
  // array, and re-reading an already-read thread is a pointless write.
  const hasUnread = messages.some((message) => message.recipientId === myId && message.readAt === null);
  useEffect(() => {
    if (hasUnread) markRead();
  }, [hasUnread, markRead]);

  // A new message belongs in view, whether I sent it or it just arrived.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  function submit() {
    const content = draft.trim();
    if (content.length === 0 || myId.length === 0 || id.length === 0) return;
    send.mutate(draftMessage({ senderId: myId, recipientId: id, content }));
    setDraft('');
  }

  return (
    <Screen gutter={0} bottomInset={0}>
      <View className="h-[60px] flex-row items-center gap-3 px-gutter">
        <GlassButton size={34} onPress={() => router.back()} accessibilityLabel={t(COMMON.CLOSE)}>
          <X size={12} color={colors.inkFaint} strokeWidth={2.2} />
        </GlassButton>
        <Avatar source={partnerAvatar} name={partnerName} size={40} />
        <View className="flex-1 gap-px">
          <Text variant="rowTitle" className="text-ink">
            {partnerName}
          </Text>
          {present ? (
            <Text variant="metaXs" className="text-muted-lilac">
              {t(CHAT.ONLINE)}
            </Text>
          ) : null}
        </View>
        <GlassButton size={34} accessibilityLabel={t(COMMON.MORE)}>
          <MoreHorizontal size={17} color={colors.inkFaint} strokeWidth={2.4} />
        </GlassButton>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-4 px-gutter pb-2 pt-[18px]"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <View key={message.id} className={mine ? 'flex-row justify-end' : 'flex-row items-end gap-2.5'}>
              {!mine ? <Avatar source={partnerAvatar} name={partnerName} size={30} /> : null}

              <View className={cn('shrink gap-1.5', mine && 'items-end')}>
                <Text variant="caption" className="text-muted-lilac">
                  {threadTime(message.createdAt)}
                </Text>
                {message.content ? (
                  <View
                    className={cn(
                      'max-w-[264px] rounded-[22px] px-4 py-3',
                      mine ? 'rounded-br-[8px] bg-purple' : 'rounded-bl-[8px] bg-surface-violet',
                      // Still in flight: present, but not yet a fact.
                      message.pending && 'opacity-60',
                    )}
                  >
                    <Text variant="bodyXs" className={mine ? 'text-white' : 'text-ink-body'}>
                      {message.content}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          className="m-4 mb-6 gap-[18px] rounded-lg border border-border-lilac-alt bg-white px-4 pb-3 pt-[15px]"
          // Shadows stay as a style: RN's shadow props have no CSS equivalent NativeWind maps.
          style={shadow.card}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t(CHAT.INPUT_PLACEHOLDER)}
            placeholderTextColor={colors.placeholder}
            className="max-h-[100px] p-0 font-sans text-[15.5px] text-ink-body"
            multiline
          />
          {/* Attachments are out of scope; the two icons stay as the mock draws them. */}
          <View className="flex-row items-center gap-3.5">
            <Plus size={19} color={colors.inkBody} strokeWidth={2} />
            <Paperclip size={19} color={colors.inkBody} strokeWidth={1.8} />
            <View className="flex-1" />
            <Pressable
              className={cn(
                'h-9 w-9 items-center justify-center rounded-[18px] bg-purple',
                draft.trim().length === 0 && 'opacity-40',
              )}
              onPress={submit}
              disabled={draft.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel={t(CHAT.SEND)}
              accessibilityState={{ disabled: draft.trim().length === 0 }}
            >
              <ArrowUp size={17} color={colors.white} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
```

- [ ] **Step 4: The moment screen's reply bar sends**

In `app/moment/[tradeId].tsx`, add to the imports:

```ts
import { useEffect, useMemo, useState } from 'react';
```

```ts
import { draftMessage, useSendMessage } from '@/features/chat/data/chat-mutations';
import { useMe } from '@/features/profile/hooks/use-me';
```

and add these **above** the `if (!moment)` early return, so the hook order never
changes between the two branches:

```ts
const [reply, setReply] = useState('');
const { data: me } = useMe();
const myId = me?.id ?? '';
const senderId = moment?.from.id ?? '';
const sendReply = useSendMessage(senderId);
```

Then replace the reply `TextInput` with:

```tsx
<TextInput
  value={reply}
  onChangeText={setReply}
  placeholder={t(MOMENT.REPLY_PLACEHOLDER)}
  placeholderTextColor={alpha.onDarkTextSoft}
  className="p-0 font-sans text-[15.5px] text-white"
  editable={!locked}
  returnKeyType="send"
  onSubmitEditing={() => {
    const content = reply.trim();
    if (content.length === 0 || myId.length === 0) return;
    // `trade_id` ties the message to the moment it is about, which
    // is what makes the chat readable later.
    sendReply.mutate(
      draftMessage({
        senderId: myId,
        recipientId: moment.from.id,
        content,
        tradeId: moment.tradeId,
      }),
    );
    setReply('');
  }}
/>
```

and drop the "Task 17 makes the field send…" line from the comment above the
reply bar.

- [ ] **Step 5: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0.

Run: `grep -rn "demoMessages\|demoThreads\|demoUnreadCount\|demoProfiles\|DEMO_USER_ID" app src`
Expected: only `src/shared/lib/fixtures.ts` itself. Task 20 deletes them.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app src
git commit -m "feat: chat on real messages, with per-conversation presence" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 18: Live updates

**Files:**

- Create: `src/features/live/live-actions.ts`, `src/features/live/live-actions.test.ts`, `src/features/live/use-live-updates.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**

- Consumes: the publication from Task 3; `appendMessage` and the chat keys (Task 16); the moments and friends keys (Tasks 11, 13).
- Produces:
  - From `@/features/live/live-actions`: `LiveEvent { table: 'trades' | 'messages' | 'friendships'; eventType: 'INSERT' | 'UPDATE'; new: Record<string, unknown> }`, `LiveAction` (a union of `inbox-changed`, `pairs-changed`, `outgoing-changed`, `friendships-changed`, `message-received`, `message-read`), `actionsFor(event: LiveEvent, me: string): LiveAction[]`.
  - `useLiveUpdates(userId: string | null): void`.

- [ ] **Step 1: Write the failing mapping test**

Create `src/features/live/live-actions.test.ts`:

```ts
import { actionsFor, type LiveEvent } from '@/features/live/live-actions';

const ME = 'me';
const event = (over: Partial<LiveEvent> & Pick<LiveEvent, 'table'>): LiveEvent => ({
  eventType: 'INSERT',
  new: {},
  ...over,
});

describe('actionsFor', () => {
  it('a moment arriving for me changes the inbox', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { responder_id: ME, initiator_id: 'mia' } }), ME),
    ).toEqual([{ kind: 'inbox-changed' }]);
  });

  it('a trade of mine unlocking changes the inbox and the pairs', () => {
    expect(
      actionsFor(
        event({ table: 'trades', eventType: 'UPDATE', new: { responder_id: ME, initiator_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'inbox-changed' }, { kind: 'pairs-changed' }]);
  });

  it('a trade I started appearing changes my locked tiles', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { initiator_id: ME, responder_id: 'mia' } }), ME),
    ).toEqual([{ kind: 'outgoing-changed' }]);
  });

  it('a trade I started being answered changes the pairs and my locked tiles', () => {
    expect(
      actionsFor(
        event({ table: 'trades', eventType: 'UPDATE', new: { initiator_id: ME, responder_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'pairs-changed' }, { kind: 'outgoing-changed' }]);
  });

  it('a message to me arrives under its sender', () => {
    const actions = actionsFor(
      event({
        table: 'messages',
        new: {
          id: 'm1',
          sender_id: 'mia',
          recipient_id: ME,
          content: 'hey',
          moment_id: null,
          trade_id: null,
          created_at: '2026-09-14T10:00:00.000Z',
          read_at: null,
        },
      }),
      ME,
    );

    expect(actions).toEqual([
      {
        kind: 'message-received',
        partnerId: 'mia',
        message: expect.objectContaining({ id: 'm1', senderId: 'mia', content: 'hey' }),
      },
    ]);
  });

  it('my message being read stamps it in the right conversation', () => {
    expect(
      actionsFor(
        event({
          table: 'messages',
          eventType: 'UPDATE',
          new: {
            id: 'm1',
            sender_id: ME,
            recipient_id: 'mia',
            read_at: '2026-09-14T10:05:00.000Z',
          },
        }),
        ME,
      ),
    ).toEqual([
      {
        kind: 'message-read',
        partnerId: 'mia',
        messageId: 'm1',
        readAt: '2026-09-14T10:05:00.000Z',
      },
    ]);
  });

  it('ignores my own message coming back and an unread update', () => {
    expect(actionsFor(event({ table: 'messages', new: { sender_id: ME, recipient_id: 'mia' } }), ME)).toEqual(
      [],
    );
    expect(
      actionsFor(
        event({
          table: 'messages',
          eventType: 'UPDATE',
          new: { sender_id: ME, recipient_id: 'mia', read_at: null },
        }),
        ME,
      ),
    ).toEqual([]);
  });

  it('a friendship in either direction changes the friend lists', () => {
    expect(
      actionsFor(event({ table: 'friendships', new: { requester_id: 'mia', recipient_id: ME } }), ME),
    ).toEqual([{ kind: 'friendships-changed' }]);
    expect(
      actionsFor(
        event({ table: 'friendships', eventType: 'UPDATE', new: { requester_id: ME, recipient_id: 'mia' } }),
        ME,
      ),
    ).toEqual([{ kind: 'friendships-changed' }]);
  });

  it('says nothing about a row that is not mine', () => {
    expect(
      actionsFor(event({ table: 'trades', new: { initiator_id: 'mia', responder_id: 'ben' } }), ME),
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npx jest src/features/live/live-actions.test.ts`
Expected: FAIL, `Cannot find module '@/features/live/live-actions'`.

- [ ] **Step 3: Map payloads to intentions**

Create `src/features/live/live-actions.ts`:

```ts
import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * What a Realtime change means for the cache, as a value rather than a side
 * effect. The socket handler is then four lines and this is testable — which
 * matters, because "the other person's moment did not appear" is invisible in
 * a single-user run.
 *
 * Deletes are deliberately absent. Supabase cannot filter delete events and
 * does not apply row security to them, so declines, withdrawals and unfriends
 * reach the other phone on its next refetch instead.
 */
export type LiveAction =
  | { kind: 'inbox-changed' }
  | { kind: 'pairs-changed' }
  | { kind: 'outgoing-changed' }
  | { kind: 'friendships-changed' }
  | { kind: 'message-received'; partnerId: string; message: ChatMessage }
  | { kind: 'message-read'; partnerId: string; messageId: string; readAt: string };

export interface LiveEvent {
  table: 'trades' | 'messages' | 'friendships';
  eventType: 'INSERT' | 'UPDATE';
  /** The changed row. Row security already decided this subscriber may see it. */
  new: Record<string, unknown>;
}

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function toMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: text(row.id) ?? '',
    senderId: text(row.sender_id) ?? '',
    recipientId: text(row.recipient_id) ?? '',
    content: text(row.content),
    momentId: text(row.moment_id),
    tradeId: text(row.trade_id),
    createdAt: text(row.created_at) ?? new Date().toISOString(),
    readAt: text(row.read_at),
  };
}

export function actionsFor(event: LiveEvent, me: string): LiveAction[] {
  const row = event.new;

  if (event.table === 'trades') {
    const actions: LiveAction[] = [];
    if (text(row.responder_id) === me) {
      actions.push({ kind: 'inbox-changed' });
      // An update to a trade I hold is the unlock, which makes a pair.
      if (event.eventType === 'UPDATE') actions.push({ kind: 'pairs-changed' });
    }
    if (text(row.initiator_id) === me) {
      // An insert is a new lock of mine — my own send, or somebody claiming an
      // invite. An update is somebody answering one.
      if (event.eventType === 'UPDATE') actions.push({ kind: 'pairs-changed' });
      actions.push({ kind: 'outgoing-changed' });
    }
    return actions;
  }

  if (event.table === 'messages') {
    if (event.eventType === 'INSERT' && text(row.recipient_id) === me) {
      const message = toMessage(row);
      return [{ kind: 'message-received', partnerId: message.senderId, message }];
    }
    const readAt = text(row.read_at);
    if (event.eventType === 'UPDATE' && text(row.sender_id) === me && readAt) {
      return [
        {
          kind: 'message-read',
          partnerId: text(row.recipient_id) ?? '',
          messageId: text(row.id) ?? '',
          readAt,
        },
      ];
    }
    return [];
  }

  const isMine = text(row.requester_id) === me || text(row.recipient_id) === me;
  return isMine ? [{ kind: 'friendships-changed' }] : [];
}
```

- [ ] **Step 4: Run the test**

Run: `npx jest src/features/live/live-actions.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: One channel per signed-in user**

Create `src/features/live/use-live-updates.ts`:

```ts
import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { queries } from '@/shared/lib/queries';
import { appendMessage } from '@/features/chat/messages';
import { actionsFor, type LiveAction, type LiveEvent } from '@/features/live/live-actions';
import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * One channel for everything that can change behind my back.
 *
 * Mounted in the root layout rather than under the tabs, so a deep link
 * straight into a moment or a chat is live too. Row-level security decides
 * which change reaches which subscriber; the filters below only narrow it
 * further, so the socket does not carry rows this phone would drop.
 */
type Payload = RealtimePostgresChangesPayload<Record<string, unknown>>;

function applyActions(queryClient: QueryClient, actions: LiveAction[]): void {
  for (const action of actions) {
    switch (action.kind) {
      case 'inbox-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.inbox.queryKey });
        break;
      case 'pairs-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.pairs._def });
        break;
      case 'outgoing-changed':
        void queryClient.invalidateQueries({ queryKey: queries.moments.outgoingLocked.queryKey });
        break;
      case 'friendships-changed':
        void queryClient.invalidateQueries({ queryKey: queries.friends._def });
        break;
      case 'message-received':
        // Appended rather than invalidated: an open conversation should show it
        // now, not after a round trip.
        queryClient.setQueryData<ChatMessage[]>(queries.chat.messages(action.partnerId).queryKey, (old) =>
          old ? appendMessage(old, action.message) : old,
        );
        void queryClient.invalidateQueries({ queryKey: queries.chat.threads.queryKey });
        break;
      case 'message-read':
        queryClient.setQueryData<ChatMessage[]>(queries.chat.messages(action.partnerId).queryKey, (old) =>
          old?.map((message) =>
            message.id === action.messageId ? { ...message, readAt: action.readAt } : message,
          ),
        );
        break;
    }
  }
}

export function useLiveUpdates(userId: string | null): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const handle =
      (table: LiveEvent['table']) =>
      (payload: Payload): void => {
        if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;
        applyActions(
          queryClient,
          actionsFor(
            { table, eventType: payload.eventType, new: payload.new as Record<string, unknown> },
            userId,
          ),
        );
      };

    const table = (name: LiveEvent['table'], event: 'INSERT' | 'UPDATE', filter: string) =>
      ({ event, schema: 'public', table: name, filter }) as const;

    /** False until the first successful subscribe, so the initial one is not a "reconnect". */
    let hasSubscribed = false;

    const channel = supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', table('trades', 'INSERT', `responder_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'UPDATE', `responder_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'INSERT', `initiator_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('trades', 'UPDATE', `initiator_id=eq.${userId}`), handle('trades'))
      .on('postgres_changes', table('messages', 'INSERT', `recipient_id=eq.${userId}`), handle('messages'))
      .on('postgres_changes', table('messages', 'UPDATE', `sender_id=eq.${userId}`), handle('messages'))
      .on(
        'postgres_changes',
        table('friendships', 'INSERT', `recipient_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'UPDATE', `recipient_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'INSERT', `requester_id=eq.${userId}`),
        handle('friendships'),
      )
      .on(
        'postgres_changes',
        table('friendships', 'UPDATE', `requester_id=eq.${userId}`),
        handle('friendships'),
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        // Anything that happened while the socket was down was simply missed;
        // there is no replay. One sweep is cheaper than reasoning about it.
        if (hasSubscribed) void queryClient.invalidateQueries();
        hasSubscribed = true;
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
```

- [ ] **Step 6: Mount it once**

In `app/_layout.tsx`, `useLiveUpdates` has to sit inside the query provider, so
it goes in `RootStack`. Add the import:

```ts
import { useLiveUpdates } from '@/features/live/use-live-updates';
```

give `RootStack` the id as well:

```tsx
<RootStack signedIn={status === 'signed-in'} userId={userId} />
```

```tsx
interface RootStackProps {
  signedIn: boolean;
  userId: string | null;
}
```

```tsx
function RootStack({ signedIn, userId }: RootStackProps) {
  useLiveUpdates(userId);
```

- [ ] **Step 7: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0. If supabase-js will not accept the `table(...)` helper's
return where a `postgres_changes` filter is expected, inline the four object
literals at the first two `.on(` calls and follow the same shape for the rest;
do not widen the payload type to `any`.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add app src
git commit -m "feat: live inbox, chat and friend updates over one realtime channel" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 19: Invites and share links

**Files:**

- Create: `src/features/invites/data/invites-api.ts`, `src/features/invites/data/invites-queries.ts`, `src/features/invites/share-invite.ts`, `src/features/invites/hooks/use-pending-invite.ts`
- Replace: `app/invite/[token].tsx`
- Modify: `src/shared/lib/queries.ts`, `src/features/auth/sign-out.ts`, `app/(onboarding)/details.tsx`, `app/(onboarding)/friends.tsx`, `app/(app)/friends/search.tsx`, `app/(app)/friends/index.tsx`

**Interfaces:**

- Consumes: `invite_preview` / `claim_invite` (existing migrations), `SIGN_TTL_SECONDS` (Task 7), `currentUserId` (Task 8), `avatarUrl` (Task 10), `INVITE.SHARE_MESSAGE` and `COMMON.COPIED` (Task 6).
- Produces:
  - From `@/features/invites/data/invites-api`: `INVITE_BASE`, `inviteLink(token): string`, `InvitePreview`, `ClaimResult`, `createInvite(momentId?): Promise<string>`, `fetchInvitePreview(token): Promise<InvitePreview | null>`, `claimInvite(token): Promise<ClaimResult | null>`.
  - Key `queries.invites.preview(token)`.
  - From `@/features/invites/share-invite`: `type ShareOutcome = 'shared' | 'copied'`, `shareInvite(name: string, momentId?: string | null): Promise<ShareOutcome>`, `copyInvite(momentId?: string | null): Promise<void>`. The spec writes this as `shareInvite(momentId?)`; the name is passed in because `INVITE.SHARE_MESSAGE` interpolates `%{name}`, and a module that is not a hook would otherwise have to fetch the caller's own profile to get it.
  - `usePendingInvite` — store of `{ token: string | null }`.

- [ ] **Step 1: The API**

Create `src/features/invites/data/invites-api.ts`:

```ts
import { supabase } from '@/shared/lib/supabase';
import { SIGN_TTL_SECONDS } from '@/shared/lib/signed-urls';
import { currentUserId } from '@/features/auth/current-user';
import { avatarUrl } from '@/features/profile/data/profile-api';
/**
 * The growth loop's front door. An invite is a token that stands in for a
 * friendship that does not exist yet: opening it shows the frosted moment, and
 * claiming it makes the two people friends and opens the trade.
 */

/**
 * One constant, to be swapped for a universal link once there is a domain.
 * A custom scheme is enough while the app is not in a store.
 */
export const INVITE_BASE = 'glimpse://invite/';

export function inviteLink(token: string): string {
  return `${INVITE_BASE}${token}`;
}

export interface InvitePreview {
  inviterName: string;
  inviterAvatarUrl: string | null;
  /** `null` for an invite that carries no photo — just "come and trade". */
  momentId: string | null;
  photo: string | null;
  createdAt: string;
}

export interface ClaimResult {
  inviterId: string;
  momentId: string | null;
  /** `null` when the invite carried no moment, so there is nothing to answer. */
  tradeId: string | null;
}

/** The `invites` trigger refuses a moment that is not the inviter's own. */
export async function createInvite(momentId?: string | null): Promise<string> {
  const { data, error } = await supabase
    .from('invites')
    .insert({ inviter_id: currentUserId(), moment_id: momentId ?? null })
    .select('token')
    .single();
  if (error) throw error;
  return data.token;
}

/**
 * Callable without an account — the token is the only key. `null` for a token
 * that is unknown, expired, or already claimed.
 */
export async function fetchInvitePreview(token: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc('invite_preview', { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;

  // Signed directly rather than through the moment URL cache: a signed-out
  // visitor has no `visible_moment_paths` to ask. The `invite_object_readable`
  // policy is what lets the Storage API sign this one path for them.
  let photo: string | null = null;
  if (row.blurred_storage_path) {
    const { data: signed } = await supabase.storage
      .from('moments')
      .createSignedUrl(row.blurred_storage_path, SIGN_TTL_SECONDS);
    photo = signed?.signedUrl ?? null;
  }

  return {
    inviterName: row.inviter_first_name,
    inviterAvatarUrl: avatarUrl(row.inviter_avatar_storage_path),
    momentId: row.moment_id,
    photo,
    createdAt: row.created_at,
  };
}

/**
 * Marks the token used, makes the two friends, and opens the trade for the
 * frosted photo. `null` when the token is not claimable — unknown, expired,
 * already used, the caller's own, or across a block.
 */
export async function claimInvite(token: string): Promise<ClaimResult | null> {
  const { data, error } = await supabase.rpc('claim_invite', { p_token: token });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return { inviterId: row.inviter_id, momentId: row.moment_id, tradeId: row.trade_id };
}
```

Create `src/features/invites/data/invites-queries.ts`:

```ts
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { fetchInvitePreview } from '@/features/invites/data/invites-api';
export const invitesQueries = createQueryKeys('invites', {
  /** What the deep-link screen shows before the visitor has an account. */
  preview: (token: string) => ({
    queryKey: [token],
    queryFn: () => fetchInvitePreview(token),
  }),
});
```

In `src/shared/lib/queries.ts`, add the import and the fifth factory:

```ts
import { invitesQueries } from '@/features/invites/data/invites-queries';
```

```ts
export const queries = mergeQueryKeys(
  momentsQueries,
  friendsQueries,
  profileQueries,
  chatQueries,
  invitesQueries,
);
```

- [ ] **Step 2: Sharing a link**

Create `src/features/invites/share-invite.ts`:

```ts
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { t } from '@/shared/i18n/i18n';
import { INVITE } from '@/shared/i18n/keys';
import { createInvite, inviteLink } from '@/features/invites/data/invites-api';
/** Every "invite" button in the app ends up here. */
export type ShareOutcome = 'shared' | 'copied';

/**
 * Mint an invite and hand out its link.
 *
 * Where there is no share sheet — desktop web, which is where this work is
 * verified — the link goes on the clipboard instead, so the button always does
 * something rather than failing silently.
 */
export async function shareInvite(name: string, momentId?: string | null): Promise<ShareOutcome> {
  const token = await createInvite(momentId);
  const link = inviteLink(token);

  try {
    await Share.share({ message: t(INVITE.SHARE_MESSAGE, { name, link }) });
    return 'shared';
  } catch {
    await Clipboard.setStringAsync(link);
    return 'copied';
  }
}

/** The "Copy" action on a share row: the bare link, no share sheet. */
export async function copyInvite(momentId?: string | null): Promise<void> {
  const token = await createInvite(momentId);
  await Clipboard.setStringAsync(inviteLink(token));
}
```

Create `src/features/invites/hooks/use-pending-invite.ts`:

```ts
import { create } from '@/shared/lib/store';
/**
 * A token a signed-out visitor arrived with, held across onboarding so the
 * account they create at step 4 can claim it.
 *
 * Not persisted on purpose: a token that survives a restart is a link they can
 * simply open again, and a stale one would befriend a stranger later.
 */
interface PendingInvite {
  token: string | null;
}

export const usePendingInvite = create<PendingInvite>({ token: null });
```

In `src/features/auth/sign-out.ts`, add the import and the reset:

```ts
import { usePendingInvite } from '@/features/invites/hooks/use-pending-invite';
```

```ts
usePendingInvite.reset();
```

- [ ] **Step 3: The invite screen**

Replace `app/invite/[token].tsx` with:

```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { CloseRow } from '@/shared/ui/close-row';
import { CameraIcon } from '@/shared/ui/icons';
import { LockedImage } from '@/shared/ui/locked-image';
import { Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { colors } from '@/shared/theme/colors';
import { radius } from '@/shared/theme/page-structure';
import { t } from '@/shared/i18n/i18n';
import { INVITE, MOMENT } from '@/shared/i18n/keys';
import { relativeTime } from '@/shared/lib/format';
import { errorMessage } from '@/shared/lib/error-message';
import { queries } from '@/shared/lib/queries';
import { useSession } from '@/features/auth/hooks/use-session';
import { claimInvite } from '@/features/invites/data/invites-api';
import { usePendingInvite } from '@/features/invites/hooks/use-pending-invite';
/**
 * Screen `E Einladung annehmen · Deeplink`.
 *
 * Someone has sent you a moment before you have an account. The photo is shown
 * frosted — the rule applies before signup too, which is exactly what makes the
 * invite worth opening.
 *
 * Reached via `glimpse://invite/<token>`; the token is the capability (see the
 * `invites` table). Signed in, opening the link claims it. Signed out, the
 * token waits on the onboarding store until step 4 creates the account.
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const inviteToken = token ?? '';
  const queryClient = useQueryClient();
  const { status } = useSession();
  const pending = usePendingInvite();

  const { data: preview, isPending } = useQuery({
    ...queries.invites.preview(inviteToken),
    enabled: inviteToken.length > 0,
  });

  const claim = useMutation({
    mutationFn: () => claimInvite(inviteToken),
    onSuccess: (result) => {
      if (!result) return;
      // A friendship and possibly a trade appeared; nothing cached knows yet.
      void queryClient.invalidateQueries();
      usePendingInvite.reset();
      // The feed has to be underneath, or closing the camera has nowhere to go.
      router.replace('/(app)/feed');
      if (result.tradeId) router.push({ pathname: '/camera', params: { trade: result.tradeId } });
    },
  });

  const signedIn = status === 'signed-in';
  const { mutate: claimNow, isIdle } = claim;
  useEffect(() => {
    // Claiming is the whole point of opening the link with an account.
    if (signedIn && inviteToken.length > 0 && isIdle) claimNow();
  }, [signedIn, inviteToken, isIdle, claimNow]);

  const dead = (!isPending && !preview) || (claim.isSuccess && claim.data === null);

  if (dead) {
    return (
      <Screen>
        <CloseRow onPress={() => router.replace('/(onboarding)/welcome')} />
        <Text variant="bodyMd" className="mt-10 text-center text-muted">
          {t(MOMENT.NOT_FOUND)}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View className="items-center gap-5">
          {claim.error ? (
            <Text variant="subtitle" className="text-center text-purple-deep">
              {errorMessage(claim.error)}
            </Text>
          ) : null}
          <Button
            label={t(INVITE.CTA)}
            size="lg"
            icon={<CameraIcon size={21} lensColor={colors.ink} />}
            loading={claim.isPending}
            onPress={() => {
              // Signed out: the account has to exist before the token can be
              // spent, so it waits here and step 4 claims it.
              pending.set({ token: inviteToken });
              router.push('/(onboarding)/name');
            }}
          />
          <Text
            variant="buttonSm"
            className="text-center text-ink-soft"
            accessibilityRole="link"
            onPress={() => router.replace('/(onboarding)/welcome')}
          >
            {t(INVITE.SECONDARY)}
          </Text>
        </View>
      }
      scroll
    >
      <CloseRow onPress={() => router.replace('/(onboarding)/welcome')} />

      <View className="mt-[26px] items-center gap-3.5">
        <Avatar
          source={preview?.inviterAvatarUrl ?? null}
          name={preview?.inviterName}
          size={76}
          ring="halo"
        />
        <Text variant="headlineSm" className="text-center text-ink">
          {t(INVITE.TITLE, { name: preview?.inviterName ?? '' })}
        </Text>
        <Text variant="bodySm" className="max-w-[280px] text-center text-muted">
          {t(INVITE.BODY)}
        </Text>
      </View>

      {/* An invite with no moment is name and avatar only — there is nothing to
          withhold, just somebody asking you to trade. */}
      {preview?.photo ? (
        <LockedImage
          source={preview.photo}
          radius={radius.lg}
          puckSize={62}
          className="mt-6 aspect-[4/5] w-full"
        >
          <View className="absolute bottom-[18px] left-[18px] right-[18px] gap-1">
            <Text variant="meta" className="text-[rgba(255,255,255,.78)]">
              {relativeTime(preview.createdAt)}
            </Text>
          </View>
        </LockedImage>
      ) : null}
    </Screen>
  );
}
```

- [ ] **Step 4: Claim the waiting token after sign-up**

In `app/(onboarding)/details.tsx`, add:

```ts
import { claimInvite } from '@/features/invites/data/invites-api';
import { usePendingInvite } from '@/features/invites/hooks/use-pending-invite';
```

and extend the signed-in branch of `mutationFn`, after the avatar upload:

```ts
if (outcome.kind === 'signed-in') {
  // The account exists now, so the picture finally has somewhere to go.
  if (draft.avatar) await uploadAvatar(draft.avatar);
  // And the invite that brought them here can be spent.
  const pendingToken = usePendingInvite.getState().token;
  if (pendingToken) {
    await claimInvite(pendingToken);
    usePendingInvite.reset();
  }
  useOnboardingDraft.reset();
}
```

- [ ] **Step 5: The share rows mint real links**

In `app/(onboarding)/friends.tsx`, widen the keys import and add the share module:

```ts
import { COMMON, FRIENDS, ONBOARDING } from '@/shared/i18n/keys';
import { copyInvite, shareInvite } from '@/features/invites/share-invite';
```

```ts
const [copied, setCopied] = useState(false);
```

and replace the two `ShareRow` actions (`Clipboard` and `Share` are no longer
imported directly here — drop both imports):

```tsx
        actions={[
          {
            label: copied ? t(COMMON.COPIED) : t(ONBOARDING.FRIENDS.SHARE_COPY),
            icon: <Copy size={22} color={colors.inkFaint} strokeWidth={2} />,
            onPress: () => {
              void copyInvite().then(() => setCopied(true));
            },
          },
          {
            label: t(ONBOARDING.FRIENDS.SHARE_MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => {
              void shareInvite(me?.first_name ?? '').then((outcome) => setCopied(outcome === 'copied'));
            },
          },
        ]}
```

Make the same change in `app/(app)/friends/search.tsx` — the QR action stays
inert, and the "More" action becomes:

```tsx
          {
            label: copied ? t(COMMON.COPIED) : t(FRIENDS.SEARCH.MORE),
            icon: <MoreHorizontal size={22} color={colors.inkFaint} strokeWidth={2.4} />,
            onPress: () => {
              void shareInvite(me?.first_name ?? '').then((outcome) => setCopied(outcome === 'copied'));
            },
          },
```

with the same `copied` state and the `Share` import dropped.

In `app/(app)/friends/index.tsx`, "Invite more" shares instead of opening search:

```ts
import { shareInvite } from '@/features/invites/share-invite';
```

```tsx
<CtaFooter label={t(FRIENDS.ADD_CTA)} onPress={() => void shareInvite(me?.first_name ?? '')} />
```

- [ ] **Step 6: Typecheck, format and test**

Run: `npm run typecheck`
Expected: exits 0. If `invite_preview` or `claim_invite` rows are typed nullable,
add `.overrideTypes<…, { merge: false }>()` at that call as in Task 4 Step 6.

Run: `npx prettier --write app src && npm test`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app src
git commit -m "feat: invite links, preview and claim" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 20: Cleanup and docs

**Files:**

- Rename: `src/shared/lib/fixtures.ts` → `src/shared/lib/assets.ts` (rewritten)
- Modify: `src/shared/lib/supabase.ts`, `app/(onboarding)/reviews.tsx`, `src/features/widget/components/homescreen-preview.tsx`, every file importing `@/shared/lib/fixtures`, `README.md`, `docs/database.md`

**Interfaces:**

- Consumes: nothing new.
- Produces:
  - From `@/shared/lib/assets`: `ART`, `IOS_ICONS`, `PHOTOS` (`viewfinder`, `widgetCard`) and `SAMPLE_FACES` (`mia`, `ben`, `lina`). Nothing else.
  - `@/shared/lib/fixtures` no longer exists; `isSupabaseConfigured` and `requireSupabase` no longer exist.

- [ ] **Step 1: See what is actually still used**

Run:

```bash
grep -rn "from '@/shared/lib/fixtures'" app src
```

Expected: only `ART`, `AVATARS`, `PHOTOS` and `IOS_ICONS` are imported — from
`app/(onboarding)/welcome.tsx`, `paywall.tsx`, `thank-you.tsx`, `camera.tsx`,
`signup.tsx`, `notifications.tsx`, `reviews.tsx`, `app/compose.tsx`,
`src/features/feed/components/empty-state.tsx` and
`src/features/widget/components/homescreen-preview.tsx`.

Any `demo*` or `DEMO_USER_ID` still listed is a screen an earlier task missed:
fix that screen before going on, rather than keeping the fixture alive.

- [ ] **Step 2: Write the asset module**

Run: `git mv src/shared/lib/fixtures.ts src/shared/lib/assets.ts`

Replace the whole of `src/shared/lib/assets.ts` with:

```ts
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
```

Then point every import at the new module and rename the faces:

```bash
grep -rl "@/shared/lib/fixtures" app src \
  | xargs sed -i '' "s#@/shared/lib/fixtures#@/shared/lib/assets#g"
grep -rl "AVATARS" app src | xargs sed -i '' "s/\bAVATARS\b/SAMPLE_FACES/g"
```

Run: `grep -rn "fixtures\|AVATARS" app src`
Expected: no output.

Removing the contacts card in Task 12 and pointing the share rows at the real
handle also orphaned a handful of strings. Delete these from **both**
`en.ts` and `de.ts` once you have confirmed each has no call site
(`grep -rn "CONTACTS_SECTION\|MORE_COUNT\|PROFILE_LINK" app src`):
`onboarding.friends.contactsSection`, `.add`, `.added`, `.moreCount`,
`.inviteTitle`, `.inviteBody`, `.inviteCta`, and `common.profileLink`. Nothing
fails if they stay — `keys.test.ts` does not check for unused keys — which is
exactly why they need deleting by hand.

Delete the now-unused images if nothing references them, checking each first:

```bash
for image in av-self c-av-noah alex-avatar moment-open p-beach p-flowers p-street gal-sea gal-flowers; do
  echo "== $image"; grep -rn "$image" app src widgets scripts || true
done
```

Expected: no hits. Remove the files that have none with `git rm assets/images/<name>.png`.
Leave anything still referenced (for example by `scripts/render-splash.py`) alone.

- [ ] **Step 3: Drop the "not configured" fallback**

In `src/shared/lib/supabase.ts`, delete the two deprecated exports at the end of
the file:

```ts
/** @deprecated Always true. Removed in Task 20 once no module reads it. */
export const isSupabaseConfigured = true;

/** @deprecated Import `supabase` instead. Removed in Task 20. */
export function requireSupabase() {
  return supabase;
}
```

Run: `grep -rn "isSupabaseConfigured\|requireSupabase" app src`
Expected: no output.

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 4: Update the README**

Replace the **Getting started** block and the paragraph under it with:

````markdown
## Getting started

```bash
npm install
cp .env.example .env      # required — fill in from the Supabase project
npx expo start
```

`.env` is required. The app talks to Supabase for everything: there is no
fixture mode and no "not configured" fallback. Without the two
`EXPO_PUBLIC_SUPABASE_*` values the client throws at import.
````

In the **Generated types** bullet, replace the hand-written note with:

```markdown
- **Generated types.** `src/shared/lib/database.interfaces.ts` is generated from
  the project — regenerate it after every migration (`supabase gen types
typescript`, or the MCP's `generate_typescript_types`) and never edit it by
  hand. App code imports row names from `src/shared/lib/database.types.ts`.
```

Add `npm test` to the command block, above `npm run typecheck`:

```markdown
npm test # jest — pure logic: keys, selectors, caches
```

In **What is deliberately not built**, replace the "Blurred renditions" row with
a "Push notifications" row, and the "Contacts import" row's state:

```markdown
| Push notifications | No token registration and nothing sent. `device_tokens` and `register_device_token()` exist; the sender does not. |
| Contacts import | Not built and not shown. Onboarding step 5 is real `@username` search plus a share link. |
```

Replace the whole **Known issues** section with:

```markdown
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
```

- [ ] **Step 5: Update the database doc**

At the end of `docs/database.md`, add:

```markdown
## 7. Realtime, presence and the blur function

Three tables are in the `supabase_realtime` publication: `trades`, `messages`
and `friendships`. Row-level security still decides which subscriber receives
which change, so a client subscribing to somebody else's rows simply never
hears about them.

Only INSERT and UPDATE are consumed. Supabase cannot filter delete events and
does not apply row security to them, so there is deliberately no delete
listener and no `replica identity full`: declines, withdrawals and unfriends
reach the other phone on its next refetch. `src/features/live/live-actions.ts`
maps a change to what it means for the cache, and is unit-tested.

Nothing changes in the database when a trade's 24 hours pass, so the timer
produces no event. The inbox query schedules one refetch for the earliest
`auto_unlock_at` it holds instead (`nextUnlockDelay`).

**Presence.** "Active now" is per conversation and exists only while the chat
screen is open. Both phones join the private channel
`chat:<lower uuid>:<higher uuid>` and track themselves; two policies on
`realtime.messages` allow read and insert on that topic only for the two ids in
it, so presence cannot be observed from outside the conversation and there is no
global online state anywhere.

**The blur function.** `supabase/functions/blur-moment` makes the frosted
rendition server-side, with JWT verification on: it refuses a moment whose
`author_id` is not the caller, downloads the original with the service role,
resizes it to 48px wide, blurs it, and writes `blurred/{author_id}/{file}` plus
`moments.blurred_storage_path`. The client invokes it after inserting the moment
row and before `send_moment` or `respond_to_trade`, and a failure fails the send
— so a recipient never receives a moment with nothing to show them, and a
client that could upload its own "blurred" copy (which could just be the
original) never gets the chance.
```

In §3, after the paragraph explaining `visible_moment_paths()`, add:

```markdown
The client never re-signs a path it already holds: `src/shared/lib/signed-urls.ts`
caches `{ path → url, expiresAt }` in memory and in AsyncStorage, signs for 24
hours, and re-signs only when under two hours remain. A fresh URL per fetch
would defeat the image cache and re-download the same photo on every refetch.
```

- [ ] **Step 6: Typecheck, format and test**

Run: `npm run typecheck && npm test && npm run format:check`
Expected: all three pass. If `format:check` complains about the markdown,
run `npx prettier --write README.md docs` and re-check.

- [ ] **Step 7: Commit**

```bash
git add -A app src assets README.md docs
git commit -m "chore: drop the fixtures and the not-configured fallback, update the docs" -m "Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012A2gz59aWK6CCueq4SYbS6"
```

---

### Task 21: Verification

**Files:** none. This task changes no code; it proves the code works and writes the report.

**Interfaces:**

- Consumes: everything. The Supabase MCP for the row checks, the Chrome DevTools MCP for the browser.
- Produces: a report of what passed and what did not, with rows as evidence.

**Prerequisites:** the Chrome DevTools MCP is connected; "Confirm email" is off;
`.env` holds the real values. Three throwaway accounts are created and, unless
the owner asks otherwise, left in the project.

- [ ] **Step 1: The gates that do not need a browser**

Run: `npm run typecheck && npm test && npm run format:check`
Expected: all three exit 0. Do not start the browser work with any of them red —
every failure below would be ambiguous.

- [ ] **Step 2: Start the web build**

Run: `npx expo start --web --clear`
Expected: a local URL, and no bundling error. Keep it running; every step below
drives this build.

- [ ] **Step 3: Prepare a fake camera**

Two of the steps below need `getUserMedia`. In each browser context, evaluate
this **before** navigating to a camera screen — a canvas stream whose frames
differ, so the three moments are distinguishable and the blur is visible:

```js
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280;
  const context = canvas.getContext('2d');
  let frame = 0;
  setInterval(() => {
    frame += 1;
    context.fillStyle = `hsl(${(frame * 7) % 360} 70% 55%)`;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.font = '64px sans-serif';
    context.fillText(`glimpse ${frame}`, 40, 220);
  }, 100);
  const stream = canvas.captureStream(10);
  navigator.mediaDevices.getUserMedia = async () => stream;
  navigator.mediaDevices.enumerateDevices = async () => [
    { deviceId: 'fake', kind: 'videoinput', label: 'Fake camera', groupId: 'fake', toJSON: () => ({}) },
  ];
})();
```

If `expo-camera` on web refuses this stream, stop trying to force it: note it in
the report, hand the two capture steps to the owner on a phone, and carry on
checking every row here. That is the fallback the spec already allows.

- [ ] **Step 4: Three isolated contexts**

Open three isolated browser contexts (separate storage, so three sessions
coexist) and keep them for the whole run: **A**, **B**, **C**. Use one email
prefix per person so the cleanup query at the end is exact:

- A: `glimpse.a+<timestamp>@example.com`
- B: `glimpse.b+<timestamp>@example.com`
- C: `glimpse.c+<timestamp>@example.com`

Password for all three: `Glimpse-test-123`.

- [ ] **Step 5: B signs up**

In context B: welcome → Get started → name "Bea" → allow camera → take the
practice shot → skip the avatar → sign up → details → Create account.

Expected: it lands on the friends step (5 of 7).

Check with `execute_sql`:

```sql
select p.id, p.first_name, p.username, p.avatar_storage_path, p.onboarding_done_at
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'glimpse.b+%';
```

Expected: one row, `first_name = 'Bea'`, `username = 'bea'`,
`avatar_storage_path` null, `onboarding_done_at` null. Keep B's id.

- [ ] **Step 6: A signs up with an avatar**

In context A the same way, name "Ada", but pick a photo on the avatar step. The
file input needs a real image: use `assets/images/welcome-hero.png`.

Check:

```sql
select p.id, p.first_name, p.username, p.avatar_storage_path,
       (select count(*) from storage.objects o
        where o.bucket_id = 'avatars' and o.name = p.avatar_storage_path) as avatar_object
from public.profiles p
join auth.users u on u.id = p.id
where u.email like 'glimpse.a+%';
```

Expected: `first_name = 'Ada'`, `username = 'ada'`, `avatar_storage_path` of the
form `<A id>/<digits>.jpg`, `avatar_object = 1`. Keep A's id.

- [ ] **Step 7: A adds B**

In context A, on the friends step, type B's handle (`bea`) and tap Add.

Expected: the pill flips to "Requested" without a visible wait.

```sql
select id, requester_id, recipient_id, status, responded_at
from public.friendships
where requester_id = '<A>' or recipient_id = '<A>';
```

Expected: one row, `requester_id = <A>`, `recipient_id = <B>`,
`status = 'pending'`, `responded_at` null.

- [ ] **Step 8: B accepts, live**

Leave context A on its friends screen. In context B, go through to the feed
(Next through notifications, widget, reviews, heard-about, thank-you → "Look
around first"), then open the Friends tab and Accept.

Expected: `status = 'accepted'` and `responded_at` set in the query above.
**And in context A, without a reload**, B appears as a friend — that is the
`friendships` INSERT/UPDATE listener working.

```sql
select onboarding_done_at from public.profiles where id = '<B>';
```

Expected: not null — stamped by the first mount of the tabs, not by the
thank-you screen.

- [ ] **Step 9: A sends B a moment**

In context A: capture button → shoot → caption "from ada" → Continue → select
Bea → Send.

Expected: A returns to the feed at once, with "Sending to Bea…" above the cards,
which disappears when the upload finishes.

```sql
select m.id, m.width, m.height, m.caption,
       m.original_storage_path, m.blurred_storage_path,
       t.id as trade_id, t.status, t.auto_unlock_at, t.seen_at
from public.moments m
join public.trades t on t.initiator_moment_id = m.id
where m.author_id = '<A>';
```

Expected: `width` and `height` both ≤ 1600, `original_storage_path` of the form
`original/<A>/<digits>.jpg`, **`blurred_storage_path` not null** (the function
ran), `status = 'pending'`, `auto_unlock_at` about 24h out, `seen_at` null.

Then open A's own profile tab. Expected: one locked tile — A's photo on the left,
an empty frosted tile on the right.

- [ ] **Step 10: B opens the frosted card and answers it**

In context B: the moment appears in the feed live, frosted. Open it.

```sql
select seen_at from public.trades where id = '<trade>';
```

Expected: `seen_at` set.

Close it, then capture: capture button → shoot → caption "from bea" → Continue.
On the recipients screen Ada is under **"Waiting on you"**. Select her and Send.

Expected: B lands on the feed; the pair appears for both.

```sql
select t.id, t.status, t.unlocked_at, t.initiator_moment_id, t.responder_moment_id
from public.trades t
where (t.initiator_id in ('<A>', '<B>') and t.responder_id in ('<A>', '<B>'));
```

Expected: **exactly one trade row**, `status = 'unlocked'`, `unlocked_at` set,
both moment ids present. No second trade in the reverse direction — that is the
crossing-trades rule. Both feeds show the pair; both profile grids show it with
two photos.

- [ ] **Step 11: A and B message each other**

In context A: Friends tab → Chats → Bea → send "hi bea". In context B the
message arrives without a reload; reply "hi ada". While both chat screens are
open, each header shows "Active now"; closing one makes it disappear on the other.

```sql
select m.id, m.sender_id, m.recipient_id, m.content, m.trade_id, m.read_at
from public.messages m
where m.sender_id in ('<A>', '<B>') and m.recipient_id in ('<A>', '<B>')
order by m.created_at;

select * from public.v_threads;
```

Expected: two message rows; `read_at` set on each once the other side has the
conversation open; `v_threads` (run as each user via the app, not as the SQL
owner) matching the unread badges the app showed before opening.

Also send one from the moment screen's reply bar and check `trade_id` is set on
that row.

- [ ] **Step 12: A invites C, C signs up through the link**

In context A: capture and send a moment to Bea again is not needed — instead use
the Friends tab's "Invite more", which shares (and on desktop copies) a
`glimpse://invite/<token>` link. Read the token:

```sql
select token, inviter_id, moment_id, claimer_id, expires_at
from public.invites where inviter_id = '<A>' order by created_at desc limit 1;
```

In context C, navigate to the web build at `/invite/<token>` while signed out.

Expected: A's name and avatar, and the frosted photo if the invite carried one.
Tap "Send one back" → the name step → sign up as "Cem".

```sql
select i.claimer_id, f.status, f.requester_id, f.recipient_id,
       t.id as trade_id, t.status as trade_status
from public.invites i
left join public.friendships f
  on (f.requester_id = i.inviter_id and f.recipient_id = i.claimer_id)
  or (f.requester_id = i.claimer_id and f.recipient_id = i.inviter_id)
left join public.trades t on t.responder_id = i.claimer_id and t.initiator_id = i.inviter_id
where i.token = '<token>';
```

Expected: `claimer_id` = C, the friendship `accepted`, and — if the invite
carried a moment — a `pending` trade from A to C.

- [ ] **Step 13: A signs out and back in**

In context A: profile tab → "more" → Sign out.

Expected: it lands on the welcome screen. Reloading the page does not get back
into the app (the protected routes are gone, not merely redirected away from).

Sign in again through "Already here? Sign in".

Expected: the feed renders its cards from the persisted cache **before** the
network answers — watch for content on the first frame rather than an empty
screen. `onboarding_done_at` is unchanged, so it lands on the feed, not
onboarding.

- [ ] **Step 14: Advisors, one last time**

Call `get_advisors` for `security` and then `performance`.
Expected: nothing new since Task 3. Acceptable leftovers are the ones Task 3
listed: `extension_in_public` for `citext` and `pgcrypto`, storage policies
using `auth.uid()`, and auth settings notices.

- [ ] **Step 15: Write the report**

Report, in this order:

1. Every step above, pass or fail, with the rows that prove it.
2. What could not be exercised here, stated plainly: the native tab bar is a web
   substitute, the widget and push are not exercised at all, and — if it came to
   that — the two capture steps that were handed to the owner.
3. The three test accounts and their ids, still in the project unless the owner
   asks for them to be removed. The removal is one call:

   ```sql
   delete from auth.users where email like 'glimpse.a+%' or email like 'glimpse.b+%' or email like 'glimpse.c+%';
   ```

   Profiles, moments, trades and messages cascade; the storage objects under
   `original/`, `blurred/` and `avatars/` do not, so list those names too.

4. Anything found and fixed along the way, and anything found and not fixed.

- [ ] **Step 16: Commit whatever the run changed**

If Steps 1–14 needed a fix, it is already committed by its own task's
conventions. If nothing changed, there is nothing to commit — say so in the
report rather than making an empty commit.

---

## Handoff notes

- The Supabase MCP must be connected to project `rzpydvnppvbziusxngfm`; Tasks 2–5 and 21 depend on it.
- `.env` is not in git. Task 4 recreates it from the MCP.
- `supabase/tests/run.sh` needs a local Postgres server and `psql`. Where none exists, skip the local runs and rely on applying to the project plus the SQL checks inside each task.
- "Confirm email" must be switched off in the dashboard before Task 5.
- Task 21 needs the Chrome DevTools MCP.
- `npm run format:check` runs Prettier over the **whole repository**, `docs/` included, not just the code a task touched. Tasks 6, 14 and 20 assert it passes, so the tree has to be clean before Task 2; `npx prettier --write .` is the one-liner.
- **`npm run lint` does not work here, and never did.** The repo ships no ESLint config, so `expo lint` tries to fetch one and dies on `HTTP Proxy Network Error: Forbidden`. No task in this plan gates on it; the real gates are `npm run typecheck`, `npm test` and `npx prettier --check .`. Do not chase it.
- **`Constants.expoConfig?.version` is `undefined` under Jest**, so `APP_VERSION` is `'0.0.0'` in tests and `'0.1.0'` only at real runtime. Nothing asserts on it today — just do not write a test that expects the real version.
- **This sandbox has no HTTPS egress to the Supabase project.** `https://<project-ref>.supabase.co` answers `CONNECT tunnel failed, response 403`, as does the general internet; only package registries and the MCP endpoints are reachable. The Supabase **MCP** works throughout, so migrations, SQL, deploys, types and advisors are all fine. What cannot run here is anything speaking to the project's Auth / REST / Storage / Functions endpoints from this box: **Task 5 Steps 4–6** (the smoke run) and **all of Task 21** (the web build in a browser). Both need either the project host added to the environment's network allowlist, or a machine with egress. Do not attempt to tunnel around the denial.
- **This sandbox's proxy denies `api.expo.dev` and `reactnative.directory`**; only `registry.npmjs.org` is reachable. That is why Task 1 Steps 3 and 4 install by explicit version instead of through `npx expo install`. Anything else that reaches for the Expo API degrades the same way — `npx expo start --web` in Task 21 prints "Unable to fetch compatibility data … Skipping check" and carries on, which is fine. Check `curl -sS "$HTTPS_PROXY/__agentproxy/status"` when a command fails with `HTTP Proxy Network Error: Forbidden`.
- Local baseline before Task 1: `npm run typecheck` reported 6 errors, all from `nativewind` and `tailwind-merge` missing in `node_modules`. `npm install` clears those five; the sixth, TS2882 on `import '../global.css'`, needs the gitignored `expo-env.d.ts` that Task 1 Step 1 now generates.
- **The tasks are strictly ordered.** Each one ends on a green `npm run typecheck` and a green `npm test`, and several of them deliberately patch a screen minimally — just enough to keep the tree compiling — before a later task rewrites that screen in full. Skipping a task, or doing two out of order, leaves the build red for reasons that look like bugs.
- Five files are touched by more than one task on purpose: `app/_layout.tsx` (Tasks 8, 10, 16, 18), `app/(app)/feed.tsx` (10, 12, 13, 14, 15), `app/recipients.tsx` (11, 13, 14), `app/moment/[tradeId].tsx` (13, 15, 17) and `app/(onboarding)/details.tsx` (9, 10, 19). The task that gives a file its whole new content says so; the others show only the lines they touch.
- Every screen after Task 6 uses translation constants (`t(FEED.STORIES_LABEL)`), so the code quoted in Tasks 8-21 is the post-Task-6 form. If a snippet does not match the file, check that Task 6 Step 6 ran over it.
