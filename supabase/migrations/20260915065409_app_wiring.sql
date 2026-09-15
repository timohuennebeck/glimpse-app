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
