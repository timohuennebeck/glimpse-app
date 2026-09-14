# Database Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every fixture and fake call in the Glimpse Expo app with the real Supabase project, with optimistic updates, a persisted cache, live updates and typed translation keys, then prove it by clicking through the web build with the rows checked after each step.

**Architecture:** Each feature owns `data/<feature>-api.ts` (Supabase calls), `data/<feature>-queries.ts` (query key factory) and `data/<feature>-mutations.ts` (optimistic `useMutation` hooks). Pure logic (key trees, cache patches, selectors, the outbox runner, live-event mapping) lives in small files with Jest tests. Screens only talk to those modules. Backend changes ship as append-only migrations and one Edge Function, all applied through the Supabase MCP.

**Tech Stack:** Expo SDK 57, expo-router 57, React Native 0.86, TanStack Query 5.102 with `@lukemorales/query-key-factory`, supabase-js 2.116, Supabase Postgres 17 + Storage + Realtime + Edge Functions (Deno), jest-expo 57, i18n-js.

**Spec:** `docs/superpowers/specs/2026-09-14-database-wiring-design.md`

> **Status (2026-09-14):** Tasks 1–7 are written in full. Tasks 8–21 are outlined at the end of this file with the design decisions they depend on; expand each into full steps before executing it. **Nothing in this plan has been executed yet.** See "Handoff notes" at the end before starting in a new environment.

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
- Out of scope: push notifications, contacts import, chat attachments, universal links, Google sign-in, RevenueCat, blocking and reporting UI, the native widget module, password reset, account deletion, editing name and tagline, message pagination.
- Commit subjects use a conventional prefix (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`) and every commit message ends with:

  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC
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

| Path | Responsibility |
| --- | --- |
| `jest.config` block in `package.json` | Jest preset and `@/` alias |
| `supabase/tests/stubs.sql` | Local stand-ins for `auth`, `storage`, `realtime` schemas |
| `supabase/tests/run.sh` | Apply all migrations to a throwaway local DB, run SQL test files |
| `supabase/tests/core.test.sql` | Username generation, decline-as-delete, invite claim |
| `supabase/tests/app-wiring.test.sql` | Publication, batch mutual counts, presence policies |
| `supabase/migrations/<version>_app_wiring.sql` | Realtime publication, `mutual_friends_counts`, presence policies, advisor fixes |
| `supabase/functions/blur-moment/index.ts` | Server-side blurred rendition |
| `src/shared/lib/database.types.ts` | Row aliases over the generated schema, hand-typed view rows |
| `src/shared/i18n/keys.ts` (+ test) | Typed SCREAMING_SNAKE key constants |
| `src/shared/lib/optimistic.ts` (+ test) | Snapshot, patch, roll back, invalidate |
| `src/shared/lib/signed-urls.ts` (+ test) | Signed URL cache with injectable store and signer |
| `src/shared/lib/resize.ts` (+ test) | `fitWithin` and `resizeJpeg` |
| `src/shared/lib/use-debounced-value.ts` | Debounce hook for search |
| `src/shared/ui/dotted-disc.tsx` | The dotted purple disc, shared by avatar step and placeholder |
| `src/features/auth/hooks/use-session.ts` | Session store fed by Supabase auth |
| `src/features/auth/entry-route.ts` (+ test) | Where the app opens for a session and profile |
| `src/features/auth/interpret-sign-up.ts` (+ test) | Pure reading of Supabase's sign-up response |
| `src/features/auth/data/auth-api.ts` | Sign up, sign in |
| `src/features/profile/hooks/use-me.ts` | The signed-in user's profile via `profile.byId` |
| `src/shared/lib/store.ts` | The small external store, moved from `src/features/moments/hooks/store.ts` |
| `src/features/auth/sign-out.ts` | Sign out and clear every cache and store |
| `src/features/auth/current-user.ts` | `currentUserId()` for data modules |
| `src/features/onboarding/hooks/use-onboarding-draft.ts` | First name and avatar before the account exists |
| `src/features/profile/data/profile-api.ts`, `profile-queries.ts`, `profile-mutations.ts` | Profile reads, updates, avatar upload |
| `src/features/profile/hooks/use-stamp-onboarding-done.ts` | Stamps `onboarding_done_at` on first tabs mount |
| `src/features/profile/components/profile-actions-sheet.tsx` | In-app sheet with Sign out |
| `src/features/friends/interfaces.ts` | `PersonSummary`, `FriendshipWithPeople`, `Relationship` |
| `src/features/friends/relationships.ts` (+ test) | Selectors over my friendships |
| `src/features/friends/data/friends-mutations.ts` | Send, accept, remove with optimistic patches |
| `src/features/friends/components/relationship-pill.tsx` | Add / Requested / Friends / Accept |
| `src/features/moments/selectors.ts` (+ test) | `nextUnlockDelay`, `lockedTiles`, `waitingBySender`, `splitSelection` |
| `src/features/moments/data/moment-urls.ts` | App instance of the signed URL cache |
| `src/features/moments/data/moments-mutations.ts` | Mark seen |
| `src/features/moments/outbox.ts` (+ test) | Outbox entry type and `runEntry` |
| `src/features/moments/hooks/use-outbox.ts` | Outbox store, enqueue, retry |
| `src/features/feed/components/outbox-line.tsx` | "Sending to Mia…" / "Couldn't send · Retry" |
| `src/features/chat/interfaces.ts` | `ChatMessage`, `Thread` |
| `src/features/chat/messages.ts` (+ test) | `appendMessage`, `pairKey` |
| `src/features/chat/data/chat-api.ts`, `chat-queries.ts`, `chat-mutations.ts` | Threads, messages, send, mark read |
| `src/features/chat/hooks/use-partner-presence.ts` | Conversation presence |
| `src/features/live/live-actions.ts` (+ test) | Realtime payload → semantic actions |
| `src/features/live/use-live-updates.ts` | One channel per user, applies actions to the cache |
| `src/features/invites/data/invites-api.ts`, `invites-queries.ts` | Create, preview, claim |
| `src/features/invites/share-invite.ts` | Create an invite and share or copy the link |
| `src/features/invites/hooks/use-pending-invite.ts` | Token held while a signed-out visitor onboards |
| `src/shared/lib/assets.ts` | Bundled design images that remain after fixtures go |

Modified: `package.json`, `app.json`, `src/shared/lib/supabase.ts`, `src/shared/lib/database.interfaces.ts` (regenerated), `src/shared/lib/queries.ts`, `src/shared/lib/query-client.ts`, `src/shared/lib/error-message.ts`, `src/shared/i18n/i18n.ts`, both locale files, `src/shared/ui/avatar.tsx`, every screen under `app/`, `src/features/*/components/*` that render people or photos, `README.md`, `docs/database.md`.

Deleted at the end: `src/shared/lib/fixtures.ts`, `src/features/onboarding/components/contacts-invite.tsx`, `src/features/friends/data/friends-queries.ts` (replaced), `src/features/moments/hooks/use-inbox.ts` (moved into `moments-queries.ts`).

---

### Task 1: Dependencies and test tooling

**Files:**
- Modify: `package.json`, `app.json`
- Create: `src/shared/lib/format.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Jest over `src/**/*.test.ts` with the `@/` alias. Packages `expo-image-picker`, `expo-crypto`, `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` installed.

- [ ] **Step 1: Install the existing dependencies**

Run: `npm install`
Expected: exits 0. `ls node_modules/nativewind node_modules/tailwind-merge node_modules/prettier-plugin-tailwindcss` lists all three.

- [ ] **Step 2: Confirm the baseline is clean**

Run: `npm run typecheck`
Expected: exits 0 with no output. If any error remains, stop and report it; later tasks assume a clean baseline.

- [ ] **Step 3: Add the runtime packages**

Run:

```bash
npx expo install expo-image-picker expo-crypto
npm install @tanstack/react-query-persist-client@5.102.8 @tanstack/query-async-storage-persister@5.102.8
```

Expected: both exit 0; `package.json` lists the four packages.

- [ ] **Step 4: Add the test packages**

Run: `npx expo install jest-expo jest @types/jest @react-native/jest-preset -- --save-dev`
Expected: exits 0; the four appear under `devDependencies`.

- [ ] **Step 5: Configure Jest**

In `package.json`, add to `"scripts"`:

```json
"test": "jest"
```

and add a top-level block:

```json
"jest": {
  "preset": "jest-expo",
  "testMatch": ["<rootDir>/src/**/*.test.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
```

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
git add package.json package-lock.json app.json src/shared/lib/format.test.ts
git commit -m "chore: add image picker, crypto, query persistence and jest-expo" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
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
# for the Supabase-managed schemas, then runs the SQL test files given as
# arguments. Needs a local Postgres server and psql on PATH.
set -euo pipefail
cd "$(dirname "$0")/../.."

DB=glimpse_migration_check
dropdb --if-exists "$DB" >/dev/null 2>&1
createdb "$DB"
trap 'dropdb --if-exists "$DB" >/dev/null 2>&1' EXIT

psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/stubs.sql
for migration in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$migration"
done
for test in "$@"; do
  echo "== $test"
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$test"
done
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

| File | `name` |
| --- | --- |
| `supabase/migrations/20260913120000_init_core.sql` | `init_core` |
| `supabase/migrations/20260913120100_functions_triggers.sql` | `functions_triggers` |
| `supabase/migrations/20260913120200_rls.sql` | `rls` |
| `supabase/migrations/20260913120300_storage_and_views.sql` | `storage_and_views` |

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
git commit -m "chore: apply the schema to the Supabase project and add a local migration harness" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
```

---

### Task 3: The `app_wiring` migration

**Files:**
- Create: `supabase/migrations/20260914200000_app_wiring.sql` (renamed to the remote version in Step 6)
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

Create `supabase/migrations/20260914200000_app_wiring.sql`:

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
Expected: `function_search_path_mutable`, `unindexed_foreign_keys` and `auth_rls_initplan` for public tables are gone. Remaining acceptable findings: `extension_in_public` (citext and pgcrypto), storage policies using `auth.uid()`, auth settings notices such as leaked-password protection. Anything else: add a fix as a new migration following Steps 1–5 before continuing.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations supabase/tests/app-wiring.test.sql
git commit -m "feat: realtime publication, batch mutual counts and private chat presence" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
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
git commit -m "refactor: generated database types and an always-configured Supabase client" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
```

---

### Task 5: The `blur-moment` Edge Function

**Files:**
- Create: `supabase/functions/blur-moment/index.ts`, `scripts/smoke-blur.mjs`

**Interfaces:**
- Consumes: `.env` from Task 4; buckets and `moments` table from Task 2.
- Produces: `POST /functions/v1/blur-moment` with body `{ "moment_id": "<uuid>" }` and the caller's session JWT. Returns `200 { "blurred_storage_path": "blurred/<author>/<file>" }`; `401` without a valid session; `403 { "error": "not_moment_author" }` for someone else's moment. Idempotent: a second call returns the existing path.

**Prerequisite:** "Confirm email" is off (Authentication → Providers → Email). If the smoke script in Step 4 reports "No session", stop and ask the owner to switch it off.

- [ ] **Step 1: Write the function**

Create `supabase/functions/blur-moment/index.ts`:

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
    return await Deno.readFile(new URL(import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.43/magick.wasm')));
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
if (!signUp.session) throw new Error('No session: switch off "Confirm email" in Authentication → Providers → Email.');
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
sips -s format jpeg assets/images/p-beach.png --out "$TMPDIR/glimpse-smoke.jpg" >/dev/null
node scripts/smoke-blur.mjs "$TMPDIR/glimpse-smoke.jpg"
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
git add supabase/functions/blur-moment/index.ts scripts/smoke-blur.mjs
git commit -m "feat: blur-moment edge function for server-made frosted renditions" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
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
  - New strings used by later tasks: `ONBOARDING.DETAILS.SIGN_IN_TITLE`, `SIGN_IN_SUBTITLE`, `SIGN_IN_CTA`, `NO_ACCOUNT`, `CREATE_ACCOUNT`, `ERRORS.ALREADY_REGISTERED`, `ERRORS.CONFIRMATION_REQUIRED` (under `ONBOARDING.DETAILS`); `FEED.OUTBOX.SENDING`, `FEED.OUTBOX.FAILED`, `FEED.OUTBOX.RETRY`; `FRIENDS.WITHDRAW`; `PROFILE.SIGN_OUT`; `INVITE.SHARE_MESSAGE`; `COMMON.COPIED`; `ERRORS.FRIEND_CAP_REACHED`, `ERRORS.NOT_FRIENDS`, `ERRORS.TRADE_ALREADY_ANSWERED`, `ERRORS.TRADE_EXPIRED`.
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
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();
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

const snake = (key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase();
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
{t(key === 'friends' ? FRIENDS.TAB_FRIENDS : FRIENDS.TAB_CHATS)}
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

After `signIn: 'Anmelden',` inside `details`, add:

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
git commit -m "refactor: typed translation key constants and the strings the wiring needs" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
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
  return { queryKey, update: (old, variables) => (old === undefined ? old : update(old as TData, variables)) };
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
import { createSignedUrlCache, KeyValueStore, RESIGN_BELOW_MS, SIGN_TTL_SECONDS } from '@/shared/lib/signed-urls';

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
    paths.map((path) => ({ path, signedUrl: path === 'missing' ? null : `https://signed/${path}?at=${clock.now}` })),
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
git commit -m "feat: optimistic cache patch helper and a stable signed URL cache" -m "Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XKE3Z4Mi437u3iDrbumuSC"
```

---

## Remaining tasks (outline)

Each outline below fixes the files, names and decisions for that task. Expand it into full TDD steps in the same format as Tasks 1–7 before executing it.

### Task 8: Session, protected routes, persisted cache
- Move `src/features/moments/hooks/store.ts` to `src/shared/lib/store.ts`; update the import in `use-composer.ts`.
- `src/features/auth/hooks/use-session.ts`: store `{ status: 'loading' | 'signed-out' | 'signed-in'; userId: string | null }` and `startSessionSync(): () => void` (initial `auth.getSession()` plus `onAuthStateChange`; only sets state inside the callback).
- `src/features/auth/current-user.ts`: `currentUserId(): string`, throws `not_authenticated` when signed out.
- `src/features/auth/entry-route.ts` (+ test): `entryRoute({ status, onboardingDoneAt, profileFailed })` returns `null` while loading or while the profile is unknown, `'/(onboarding)/welcome'` signed out, `'/(app)/feed'` when done or when the profile failed to load, `'/(onboarding)/friends'` when not done.
- Profile read side lands here: `profile-api.fetchProfile(userId): Promise<Profile | null>`; `profile-queries` has only `byId(userId)` — no user-less `me` key, so a persisted profile can never belong to a previous user; `hooks/use-me.ts` = `useQuery({ ...queries.profile.byId(userId ?? ''), enabled: userId !== null })`.
- `src/shared/lib/query-client.ts`: default `gcTime` 24h; export `PERSIST_MAX_AGE`, `APP_VERSION` (from `expo-constants`), `queryPersister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'glimpse.query-cache', throttleTime: 1000 })`.
- `app/_layout.tsx`: `PersistQueryClientProvider` with `{ persister, maxAge, buster: APP_VERSION }`; `useEffect(() => startSessionSync(), [])`; keep the splash until fonts load and the session status is known; `Stack.Protected guard={signedIn}` around `(app)`, `camera`, `compose`, `recipients`, `moment/[tradeId]`, `photo/[momentId]`, `profile/[userId]`, `chat/[partnerId]`; `index`, `(onboarding)` and `invite/[token]` stay open.
- `app/index.tsx`: `<Redirect href={entryRoute(...)} />`, render nothing while it is `null`.

### Task 9: Sign up and sign in
- `src/shared/lib/resize.ts` (+ test, mock `expo-image-manipulator` in the test): `fitWithin(width, height, max)` never scales up; `resizeJpeg(uri, { width, height }, max)` uses `ImageManipulator.manipulate(uri)`, `.resize(target)` when needed, `.renderAsync()`, then `saveAsync({ compress: 0.85, format: SaveFormat.JPEG })`.
- `src/features/auth/interpret-sign-up.ts` (+ test): `SignUpOutcome = { kind: 'signed-in'; userId } | { kind: 'confirmation-required' } | { kind: 'already-registered' }`. Error with `code === 'user_already_exists'` or message matching "already registered" → already registered; other errors rethrow; user and session → signed in; user with `identities` of length 0 → already registered; otherwise confirmation required.
- `src/features/auth/data/auth-api.ts`: `signUp({ email, password, firstName, locale })` passes `options.data = { first_name, locale }`; `signIn({ email, password })`. Both call `useSession.set({ status: 'signed-in', userId })` on success so `currentUserId()` works before `onAuthStateChange` fires.
- `src/features/onboarding/hooks/use-onboarding-draft.ts`: `{ firstName: string; avatar: { uri: string; width: number; height: number } | null }`.
- Name screen reads and writes `firstName`. Avatar screen opens `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 })` and stores the asset. Welcome "Sign in" pushes details with `params: { mode: 'signin' }`.
- Details screen: one form with `mode` state (from params, toggled by the footer link); sign-up with no draft name pushes the name step; `already-registered` and `confirmation-required` show `ONBOARDING.DETAILS.ERRORS.*` and switch to sign-in; sign-up success → `router.replace('/(onboarding)/friends')`; sign-in success → `router.replace('/')`. The button shows `loading` while pending: authentication is the one request that cannot be optimistic.

### Task 10: Profile
- `profile-api`: `updateProfile(patch)`, `uploadAvatar({ uri, width, height })` (resize to 512, upload `avatars/{uid}/{Date.now()}.jpg` as an `ArrayBuffer` from `fetch(uri)`, update `avatar_storage_path`, delete the previous object), `avatarUrl(path: string | null): string | null` (public URL).
- `profile-mutations`: `useUpdateProfile()` merges the patch into `profile.byId(me)` optimistically.
- `src/shared/ui/dotted-disc.tsx` (moved out of the avatar step). `Avatar` accepts `source: string | number | null` and `name?: string`; without a source it draws the disc with the name's first letter.
- `hooks/use-stamp-onboarding-done.ts`, called in `app/(app)/_layout.tsx`: stamps `onboarding_done_at` once when the profile has none.
- `src/features/auth/sign-out.ts`: `clearUserData(queryClient)` (remove all Realtime channels, `queryClient.clear()`, `queryPersister.removeClient()`, reset composer and onboarding draft, clear the signed URL cache) and `signOut(queryClient)`. The root layout calls `clearUserData` whenever `userId` changes away from a previous non-null id, which also covers an expired session.
- `profile-actions-sheet.tsx`: React Native `Modal` with one `PROFILE.SIGN_OUT` row, opened by the own profile's more button (Alert is unusable on web).
- Details sign-up uploads `draft.avatar` right after a signed-in outcome. Heard-about writes `heard_about`. Feed header, own profile and friend profile read real profiles.

### Task 11: Friends data
- `interfaces.ts`: `PersonSummary { id; name; username: string | null; tagline: string | null; avatarUrl: string | null }`, `FriendshipWithPeople { id; status; createdAt; requester: PersonSummary; recipient: PersonSummary }`, `Relationship = { kind: 'none' } | { kind: 'friends' | 'sent' | 'received'; friendshipId: string }`.
- `relationships.ts` (+ test): `otherParty(f, me)`, `friendsOf(list, me)`, `incomingRequests(list, me)`, `sentRequests(list, me)`, `relationshipWith(list, me, otherId)`.
- `friends-api` (rewrite): `fetchFriendships()` is one select embedding `requester:profiles!friendships_requester_id_fkey(id, first_name, username, tagline, avatar_storage_path)` and the same for `recipient`; `searchProfiles(q)` strips `@`, matches `username.ilike.<q>%` or `first_name.ilike.<q>%`, excludes me, limit 20; `fetchMutualCounts(ids)` via `mutual_friends_counts`; `sendFriendRequest(userId)`, `acceptFriendRequest(id)`, `removeFriendship(id)`.
- `friends-queries` (replaces the old file): `all`, `search(query)`, `mutual(sortedIds)`.
- `friends-mutations`: `useSendFriendRequest` appends a pending row built from my profile and the person; `useAcceptFriendRequest` sets `accepted`; `useRemoveFriendship` filters the row out. All patch `friends.all` through `optimistic()`.

### Task 12: Friends screens
- `components/relationship-pill.tsx`: Add / Requested / Friends / Accept, wired to the mutations.
- `src/shared/lib/use-debounced-value.ts` (250ms).
- Onboarding step 5: real search input and results with pills; delete `ContactsInvite`; share row shows `@username`.
- Add friend screen: real search, `@username · N mutual` subtitles.
- Friends tab: rail from `friendsOf`, `waiting` when that friend has a frosted moment in my inbox; requests with mutual counts and Accept; sent requests where the first tap on Pending shows `FRIENDS.WITHDRAW` and the second removes; badges from the request count and the unread total (0 until Task 16).
- `openProfile(userId, myId)` replaces the `DEMO_USER_ID` check.

### Task 13: Moments data
- `data/moment-urls.ts`: `createSignedUrlCache(AsyncStorage, signer)` where the signer calls `storage.from('moments').createSignedUrls(paths, ttl)`. `signedMomentUrls(momentIds)` asks `visible_moment_paths` for the allowed path per moment, then reads URLs through the cache.
- `moments-api` (rewrite): inbox maps to `InboxMoment` with `from.avatarUrl` and `photo: string` (`''` when withheld); `fetchPairs(withUserId: string | null)`; `fetchOutgoingLocked()` (my trades as initiator with `responder_moment_id is null` and `status = 'pending'`); `fetchMomentPhoto`; `createMoment({ localUri, width, height, caption })` = resize to 1600 → upload `original/{uid}/{ts}.jpg` as `ArrayBuffer` → insert → `functions.invoke('blur-moment', { body: { moment_id } })` → id; `sendMoment`; `respondToTrade`; `markTradeSeen`.
- `selectors.ts` (+ test): `nextUnlockDelay(inbox, now): number | null`; `lockedTiles(trades, urls)` one tile per photo; `waitingBySender(inbox)` → `{ person, tradeId }` using each sender's oldest unanswered trade; `splitSelection(selectedIds, waiting)` → `{ replyToTradeIds, recipientIds }`.
- `moments-queries`: `inbox` with `refetchInterval: (query) => nextUnlockDelay(query.state.data ?? [], Date.now()) ?? false`; `pairs(withUserId)`; `outgoingLocked`; `photo(momentId)`. `use-inbox.ts` keeps its `pending` / `open` split on top.
- `moments-mutations`: `useMarkTradeSeen()` sets `seenAt` optimistically.

### Task 14: Outbox and the capture flow
- `outbox.ts` (+ test): `OutboxEntry { id; localUri; width; height; caption; replyToTradeIds; recipientIds; names; status: 'sending' | 'failed'; error: string | null; momentId: string | null; answeredTradeIds: string[] }`; `runEntry(entry, deps, onProgress)` creates the moment once, answers each trade once and sends once, recording progress so a retry skips finished steps (`send_moment` is already idempotent).
- `hooks/use-outbox.ts`: store plus `enqueueSend(input, queryClient)` (patches answered inbox items to `isOpen: true` at once) and `retrySend(id, queryClient)`; on success invalidate the `moments` keys, on failure restore the inbox and keep the entry as `failed`. Sign-out resets it.
- Compose: reply mode enqueues and opens `/moment/<tradeId>` immediately; fresh mode saves the caption and opens recipients.
- Recipients: "Waiting on you" from `waitingBySender`; the friends list excludes those people; selection is one list of person ids; send enqueues with `splitSelection` and returns to the feed.
- `src/features/feed/components/outbox-line.tsx` above the feed cards: `FEED.OUTBOX.SENDING` or `FEED.OUTBOX.FAILED` with `FEED.OUTBOX.RETRY`.

### Task 15: Feed, profile grid, moment and photo screens
- Feed: me plus pending senders in the story rail with real avatars; empty state only when I have no friends and an empty inbox; open moments grid.
- Profile: pairs plus `lockedTiles`, newest first; `MomentPair.rightMomentId` becomes nullable and `PairGrid` draws an empty frosted right tile.
- Moment screen: real avatar, `useMarkTradeSeen`, trade-back sets `composer.replyToTradeId`.
- Photo screen: real data through `moments.photo`.

### Task 16: Chat data
- `interfaces.ts`: `ChatMessage { id; senderId; recipientId; content; momentId; tradeId; createdAt; readAt; pending?: boolean }`, `Thread { partner: PersonSummary; lastMessageId; lastContent; lastMomentId; lastSenderId; lastAt; unreadCount; photo: string | null }`.
- `messages.ts` (+ test): `appendMessage(list, message)` dedupes by id and keeps `createdAt` order; `pairKey(a, b)` = lower id, colon, higher id.
- `chat-api`: `fetchThreads()` (`v_threads` with `overrideTypes<ThreadRow[]>`, partner profiles, thumbnails through `signedMomentUrls`), `fetchMessages(partnerId)` newest 200 then reversed, `sendMessage({ id, recipientId, content, tradeId })` with a client uuid from `expo-crypto` so the optimistic row already has its real id, `markThreadRead(partnerId)`.
- `chat-queries`: `threads`, `messages(partnerId)`. `chat-mutations`: `useSendMessage(partnerId)` appends a pending message and updates the thread; `useMarkThreadRead(partnerId)` zeroes the unread count and stamps `readAt`.
- Tab badge in `app/(app)/_layout.tsx` and the friends-tab chats badge use the unread total.

### Task 17: Chat screens and presence
- Chats list and chat screen on real data; the composer sends; opening a thread marks it read.
- `hooks/use-partner-presence.ts`: `supabase.channel('chat:' + pairKey(me, partnerId), { config: { private: true, presence: { key: me } } })`, `track()` on `SUBSCRIBED`, present while the partner's id is a key of `presenceState()`; remove the channel on unmount. "Active now" only while present.
- Moment screen reply bar sends a message with `trade_id`.

### Task 18: Live updates
- `src/features/live/live-actions.ts` (+ test): `actionsFor(event, me)` maps a Realtime payload to `inbox-changed`, `pairs-changed`, `outgoing-changed`, `friendships-changed`, `message-received { partnerId, message }` or `message-read { partnerId, messageId, readAt }`.
- `use-live-updates.ts`, mounted in the root layout while signed in: channel `user:<uid>` with listeners for trades INSERT and UPDATE filtered on `responder_id=eq.<uid>` and on `initiator_id=eq.<uid>`, messages INSERT on `recipient_id=eq.<uid>`, messages UPDATE on `sender_id=eq.<uid>`, friendships INSERT and UPDATE on `recipient_id=eq.<uid>` and on `requester_id=eq.<uid>`. No DELETE listeners. On a re-subscribe after a drop, invalidate every query once.

### Task 19: Invites
- `invites-api`: `createInvite(momentId?)` returns the token; `fetchInvitePreview(token)` calls `invite_preview` and signs the blurred path with `createSignedUrl`; `claimInvite(token)`; `inviteLink(token)` = `glimpse://invite/<token>`.
- `share-invite.ts`: create, then `Share.share({ message: t(INVITE.SHARE_MESSAGE, { name, link }) })`; where no share sheet exists, copy the link with `expo-clipboard`; returns `'shared' | 'copied'`, and share rows show `COMMON.COPIED` after a copy.
- `hooks/use-pending-invite.ts`. Invite screen: signed out stores the token and pushes the name step; signed in claims on open and replaces with the camera for the returned trade; a dead token shows `MOMENT.NOT_FOUND`. Details sign-up claims a pending token after the avatar upload.

