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

-- Only the person who received the request may accept or decline it.
create policy friendships_respond on public.friendships
  for update to authenticated
  using (addressee_id = auth.uid())
  with check (addressee_id = auth.uid() and status in ('accepted', 'declined'));

-- Either party may walk away.
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- moments
-- You can see a moment row if you took it, or if a trade links it to you.
-- Whether you see the ORIGINAL or the blurred rendition is decided separately,
-- by public.visible_moment_url().
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

create policy moments_delete_own on public.moments
  for delete to authenticated using (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- trades
-- Creation goes through public.send_moment(); responding goes through
-- public.respond_to_trade(). Both are SECURITY DEFINER, so clients get no
-- direct INSERT/UPDATE and cannot forge an unlock.
-- ---------------------------------------------------------------------------
create policy trades_read on public.trades
  for select to authenticated
  using (initiator_id = auth.uid() or responder_id = auth.uid());

-- The one field a client may set directly: marking the frosted card as seen.
create policy trades_mark_seen on public.trades
  for update to authenticated
  using (responder_id = auth.uid())
  with check (responder_id = auth.uid());

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
  );

-- Only to stamp read_at on messages addressed to you.
create policy messages_mark_read on public.messages
  for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

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

create policy redemptions_insert on public.referral_redemptions
  for insert to authenticated with check (redeemer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- referral_codes: your own code is readable; partner codes are readable by all
-- so the redeem screen can validate before writing.
-- ---------------------------------------------------------------------------
create policy referral_codes_read on public.referral_codes
  for select to authenticated
  using (owner_id = auth.uid() or kind = 'partner');

-- ---------------------------------------------------------------------------
-- invites: the inviter manages them; the claimer needs to read one by token.
-- Token is high-entropy and acts as the capability.
-- ---------------------------------------------------------------------------
create policy invites_owner on public.invites
  for all to authenticated
  using (inviter_id = auth.uid()) with check (inviter_id = auth.uid());

create policy invites_claim_read on public.invites
  for select to authenticated
  using (expires_at > now());
