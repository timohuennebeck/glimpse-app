-- Storage buckets and the read-model views the screens actually query.

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Private. Reads are governed by moments_read_allowed_rendition below.
  ('moments', 'moments', false, 12 * 1024 * 1024, array['image/jpeg', 'image/heic', 'image/webp']),
  -- Avatars are small and shown in friend search, so public read is fine.
  ('avatars', 'avatars', true, 4 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- A user may only write under their own prefix: `{user_id}/...`
create policy moments_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy moments_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'moments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Reading is what makes the lock real. The Storage API consults this policy
-- before creating a signed URL, so a client can only ever sign a path these
-- predicates allow — the original once the trade is open, the blurred copy
-- before that, nothing at all otherwise.
create policy moments_read_allowed_rendition on storage.objects
  for select to authenticated
  using (
    bucket_id = 'moments'
    and exists (
      select 1 from public.moments m
      where (m.original_path = storage.objects.name and public.can_see_original(m.id))
         or (m.blurred_path  = storage.objects.name and public.can_see_moment(m.id))
    )
  );

create policy avatars_write_own on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_read on storage.objects
  for select to public using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- v_my_friends — the accepted list, flattened to "the other person"
-- ---------------------------------------------------------------------------
create or replace view public.v_my_friends
with (security_invoker = true)
as
select
  case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end as friend_id,
  f.id as friendship_id,
  f.created_at,
  f.responded_at
from public.friendships f
where f.status = 'accepted'
  and (f.requester_id = auth.uid() or f.addressee_id = auth.uid());

-- ---------------------------------------------------------------------------
-- v_inbox — what the FEED and the WIDGET read.
--
-- One row per trade where I am the responder, carrying whether it is still
-- frosted. `is_open` folds in the auto-unlock timer.
-- ---------------------------------------------------------------------------
create or replace view public.v_inbox
with (security_invoker = true)
as
select
  t.id                as trade_id,
  t.initiator_id      as from_id,
  p.display_name      as from_name,
  p.username          as from_username,
  p.avatar_path       as from_avatar_path,
  t.initiator_moment_id as moment_id,
  m.caption,
  m.captured_at,
  t.status,
  t.seen_at,
  t.auto_unlock_at,
  t.unlocked_at,
  public.trade_is_open(t) as is_open,
  t.created_at
from public.trades t
join public.profiles p on p.id = t.initiator_id
join public.moments  m on m.id = t.initiator_moment_id
where t.responder_id = auth.uid()
order by t.created_at desc;

-- ---------------------------------------------------------------------------
-- v_pairs — completed trades as photo pairs, for the profile grid (screen 07b)
-- ---------------------------------------------------------------------------
create or replace view public.v_pairs
with (security_invoker = true)
as
select
  t.id as trade_id,
  least(t.initiator_id, t.responder_id)    as user_a,
  greatest(t.initiator_id, t.responder_id) as user_b,
  t.initiator_moment_id,
  t.responder_moment_id,
  t.unlocked_at,
  coalesce(t.unlocked_at, t.created_at)::date as pair_date,
  t.created_at
from public.trades t
where t.responder_moment_id is not null
  and (t.initiator_id = auth.uid() or t.responder_id = auth.uid())
order by t.created_at desc;

-- ---------------------------------------------------------------------------
-- v_threads — the chat list (screen 08b): last message per conversation
-- ---------------------------------------------------------------------------
create or replace view public.v_threads
with (security_invoker = true)
as
select distinct on (partner_id)
  partner_id,
  id as last_message_id,
  body as last_body,
  moment_id as last_moment_id,
  sender_id as last_sender_id,
  created_at as last_at,
  (select count(*) from public.messages m2
     where m2.recipient_id = auth.uid()
       and m2.sender_id = x.partner_id
       and m2.read_at is null) as unread_count
from (
  select
    m.*,
    case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end as partner_id
  from public.messages m
  where m.sender_id = auth.uid() or m.recipient_id = auth.uid()
) x
order by partner_id, created_at desc;
