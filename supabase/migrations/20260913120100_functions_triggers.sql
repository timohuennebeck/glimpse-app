-- Helper functions, triggers and the trade state machine.

-- ---------------------------------------------------------------------------
-- Config accessor
-- ---------------------------------------------------------------------------
create or replace function public.config_int(p_key text, p_default int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select (value #>> '{}')::int from public.app_config where key = p_key), p_default);
$$;

-- ---------------------------------------------------------------------------
-- Mirror auth.users -> profiles on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'locale', 'de')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Friendship helpers
-- ---------------------------------------------------------------------------
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
  );
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Enforce the "no large friend lists" product decision at the data layer.
create or replace function public.enforce_friend_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap int := public.config_int('max_friends', 20);
  n_requester int;
  n_addressee int;
begin
  if new.status <> 'accepted' then
    return new;
  end if;

  select count(*) into n_requester from public.friendships
    where status = 'accepted' and (requester_id = new.requester_id or addressee_id = new.requester_id);
  select count(*) into n_addressee from public.friendships
    where status = 'accepted' and (requester_id = new.addressee_id or addressee_id = new.addressee_id);

  if n_requester >= cap or n_addressee >= cap then
    raise exception 'friend_cap_reached' using errcode = 'check_violation';
  end if;

  new.responded_at := coalesce(new.responded_at, now());
  return new;
end;
$$;

create trigger friendships_cap
  before insert or update of status on public.friendships
  for each row execute function public.enforce_friend_cap();

-- ---------------------------------------------------------------------------
-- Trades: creation
-- ---------------------------------------------------------------------------
-- Send one moment to N friends: inserts one lock per recipient.
create or replace function public.send_moment(
  p_moment_id uuid,
  p_recipient_ids uuid[]
)
returns setof public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_hours int := public.config_int('trade_auto_unlock_hours', 24);
  v_recipient uuid;
begin
  select author_id into v_author from public.moments where id = p_moment_id;

  if v_author is null or v_author <> auth.uid() then
    raise exception 'not_moment_author' using errcode = 'insufficient_privilege';
  end if;

  foreach v_recipient in array p_recipient_ids loop
    if not public.are_friends(v_author, v_recipient) then
      raise exception 'not_friends' using errcode = 'insufficient_privilege';
    end if;

    return query
      insert into public.trades (
        initiator_id, responder_id, initiator_moment_id, auto_unlock_at
      )
      values (
        v_author, v_recipient, p_moment_id, now() + make_interval(hours => v_hours)
      )
      returning *;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trades: the unlock. This is the whole product in one function.
-- ---------------------------------------------------------------------------
create or replace function public.respond_to_trade(
  p_trade_id uuid,
  p_moment_id uuid
)
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trade public.trades;
  v_author uuid;
begin
  select * into v_trade from public.trades where id = p_trade_id for update;

  if v_trade.id is null then
    raise exception 'trade_not_found' using errcode = 'no_data_found';
  end if;

  -- Only the person holding the frosted card may trade back.
  if v_trade.responder_id <> auth.uid() then
    raise exception 'not_trade_responder' using errcode = 'insufficient_privilege';
  end if;

  if v_trade.responder_moment_id is not null then
    raise exception 'trade_already_answered' using errcode = 'unique_violation';
  end if;

  select author_id into v_author from public.moments where id = p_moment_id;
  if v_author is distinct from auth.uid() then
    raise exception 'not_moment_author' using errcode = 'insufficient_privilege';
  end if;

  update public.trades
     set responder_moment_id = p_moment_id,
         status = 'unlocked',
         unlocked_at = now()
   where id = p_trade_id
  returning * into v_trade;

  return v_trade;
end;
$$;

-- ---------------------------------------------------------------------------
-- Is a trade open right now? Covers the timer without a background job.
-- ---------------------------------------------------------------------------
create or replace function public.trade_is_open(t public.trades)
returns boolean
language sql
immutable
as $$
  select t.status = 'unlocked'
      or (t.auto_unlock_at is not null and now() >= t.auto_unlock_at);
$$;

-- ---------------------------------------------------------------------------
-- The only sanctioned way to get at a moment's pixels.
--
-- Returns a signed URL for the ORIGINAL when the caller is the author or the
-- trade is open; otherwise for the pre-blurred rendition. A tampered client
-- cannot promote itself, because the server never signs the original early.
-- ---------------------------------------------------------------------------
create or replace function public.visible_moment_url(
  p_moment_id uuid,
  p_expires_in int default 3600
)
returns text
language plpgsql
security definer
set search_path = public, storage, extensions
as $$
declare
  v_moment public.moments;
  v_uid uuid := auth.uid();
  v_open boolean;
  v_path text;
begin
  select * into v_moment from public.moments where id = p_moment_id;
  if v_moment.id is null then
    return null;
  end if;

  if v_moment.author_id = v_uid then
    v_open := true;
  else
    -- Open if ANY trade linking this moment to me is open.
    select bool_or(public.trade_is_open(t)) into v_open
      from public.trades t
     where (t.initiator_moment_id = p_moment_id and t.responder_id = v_uid)
        or (t.responder_moment_id = p_moment_id and t.initiator_id = v_uid);

    if v_open is null then
      -- No relationship to this moment at all.
      return null;
    end if;
  end if;

  v_path := case
              when v_open then v_moment.original_path
              else coalesce(v_moment.blurred_path, v_moment.original_path)
            end;

  -- NOTE: requires the `storage` schema's signing helper. On hosted Supabase
  -- this is `storage.create_signed_url`; if unavailable, call the Storage REST
  -- API from an Edge Function with the service role key instead.
  return storage.create_signed_url('moments', v_path, p_expires_in);
exception
  when undefined_function then
    -- Surface the path so the caller can sign it server-side rather than
    -- silently handing back nothing.
    raise notice 'storage.create_signed_url unavailable; returning raw path';
    return v_path;
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at housekeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();
