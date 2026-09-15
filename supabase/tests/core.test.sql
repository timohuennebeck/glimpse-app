-- Behaviour the app depends on. Run: bash supabase/tests/run.sh supabase/tests/core.test.sql
insert into auth.users (id, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '{"first_name":"Timo"}'),
  ('22222222-2222-2222-2222-222222222222', '{"first_name":"Timo"}'),
  ('33333333-3333-3333-3333-333333333333', '{"first_name":"Mia"}');

do $$
declare
  v_token text;
  v_trade uuid;
begin
  -- Signup creates a profile with a generated, unique username.
  assert (select username from public.profiles
          where id = '11111111-1111-1111-1111-111111111111') = 'timo',
    'first Timo should get the bare handle';
  assert (select username from public.profiles
          where id = '22222222-2222-2222-2222-222222222222') ~ '^timo[0-9]{4}$',
    'second Timo should get a numeric suffix';

  -- Declining is a delete, so the pair can try again.
  insert into public.friendships (requester_id, recipient_id)
    values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333');
  delete from public.friendships;
  insert into public.friendships (requester_id, recipient_id)
    values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111');
  delete from public.friendships;

  -- Claiming an invite befriends the two and opens the trade.
  perform set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);
  insert into public.moments (id, author_id, original_storage_path, blurred_storage_path) values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
    'original/11111111-1111-1111-1111-111111111111/1.jpg',
    'blurred/11111111-1111-1111-1111-111111111111/1.jpg');
  insert into public.invites (inviter_id, moment_id)
    values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    returning token into v_token;

  perform set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);
  select trade_id into v_trade from public.claim_invite(v_token);
  assert v_trade is not null, 'claim should open a trade';
  assert exists (select 1 from public.friendships
                 where status = 'accepted'
                   and requester_id = '11111111-1111-1111-1111-111111111111'
                   and recipient_id = '33333333-3333-3333-3333-333333333333'),
    'claim should create an accepted friendship';
  assert (select count(*) from public.invite_preview(v_token)) = 0,
    'a claimed invite must not preview';
end $$;
