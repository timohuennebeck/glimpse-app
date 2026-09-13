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
  ('max_friends', '20'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          citext unique
                      check (username ~ '^[a-z0-9_.]{3,20}$'),
  display_name      text not null default '',
  avatar_path       text,
  tagline           text,
  locale            text not null default 'de',
  -- Onboarding screen 12 ("Wo hast du von Glimpse gehört?").
  heard_about       text,
  onboarding_done_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.profiles.avatar_path is
  'Object key inside the public `avatars` bucket, not a URL.';

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
-- ---------------------------------------------------------------------------
create type public.friendship_status as enum ('pending', 'accepted', 'declined');

create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status       public.friendship_status not null default 'pending',
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendship_not_self check (requester_id <> addressee_id)
);

-- A pair may only have one relationship row regardless of who asked first.
create unique index friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index friendships_requester_idx on public.friendships (requester_id, status);
create index friendships_addressee_idx on public.friendships (addressee_id, status);

-- ---------------------------------------------------------------------------
-- moments: a single captured photo
-- ---------------------------------------------------------------------------
create table public.moments (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  -- Object keys in the private `moments` bucket. Clients never build URLs;
  -- they call public.visible_moment_url() which signs the right rendition.
  original_path text not null,
  blurred_path  text,
  caption      text check (char_length(caption) <= 280),
  facing       text not null default 'back' check (facing in ('front', 'back')),
  width        int,
  height       int,
  captured_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
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
  initiator_moment_id uuid not null references public.moments(id) on delete cascade,
  responder_moment_id uuid references public.moments(id) on delete set null,
  status              public.trade_status not null default 'pending',
  -- The soft escape from the positioning note.
  auto_unlock_at      timestamptz,
  unlocked_at         timestamptz,
  -- Set when the responder first views the frosted card, for "gesehen" state.
  seen_at             timestamptz,
  created_at          timestamptz not null default now(),
  constraint trade_not_self check (initiator_id <> responder_id),
  -- An unlocked trade must have both halves, unless it unlocked on the timer.
  constraint trade_unlocked_has_time check (status <> 'unlocked' or unlocked_at is not null)
);

create index trades_responder_pending_idx
  on public.trades (responder_id, status, created_at desc);
create index trades_initiator_idx
  on public.trades (initiator_id, created_at desc);
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
  body        text check (char_length(body) <= 2000),
  moment_id   uuid references public.moments(id) on delete set null,
  trade_id    uuid references public.trades(id) on delete set null,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  constraint message_not_self check (sender_id <> recipient_id),
  constraint message_has_content check (body is not null or moment_id is not null)
);

-- Thread lookup is "all messages between these two, newest first".
create index messages_pair_idx
  on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);
create index messages_unread_idx
  on public.messages (recipient_id, read_at) where read_at is null;

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
-- referrals: "share your code" (10b) and "redeem partner code" (10a)
-- ---------------------------------------------------------------------------
create table public.referral_codes (
  code            text primary key check (code ~ '^[A-Z0-9]{3}-?[A-Z0-9]{3}$'),
  owner_id        uuid references public.profiles(id) on delete cascade,
  kind            text not null default 'personal' check (kind in ('personal', 'partner')),
  max_redemptions int,
  redemptions     int not null default 0,
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);

create table public.referral_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null references public.referral_codes(code) on delete cascade,
  redeemer_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  -- A person may only ever redeem one code.
  unique (redeemer_id)
);

-- ---------------------------------------------------------------------------
-- invites: deeplink for screen E, before the recipient has an account
-- ---------------------------------------------------------------------------
create table public.invites (
  token       text primary key default encode(gen_random_bytes(9), 'base64'),
  inviter_id  uuid not null references public.profiles(id) on delete cascade,
  moment_id   uuid references public.moments(id) on delete set null,
  claimed_by  uuid references public.profiles(id) on delete set null,
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
