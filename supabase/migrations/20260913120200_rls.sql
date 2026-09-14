-- Row level security. Every table is locked by default; policies are additive.

alter table public.profiles             enable row level security;
alter table public.user_blocks          enable row level security;
alter table public.friendships          enable row level security;
alter table public.moments              enable row level security;
alter table public.trades               enable row level security;
alter table public.messages             enable row level security;
alter table public.device_tokens        enable row level security;
alter table public.referral_codes       enable row level security;
alter table public.referral_redemptions enable row level security;
alter table public.invites              enable row level security;
alter table public.reports              enable row level security;
alter table public.app_config           enable row level security;

-- ---------------------------------------------------------------------------
-- app_config: readable by all signed-in users, writable by nobody via the API.
-- ---------------------------------------------------------------------------
create policy app_config_read on public.app_config
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- profiles
-- Searchable by any signed-in user (screen D searches by @username), but a
-- blocked pair cannot see each other at all.
-- ---------------------------------------------------------------------------
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or not public.is_blocked(auth.uid(), id));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- INSERT is handled by the on_auth_user_created trigger, not by clients.
-- Known low: heard_about / locale / onboarding_done_at are readable by any
-- signed-in user. Split into a public view before there is data worth hiding.

-- ---------------------------------------------------------------------------
-- user_blocks
-- ---------------------------------------------------------------------------
create policy user_blocks_own on public.user_blocks
  for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- friendships
-- ---------------------------------------------------------------------------
create policy friendships_read on public.friendships
  for select to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- You may only ever create a request *as yourself*, and not to someone who
-- blocked you.
create policy friendships_request on public.friendships
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'pending'
    and not public.is_blocked(auth.uid(), addressee_id)
  );

-- Only the person who received the request may accept or decline it, and
-- `status` is the only column they may touch (a row policy alone would let
-- them rewrite requester_id and befriend anyone).
create policy friendships_respond on public.friendships
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

-- Either party may walk away.
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- moments
-- You can see a moment row if you took it, or if a trade links it to you.
-- Whether you see the ORIGINAL or the blurred rendition is decided separately,
-- by the RLS policy on storage.objects (see 20260913120300_storage_and_views).
-- ---------------------------------------------------------------------------
create policy moments_read on public.moments
  for select to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.trades t
      where (t.initiator_moment_id = moments.id and t.responder_id = auth.uid())
         or (t.responder_moment_id = moments.id and t.initiator_id = auth.uid())
    )
  );

create policy moments_insert_own on public.moments
  for insert to authenticated with check (author_id = auth.uid());

-- Once a photo is in a trade it stays: deleting your half after the unlock
-- would leave the other person's original open with nothing traded for it.
create policy moments_delete_own on public.moments
  for delete to authenticated
  using (
    author_id = auth.uid()
    and not exists (
      select 1 from public.trades t
      where t.initiator_moment_id = moments.id or t.responder_moment_id = moments.id
    )
  );

-- Column grants: the object paths are not the client's business. They are
-- resolved by visible_moment_paths() and checked by storage_object_readable().
-- blurred_path is written only by the Edge Function (service role).
revoke select, insert on public.moments from authenticated;
grant select (id, author_id, caption, facing, width, height, captured_at, created_at)
  on public.moments to authenticated;
grant insert (author_id, original_path, caption, facing, width, height, captured_at)
  on public.moments to authenticated;

-- ---------------------------------------------------------------------------
-- trades
-- Creation goes through public.send_moment(); responding goes through
-- public.respond_to_trade(). Both are SECURITY DEFINER, so clients get no
-- direct INSERT/UPDATE and cannot forge an unlock.
-- ---------------------------------------------------------------------------
create policy trades_read on public.trades
  for select to authenticated
  using (
    (initiator_id = auth.uid() or responder_id = auth.uid())
    and not public.is_blocked(initiator_id, responder_id)
  );

-- The one column a client may set directly: marking the frosted card as seen.
-- The row policy alone would let the responder set status or auto_unlock_at
-- and open the lock themselves.
create policy trades_mark_seen on public.trades
  for update to authenticated
  using (responder_id = auth.uid())
  with check (responder_id = auth.uid());
revoke update on public.trades from authenticated;
grant update (seen_at) on public.trades to authenticated;

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create policy messages_read on public.messages
  for select to authenticated
  using (
    (sender_id = auth.uid() or recipient_id = auth.uid())
    and not public.is_blocked(sender_id, recipient_id)
  );

create policy messages_send on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.are_friends(auth.uid(), recipient_id)
    and not public.is_blocked(auth.uid(), recipient_id)
    -- A photo in chat must be one the two of you actually traded.
    and (moment_id is null or public.moment_shared_between(moment_id, auth.uid(), recipient_id))
  );

-- Only to stamp read_at on messages addressed to you — and only that column,
-- or a recipient could rewrite the sender's words.
create policy messages_mark_read on public.messages
  for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- device_tokens / reports / redemptions: owner-scoped
-- ---------------------------------------------------------------------------
create policy device_tokens_own on public.device_tokens
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

create policy redemptions_own on public.referral_redemptions
  for select to authenticated using (redeemer_id = auth.uid());
-- INSERT only through redeem_referral_code(), which enforces max/expiry/self.

-- ---------------------------------------------------------------------------
-- referral_codes: your own code is readable; partner codes are readable by all
-- so the redeem screen can validate before writing.
-- ---------------------------------------------------------------------------
create policy referral_codes_read on public.referral_codes
  for select to authenticated
  using (owner_id = auth.uid() or kind = 'partner');

-- ---------------------------------------------------------------------------
-- invites: the inviter manages them. Claiming goes through claim_invite(), by
-- token — there is deliberately no SELECT for anyone else, because a row
-- filter cannot express "only the row whose token you already know" and
-- would let every user list every live token.
-- ---------------------------------------------------------------------------
create policy invites_owner on public.invites
  for all to authenticated
  using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());