### Task 20: Cleanup and docs
- `src/shared/lib/fixtures.ts` becomes `src/shared/lib/assets.ts` with only `ART`, `IOS_ICONS`, `PHOTOS.viewfinder`, `PHOTOS.widgetCard` and the review faces; delete every demo export, `ContactsInvite`, `isSupabaseConfigured` and `requireSupabase`.
- README: Postgres 17, `.env` required, `npm test`, blur function deployed, known issues updated. `docs/database.md`: Realtime publication, presence policies, blur function.

### Task 21: Verification
- The spec's Verification section, steps 6–8: web build in Chrome with three isolated contexts, a canvas-backed fake `getUserMedia` injected before opening the camera, row checks through the MCP after each step, and the report of what passed and what did not.

## Handoff notes

- The Supabase MCP must be connected to project `rzpydvnppvbziusxngfm`; Tasks 2–5 and 21 depend on it.
- `.env` is not in git. Task 4 recreates it from the MCP.
- `supabase/tests/run.sh` needs a local Postgres server and `psql`. Where none exists, skip the local runs and rely on applying to the project plus the SQL checks inside each task.
- "Confirm email" must be switched off in the dashboard before Task 5.
- Task 21 needs the Chrome DevTools MCP.
- Local baseline before Task 1: `npm run typecheck` reported 6 errors, all from `nativewind` and `tailwind-merge` missing in `node_modules`; `npm install` is expected to clear them.
