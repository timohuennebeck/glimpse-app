-- Local development seed. Applied after every migration on `supabase start`
-- and `supabase db reset`; never runs against the hosted project.
--
-- Deliberately thin. The interesting states in this app — a frosted trade, a
-- completed pair, an unread thread — are produced by the triggers and RPCs the
-- migrations install, so seeding rows directly would bypass the very logic
-- worth exercising. Two accounts and a friendship between them is the shortest
-- path to a signed-in session you can actually use; make moments through the
-- app from there.
--
-- These users have no password and cannot sign in. Create a login-capable
-- account through local Studio (http://localhost:54323) or the Auth admin API.

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-4000-8000-00000000000a', 'ada@example.test', '{"first_name":"Ada"}'),
  ('00000000-0000-4000-8000-00000000000b', 'ben@example.test', '{"first_name":"Ben"}')
on conflict (id) do nothing;

-- handle_new_user() builds the profile rows from the metadata above, so the
-- only thing left is the relationship between them.
insert into public.friendships (requester_id, recipient_id, status, responded_at)
values (
  '00000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-00000000000b',
  'accepted',
  now()
)
on conflict do nothing;
