-- Run: bash supabase/tests/run.sh supabase/tests/app-wiring.test.sql
insert into auth.users (id) values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333');

do $$
declare
  v_mutual int;
begin
  assert (select count(*) from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename in ('trades', 'messages', 'friendships')) = 3,
    'trades, messages and friendships must be published';

  -- 1 and 2 share friend 3; 1 and 3 share nobody.
  insert into public.friendships (requester_id, recipient_id, status) values
    ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted'),
    ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'accepted');
  perform set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);

  select mutual into v_mutual from public.mutual_friends_counts(
    array['22222222-2222-2222-2222-222222222222']::uuid[]);
  assert v_mutual = 1, 'users 1 and 2 share one friend';

  select mutual into v_mutual from public.mutual_friends_counts(
    array['33333333-3333-3333-3333-333333333333']::uuid[]);
  assert v_mutual = 0, 'users 1 and 3 share no friend';

  -- Internal helpers and trigger functions are not part of the API surface.
  assert not has_function_privilege('anon', 'public.config_int(text,int)', 'execute'),
    'anon must not be able to read the config';
  assert not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
    'the signup trigger function must not be callable over the API';
  assert not has_function_privilege('authenticated', 'public.generate_username(text)', 'execute'),
    'username generation is internal to the signup trigger';
  -- ...but the two the security_invoker views evaluate as the caller must stay.
  assert has_function_privilege('authenticated', 'public.trade_is_open(public.trades)', 'execute'),
    'v_inbox calls trade_is_open as the caller';
  assert has_function_privilege('authenticated', 'public.config_int(text,int)', 'execute'),
    'v_pairs calls config_int as the caller';
end $$;

-- A member of the pair may track presence on the pair's topic.
select set_config('app.uid', '11111111-1111-1111-1111-111111111111', false);
select set_config('realtime.topic',
  'chat:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222', false);
set role authenticated;
insert into realtime.messages (topic, extension, payload)
  values (realtime.topic(), 'presence', '{}');
reset role;

-- Someone outside the pair may not.
select set_config('app.uid', '33333333-3333-3333-3333-333333333333', false);
set role authenticated;
do $$
begin
  begin
    insert into realtime.messages (topic, extension, payload)
      values (realtime.topic(), 'presence', '{}');
    raise exception 'an outsider was allowed to track presence';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;
