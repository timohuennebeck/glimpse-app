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
-- A username is what friend search matches on, so every profile gets one at
-- signup: the first name lowered and stripped to the allowed alphabet, with
-- four digits appended if that is taken. The owner may change it later.
create or replace function public.generate_username(p_first_name text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  base text := left(regexp_replace(lower(coalesce(p_first_name, '')), '[^a-z0-9_.]', '', 'g'), 14);
  candidate text;
begin
  if char_length(base) < 3 then
    base := 'user';
  end if;
  candidate := base;
  for i in 1..20 loop
    if not exists (select 1 from public.profiles where username = candidate) then
      return candidate;
    end if;
    candidate := base || (1000 + floor(random() * 9000))::int::text;
  end loop;
  -- 20 collisions on random suffixes is not luck; fall back to something unique.
  return left(base, 6) || replace(left(gen_random_uuid()::text, 13), '-', '');
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_name text := coalesce(new.raw_user_meta_data ->> 'first_name', '');
begin
  insert into public.profiles (id, first_name, username, locale)
  values (
    new.id,
    v_first_name,
    public.generate_username(v_first_name),
    coalesce(new.raw_user_meta_data ->> 'locale', 'en')
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
  -- A user may only ask about pairs they are part of; the service role
  -- (no JWT) may ask about anyone. Otherwise this is a friend-graph oracle.
  select (auth.uid() is null or auth.uid() in (a, b))
     and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.recipient_id) = least(a, b)
      and greatest(f.requester_id, f.recipient_id) = greatest(a, b)
  );
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.uid() is null or auth.uid() in (a, b))
     and exists (
    select 1 from public.user_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- "3 mutual" on a search result. SECURITY DEFINER because a user can only
-- read their own friendship rows; this returns a count, never the names.
create or replace function public.mutual_friends_count(p_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with friends_of as (
    select case when requester_id = u.id then recipient_id else requester_id end as friend_id, u.id as who
    from public.friendships f
    cross join (values (auth.uid()), (p_user_id)) as u(id)
    where f.status = 'accepted' and u.id in (f.requester_id, f.recipient_id)
  )
  select case when auth.uid() is null or auth.uid() = p_user_id then 0
         else (select count(*)::int from friends_of a join friends_of b on a.friend_id = b.friend_id
               where a.who = auth.uid() and b.who = p_user_id)
         end;
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
  n_recipient int;
begin
  -- The two parties are fixed for the life of the row. Otherwise a recipient
  -- could rewrite requester_id and manufacture a friendship with anyone.
  if tg_op = 'UPDATE'
     and (new.requester_id, new.recipient_id) is distinct from (old.requester_id, old.recipient_id) then
    raise exception 'friendship_parties_immutable' using errcode = 'check_violation';
  end if;

  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.responded_at := coalesce(new.responded_at, now());
  end if;

  -- Only count when a row BECOMES accepted, so re-saving an accepted row at
  -- exactly the cap does not reject itself.
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status <> 'accepted') then
    select count(*) into n_requester from public.friendships
      where status = 'accepted' and (requester_id = new.requester_id or recipient_id = new.requester_id);
    select count(*) into n_recipient from public.friendships
      where status = 'accepted' and (requester_id = new.recipient_id or recipient_id = new.recipient_id);
    if n_requester >= cap or n_recipient >= cap then
      raise exception 'friend_cap_reached' using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger friendships_cap
  before insert or update on public.friendships
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
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;

  select author_id into v_author from public.moments where id = p_moment_id;
  if v_author is null or v_author <> auth.uid() then
    raise exception 'not_moment_author' using errcode = 'insufficient_privilege';
  end if;

  foreach v_recipient in array (select array_agg(distinct r) from unnest(p_recipient_ids) r) loop
    if not public.are_friends(v_author, v_recipient) or public.is_blocked(v_author, v_recipient) then
      raise exception 'not_friends' using errcode = 'insufficient_privilege';
    end if;

    return query
      insert into public.trades (
        initiator_id, responder_id, initiator_moment_id, auto_unlock_at
      )
      values (
        v_author, v_recipient, p_moment_id, now() + make_interval(hours => v_hours)
      )
      -- A second send of the same photo to the same person is a no-op.
      on conflict (initiator_moment_id, responder_id) do nothing
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
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = 'insufficient_privilege';
  end if;

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

  if v_trade.status = 'expired' then
    raise exception 'trade_expired' using errcode = 'check_violation';
  end if;

  select author_id into v_author from public.moments where id = p_moment_id;
  if v_author is distinct from auth.uid() then
    raise exception 'not_moment_author' using errcode = 'insufficient_privilege';
  end if;

  update public.trades
     set responder_moment_id = p_moment_id,
         status = 'unlocked',
         -- If the timer already opened it, keep that moment as the unlock time.
         unlocked_at = coalesce(unlocked_at, now())
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
stable  -- calls now(); IMMUTABLE would let a plan freeze the answer
as $$
  select t.status = 'unlocked'
      or (t.status = 'pending'
          and t.auto_unlock_at is not null
          and now() >= t.auto_unlock_at);
$$;

-- ---------------------------------------------------------------------------
-- Who may see which rendition of a moment.
--
-- Postgres cannot mint storage signed URLs — that is the Storage API's job —
-- so the server's role is to decide, and the client's role is to sign. The
-- decision lives in two predicates that are used twice: by the RLS policy on
-- storage.objects (so the Storage API refuses to sign anything the caller may
-- not see) and by visible_moment_paths() (so the client knows which path to
-- ask for). One rule, enforced at the object layer, no trust in the client.
-- ---------------------------------------------------------------------------

-- May the caller see this moment at all (i.e. its blurred rendition)?
create or replace function public.can_see_moment(p_moment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moments m
    where m.id = p_moment_id
      and (
        m.author_id = auth.uid()
        or exists (
          select 1 from public.trades t
          where (t.initiator_moment_id = m.id and t.responder_id = auth.uid())
             or (t.responder_moment_id = m.id and t.initiator_id = auth.uid())
        )
      )
  );
$$;

-- May the caller see the ORIGINAL? Only the author, or a party to an open trade.
create or replace function public.can_see_original(p_moment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moments m
    where m.id = p_moment_id
      and (
        m.author_id = auth.uid()
        or exists (
          select 1 from public.trades t
          where public.trade_is_open(t)
            and ((t.initiator_moment_id = m.id and t.responder_id = auth.uid())
              or (t.responder_moment_id = m.id and t.initiator_id = auth.uid()))
        )
      )
  );
$$;

-- The path the caller is allowed to sign for each moment, in one round trip.
-- NULL means "nothing yet": a locked moment whose blurred rendition has not
-- been generated is withheld entirely rather than leaking the original.
create or replace function public.visible_moment_paths(p_moment_ids uuid[])
returns table (moment_id uuid, path text)
language sql
stable
security definer
set search_path = public
as $$
  select m.id,
         case
           when public.can_see_original(m.id) then m.original_storage_path
           when public.can_see_moment(m.id)   then m.blurred_storage_path
           else null
         end
  from public.moments m
  where m.id = any (p_moment_ids);
$$;

-- ---------------------------------------------------------------------------
-- Storage gate. Evaluated by the RLS policy on storage.objects for the
-- `moments` bucket. SECURITY DEFINER so it may read moments.*_storage_path, which the
-- caller deliberately cannot (see the column grants in 20260913120200_rls).
-- ---------------------------------------------------------------------------
create or replace function public.storage_object_readable(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moments m
    where (m.original_storage_path = p_name and public.can_see_original(m.id))
       or (m.blurred_storage_path  = p_name and public.can_see_moment(m.id))
  )
  -- Defence in depth: the second path segment must be the row's author.
  and exists (
    select 1 from public.moments m
    where (m.original_storage_path = p_name or m.blurred_storage_path = p_name)
      and split_part(p_name, '/', 2) = m.author_id::text
  );
$$;

-- May the caller delete this object? Their own original, and only while no
-- trade names the moment: once a photo is traded, the other person's unlocked
-- half must not vanish. Orphaned uploads (no row at all) may be removed.
create or replace function public.storage_object_deletable(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select split_part(p_name, '/', 1) = 'original'
     and split_part(p_name, '/', 2) = auth.uid()::text
     and not exists (
       select 1
       from public.moments m
       join public.trades t on t.initiator_moment_id = m.id or t.responder_moment_id = m.id
       where m.original_storage_path = p_name
     );
$$;

-- Is this moment part of a trade between exactly these two people? Used to
-- validate a photo attached to a chat message.
create or replace function public.moment_shared_between(p_moment_id uuid, a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trades t
    where (t.initiator_moment_id = p_moment_id or t.responder_moment_id = p_moment_id)
      and least(t.initiator_id, t.responder_id) = least(a, b)
      and greatest(t.initiator_id, t.responder_id) = greatest(a, b)
  );
$$;

-- ---------------------------------------------------------------------------
-- Invites: the token is the capability, so it is never listable.
-- ---------------------------------------------------------------------------

-- An invite may only show the inviter's own photo.
create or replace function public.enforce_invite_moment_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moment_id is not null and not exists (
    select 1 from public.moments m where m.id = new.moment_id and m.author_id = new.inviter_id
  ) then
    raise exception 'invite_moment_not_owned' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger invites_moment_owner
  before insert or update on public.invites
  for each row execute function public.enforce_invite_moment_owner();

-- What the deeplink screen shows before the visitor has an account: who sent
-- it and the frosted rendition. Callable by anon; the token is the only key.
-- Returns no row for an unknown, expired or claimed token.
create or replace function public.invite_preview(p_token text)
returns table (
  inviter_first_name text,
  inviter_avatar_storage_path text,
  moment_id uuid,
  blurred_storage_path text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.first_name, p.avatar_storage_path, m.id, m.blurred_storage_path, i.created_at
  from public.invites i
  join public.profiles p on p.id = i.inviter_id
  left join public.moments m on m.id = i.moment_id
  where i.token = p_token
    and i.claimer_id is null
    and i.expires_at > now();
$$;

-- Lets the Storage API sign the blurred rendition of a moment that a live
-- invite points at, for anon and signed-in visitors alike. The path is only
-- learnable through invite_preview(), i.e. through the token.
create or replace function public.invite_object_readable(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invites i
    join public.moments m on m.id = i.moment_id
    where m.blurred_storage_path = p_name
      and i.claimer_id is null
      and i.expires_at > now()
  );
$$;

-- Claiming is the whole growth loop in one call: mark the token used, make the
-- two people friends, and open the trade for the frosted photo so the new
-- account has something to send one back to. Returns no row when the token
-- is unknown, expired, already claimed, the inviter's own, or across a block.
create or replace function public.claim_invite(p_token text)
returns table (inviter_id uuid, moment_id uuid, trade_id uuid)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_hours int := public.config_int('trade_auto_unlock_hours', 24);
  v_trade_id uuid;
begin
  if auth.uid() is null then
    return;
  end if;

  update public.invites i
     set claimer_id = auth.uid(), claimed_at = now()
   where i.token = p_token
     and i.claimer_id is null
     and i.expires_at > now()
     and i.inviter_id <> auth.uid()
     and not public.is_blocked(i.inviter_id, auth.uid())
  returning * into v_invite;

  if v_invite.token is null then
    return;
  end if;

  -- Friends, whichever direction a request may already be pending in. The
  -- friend cap trigger still applies and surfaces as friend_cap_reached.
  insert into public.friendships (requester_id, recipient_id, status)
  values (v_invite.inviter_id, auth.uid(), 'accepted')
  on conflict (least(requester_id, recipient_id), greatest(requester_id, recipient_id))
  do update set status = 'accepted';

  if v_invite.moment_id is not null
     and exists (select 1 from public.moments m where m.id = v_invite.moment_id) then
    insert into public.trades (initiator_id, responder_id, initiator_moment_id, auto_unlock_at)
    values (v_invite.inviter_id, auth.uid(), v_invite.moment_id, now() + make_interval(hours => v_hours))
    on conflict (initiator_moment_id, responder_id) do nothing
    returning id into v_trade_id;
    if v_trade_id is null then
      select t.id into v_trade_id from public.trades t
       where t.initiator_moment_id = v_invite.moment_id and t.responder_id = auth.uid();
    end if;
  end if;

  return query select v_invite.inviter_id, v_invite.moment_id, v_trade_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Push tokens: a phone changing hands re-homes the token to the new account.
-- ---------------------------------------------------------------------------
create or replace function public.register_device_token(p_token text, p_platform text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.device_tokens (user_id, token, platform)
  select auth.uid(), p_token, p_platform
  where auth.uid() is not null
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform;
$$;

-- ---------------------------------------------------------------------------
-- Function grants. Supabase grants EXECUTE to public/anon by default; the
-- RPCs are for signed-in users only. The predicates stay executable by
-- authenticated because the RLS policies call them.
-- ---------------------------------------------------------------------------
revoke execute on function
  public.send_moment(uuid, uuid[]),
  public.respond_to_trade(uuid, uuid),
  public.visible_moment_paths(uuid[]),
  public.claim_invite(text),
  public.register_device_token(text, text),
  public.mutual_friends_count(uuid),
  public.generate_username(text),
  public.are_friends(uuid, uuid),
  public.is_blocked(uuid, uuid),
  public.can_see_moment(uuid),
  public.can_see_original(uuid),
  public.storage_object_readable(text),
  public.storage_object_deletable(text),
  public.moment_shared_between(uuid, uuid, uuid)
from public, anon;

grant execute on function
  public.send_moment(uuid, uuid[]),
  public.respond_to_trade(uuid, uuid),
  public.visible_moment_paths(uuid[]),
  public.claim_invite(text),
  public.register_device_token(text, text),
  public.mutual_friends_count(uuid),
  public.are_friends(uuid, uuid),
  public.is_blocked(uuid, uuid),
  public.can_see_moment(uuid),
  public.can_see_original(uuid),
  public.storage_object_readable(text),
  public.storage_object_deletable(text),
  public.moment_shared_between(uuid, uuid, uuid)
to authenticated;

-- The two the deeplink needs before there is an account.
revoke execute on function public.invite_preview(text), public.invite_object_readable(text) from public;
grant execute on function public.invite_preview(text), public.invite_object_readable(text) to anon, authenticated;

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
