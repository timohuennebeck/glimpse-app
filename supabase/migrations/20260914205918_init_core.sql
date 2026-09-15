-- Glimpse core schema.
-- See docs/database.md for the reasoning behind the trade-centric model.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Tunables that encode product decisions, so they are not scattered in clients.
-- ---------------------------------------------------------------------------
create table public.app_config (
  key   text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_config (key, value) values
  -- Positioning note, open question 02: an unsent trade unlocks on its own
  -- rather than nagging forever. 24h is the current answer.
  ('trade_auto_unlock_hours', '24'::jsonb),
  -- Positioning note, "What to cut": no large friend lists.
  ('max_friends', '20'::jsonb),
  -- Paywall: "unlimited history instead of 30 days". Pairs older than this
  -- are hidden from v_pairs for anyone without Plus; nothing is deleted.
  ('free_history_days', '30'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          citext unique
                      check (username ~ '^[a-z0-9_.]{3,20}$'),
  first_name        text not null default '',
  avatar_storage_path text,
  tagline           text,
  locale            text not null default 'en',
  -- Entitlement mirror. RevenueCat is the source of truth; its webhook writes
  -- this flag with the service role. Clients cannot update it (column grant).
  is_plus           boolean not null default false,
  -- Onboarding screen 12 ("Wo hast du von Glimpse gehört?").
  heard_about       text,
  onboarding_done_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.profiles.avatar_storage_path is
  'Object key inside the public `avatars` bucket, not a URL.';
comment on column public.profiles.username is
  'Generated from first_name on signup (handle_new_user); the owner may change it.';

-- ---------------------------------------------------------------------------
-- user_blocks (checked by the friend/message policies below)
-- ---------------------------------------------------------------------------
create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- friendships: one row per directed request
--
-- There is no 'declined' state: declining deletes the row. A kept row would
-- tell the requester they were declined, and the unique pair index below
-- would block the pair from ever trying again.
-- ---------------------------------------------------------------------------
create type public.friendship_status as enum ('pending', 'accepted');

create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status       public.friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  -- Stamped on accept.
  responded_at timestamptz,
  constraint friendship_not_self check (requester_id <> recipient_id)
);

-- A pair may only have one relationship row regardless of who asked first.
create unique index friendships_unique_pair
  on public.friendships (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create index friendships_requester_idx on public.friendships (requester_id, status);
create index friendships_recipient_idx on public.friendships (recipient_id, status);

-- ---------------------------------------------------------------------------
-- moments: a single captured photo
-- ---------------------------------------------------------------------------
create table public.moments (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  -- Object keys in the private `moments` bucket. Which one a caller may sign
  -- is decided by public.visible_moment_paths() and enforced by storage RLS.
  original_storage_path text not null,
  blurred_storage_path  text,
  caption      text check (char_length(caption) <= 280),
  -- Pixel size of the original, so a card can reserve the right aspect ratio
  -- before the image (or its blurred rendition) has loaded.
  width        int check (width > 0),
  height       int check (height > 0),
  created_at   timestamptz not null default now(),
  -- A row may only ever name objects under its author's own prefix. Without
  -- this, anyone could insert a row pointing at someone else's photo and the
  -- storage policy would treat "author of a row naming that path" as
  -- permission to sign it.
  constraint moments_original_under_author check (
    original_storage_path = 'original/' || author_id::text || '/' || split_part(original_storage_path, '/', 3)
    and split_part(original_storage_path, '/', 3) <> ''
  ),
  constraint moments_blurred_under_author check (
    blurred_storage_path is null
    or blurred_storage_path = 'blurred/' || author_id::text || '/' || split_part(blurred_storage_path, '/', 3)
  ),
  constraint moments_original_storage_path_unique unique (original_storage_path),
  constraint moments_blurred_storage_path_unique unique (blurred_storage_path)
);

create index moments_author_idx on public.moments (author_id, created_at desc);

-- ---------------------------------------------------------------------------
-- trades: THE core table. See docs/database.md section 2.
-- ---------------------------------------------------------------------------
create type public.trade_status as enum ('pending', 'unlocked', 'expired');

create table public.trades (
  id                  uuid primary key default gen_random_uuid(),
  initiator_id        uuid not null references public.profiles(id) on delete cascade,
  responder_id        uuid not null references public.profiles(id) on delete cascade,
  -- RESTRICT: a party deleting their half after the unlock must not leave the
  -- other party's original open with nothing traded for it.
  initiator_moment_id uuid not null references public.moments(id) on delete restrict,
  responder_moment_id uuid references public.moments(id) on delete restrict,
  status              public.trade_status not null default 'pending',
  -- The soft escape from the positioning note.
  auto_unlock_at      timestamptz,
  unlocked_at         timestamptz,
  -- Set when the responder first views the frosted card, for "gesehen" state.
  seen_at             timestamptz,
  created_at          timestamptz not null default now(),
  constraint trade_not_self check (initiator_id <> responder_id),
  -- An unlocked trade always carries the time it unlocked.
  constraint trade_unlocked_has_time check (status <> 'unlocked' or unlocked_at is not null)
);

create index trades_responder_pending_idx
  on public.trades (responder_id, status, created_at desc);
create index trades_initiator_idx
  on public.trades (initiator_id, created_at desc);
-- One lock per (photo, recipient): sending twice must not create two.
create unique index trades_moment_recipient_uq
  on public.trades (initiator_moment_id, responder_id);
-- The policies and can_see_* predicates look trades up by moment.
create index trades_initiator_moment_idx on public.trades (initiator_moment_id);
create index trades_responder_moment_idx on public.trades (responder_moment_id);
-- Profile grid (screen 07b) reads completed pairs between two people by date.
create index trades_pair_idx
  on public.trades (least(initiator_id, responder_id), greatest(initiator_id, responder_id), created_at desc);

-- ---------------------------------------------------------------------------
-- messages: 1:1 chat, optionally carrying a moment
-- ---------------------------------------------------------------------------
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content     text check (char_length(content) <= 2000),
  moment_id   uuid references public.moments(id) on delete set null,
  trade_id    uuid references public.trades(id) on delete set null,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  constraint message_not_self check (sender_id <> recipient_id),
  constraint message_has_content check (content is not null or moment_id is not null)
);

-- Thread lookup is "all messages between these two, newest first".
create index messages_pair_idx
  on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);
create index messages_unread_idx
  on public.messages (recipient_id, read_at) where read_at is null;
create index messages_sender_idx on public.messages (sender_id, created_at desc);
create index messages_recipient_idx on public.messages (recipient_id, created_at desc);

-- ---------------------------------------------------------------------------
-- device_tokens: push targets (used to tell the app to refresh its widget)
-- ---------------------------------------------------------------------------
create table public.device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  unique (token)
);

-- ---------------------------------------------------------------------------
-- invites: deeplink for screen E, before the recipient has an account
-- ---------------------------------------------------------------------------
create table public.invites (
  -- hex: base64 emits '/' and '+', which break deep links.
  token       text primary key default encode(gen_random_bytes(16), 'hex'),
  inviter_id  uuid not null references public.profiles(id) on delete cascade,
  moment_id   uuid references public.moments(id) on delete set null,
  claimer_id  uuid references public.profiles(id) on delete set null,
  claimed_at  timestamptz,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- reports: safety queue
-- ---------------------------------------------------------------------------
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  subject_user_id uuid references public.profiles(id) on delete cascade,
  moment_id     uuid references public.moments(id) on delete cascade,
  reason        text not null,
  created_at    timestamptz not null default now()
);
