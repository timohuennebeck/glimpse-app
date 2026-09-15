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
-- Supabase ships storage.objects with RLS already on, so the migrations never
-- enable it themselves. Without this the storage policies are inert here and
-- the suite silently cannot catch a regression in them.
alter table storage.objects enable row level security;

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

-- Real Supabase grants these on the storage schema; the stub must too, or the
-- storage policies cannot be exercised as a signed-in user.
grant usage on schema storage to authenticated, anon;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;
grant select on storage.buckets to authenticated, anon;

grant usage on schema auth, realtime to authenticated;
grant execute on function auth.uid(), realtime.topic() to authenticated;
grant select, insert on realtime.messages to authenticated;
grant usage, select on sequence realtime.messages_id_seq to authenticated;
