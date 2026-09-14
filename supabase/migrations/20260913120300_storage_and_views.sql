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

-- A user may only write originals under their own prefix:
-- `original/{user_id}/...`. The `blurred/` prefix belongs to the Edge
-- Function (service role); clients never write there.
create policy moments_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'moments'
    and (storage.foldername(name))[1] = 'original'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy moments_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'moments'
    and (storage.foldername(name))[1] = 'original'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Reading is what makes the lock real. The Storage API consults this policy
-- before creating a signed URL, so a client can only ever sign a path these
-- predicates allow — the original once the trade is open, the blurred copy
-- before that, nothing at all otherwise.
-- The check lives in a SECURITY DEFINER function because policy expressions
-- run as the caller, and the caller has no SELECT on moments.*_storage_path.
create policy moments_read_allowed_rendition on storage.objects
  for select to authenticated
  using (bucket_id = 'moments' and public.storage_object_readable(name));

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
  case when f.requester_id = auth.uid() then f.recipient_id else f.requester_id end as friend_id,
  f.id as friendship_id,
  f.created_at,
  f.responded_at
from public.friendships f
where f.status = 'accepted'
  and (f.requester_id = auth.uid() or f.recipient_id = auth.uid());

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
  p.first_name        as from_name,
  p.username          as from_username,
  p.avatar_storage_path as from_avatar_storage_path,
  t.initiator_moment_id as moment_id,
  m.caption,
  m.created_at        as moment_created_at,
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
  -- timestamptz, not date: a bare date parses as UTC midnight on the client
  -- and shows the previous day west of Greenwich.
  coalesce(t.unlocked_at, t.created_at) as pair_at,
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
with mine as (
  select
    m.*,
    case when m.sender_id = auth.uid() then m.recipient_id else m.sender_id end as partner_id
  from public.messages m
  where m.sender_id = auth.uid() or m.recipient_id = auth.uid()
),
latest as (
  select distinct on (partner_id)
    partner_id, id, content, moment_id, sender_id, created_at
  from mine
  order by partner_id, created_at desc
),
-- Counted once per partner, not once per message.
unread as (
  select sender_id as partner_id, count(*) as unread_count
  from public.messages
  where recipient_id = auth.uid() and read_at is null
  group by sender_id
)
select
  l.partner_id,
  l.id         as last_message_id,
  l.content    as last_content,
  l.moment_id  as last_moment_id,
  l.sender_id  as last_sender_id,
  l.created_at as last_at,
  coalesce(u.unread_count, 0) as unread_count
from latest l
left join unread u using (partner_id);
