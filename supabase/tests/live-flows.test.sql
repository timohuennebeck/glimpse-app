-- The flows a person actually walks through, asserted as one chain rather than
-- per-function. Every case here was first run against the hosted project inside
-- a rolled-back transaction; this file is so it stays true.
--
-- Run: bash supabase/tests/run.sh supabase/tests/live-flows.test.sql

insert into auth.users (id, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', '{"first_name":"Ada"}'),
  ('22222222-2222-2222-2222-222222222222', '{"first_name":"Ben"}'),
  ('33333333-3333-3333-3333-333333333333', '{"first_name":"Eve"}');

do $$
declare
  ada uuid := '11111111-1111-1111-1111-111111111111';
  ben uuid := '22222222-2222-2222-2222-222222222222';
  eve uuid := '33333333-3333-3333-3333-333333333333';
  v_trade uuid;
  v_path  text;
  v_count int;
  v_ok    boolean;
begin
  -- Sign-up builds a profile and a username from the metadata.
  if (select count(*) from public.profiles) <> 3 then
    raise exception 'signup trigger did not create three profiles';
  end if;
  if (select username from public.profiles where id = ada) is null then
    raise exception 'no username generated';
  end if;

  insert into public.friendships (requester_id, recipient_id, status, responded_at)
  values (ada, ben, 'accepted', now());

  insert into public.moments (id, author_id, original_storage_path, blurred_storage_path, caption, width, height)
  values ('aaaaaaaa-0000-4000-8000-00000000000a', ada,
          'original/' || ada || '/a.jpg', 'blurred/' || ada || '/a.jpg', 'from ada', 1600, 1200),
         ('bbbbbbbb-0000-4000-8000-00000000000b', ben,
          'original/' || ben || '/b.jpg', 'blurred/' || ben || '/b.jpg', 'from ben', 1600, 1200);

  -- Ada may not send to someone she is not friends with.
  perform set_config('app.uid', ada::text, false);
  begin
    perform public.send_moment('aaaaaaaa-0000-4000-8000-00000000000a', array[eve]);
    raise exception 'send_moment allowed a non-friend';
  exception when others then
    if SQLERRM <> 'not_friends' then raise exception 'expected not_friends, got %', SQLERRM; end if;
  end;

  -- Nor may Eve send a moment she did not take.
  perform set_config('app.uid', eve::text, false);
  begin
    perform public.send_moment('aaaaaaaa-0000-4000-8000-00000000000a', array[ben]);
    raise exception 'send_moment allowed a non-author';
  exception when others then
    if SQLERRM <> 'not_moment_author' then raise exception 'expected not_moment_author, got %', SQLERRM; end if;
  end;

  perform set_config('app.uid', ada::text, false);
  select (public.send_moment('aaaaaaaa-0000-4000-8000-00000000000a', array[ben])).id into v_trade;

  -- While it is locked, Ben is offered the blurred rendition and nothing else.
  perform set_config('app.uid', ben::text, false);
  select path into v_path from public.visible_moment_paths(array['aaaaaaaa-0000-4000-8000-00000000000a'::uuid]);
  if v_path <> 'blurred/' || ada || '/a.jpg' then
    raise exception 'locked moment did not resolve to the blurred path, got %', coalesce(v_path, 'NULL');
  end if;

  -- A stranger is offered neither rendition, and cannot read them from storage.
  perform set_config('app.uid', eve::text, false);
  select path into v_path from public.visible_moment_paths(array['aaaaaaaa-0000-4000-8000-00000000000a'::uuid]);
  if v_path is not null then raise exception 'a stranger was given a path: %', v_path; end if;
  select public.storage_object_readable('original/' || ada || '/a.jpg') into v_ok;
  if v_ok then raise exception 'a stranger could read the original'; end if;
  select public.storage_object_readable('blurred/' || ada || '/a.jpg') into v_ok;
  if v_ok then raise exception 'a stranger could read the blurred rendition'; end if;

  -- A friend with no trade on this moment cannot read the original either.
  perform set_config('app.uid', ben::text, false);
  select public.storage_object_readable('original/' || ada || '/a.jpg') into v_ok;
  if v_ok then raise exception 'a friend without a trade could read the original'; end if;

  -- Only the responder may answer.
  perform set_config('app.uid', eve::text, false);
  begin
    perform public.respond_to_trade(v_trade, 'bbbbbbbb-0000-4000-8000-00000000000b');
    raise exception 'a stranger answered the trade';
  exception when others then
    if SQLERRM <> 'not_trade_responder' then raise exception 'expected not_trade_responder, got %', SQLERRM; end if;
  end;

  perform set_config('app.uid', ben::text, false);
  perform public.respond_to_trade(v_trade, 'bbbbbbbb-0000-4000-8000-00000000000b');

  -- Answering opens both originals, and only then.
  select path into v_path from public.visible_moment_paths(array['aaaaaaaa-0000-4000-8000-00000000000a'::uuid]);
  if v_path <> 'original/' || ada || '/a.jpg' then
    raise exception 'answering did not open the original, got %', coalesce(v_path, 'NULL');
  end if;

  -- And it cannot be answered twice.
  begin
    perform public.respond_to_trade(v_trade, 'bbbbbbbb-0000-4000-8000-00000000000b');
    raise exception 'the trade was answered twice';
  exception when others then
    if SQLERRM <> 'trade_already_answered' then raise exception 'expected trade_already_answered, got %', SQLERRM; end if;
  end;

  -- The pair the profile grid reads has no nulls where the app declares none.
  perform set_config('app.uid', ada::text, false);
  select count(*) into v_count from public.v_pairs
   where trade_id is null or user_a is null or user_b is null
      or initiator_moment_id is null or responder_moment_id is null or pair_at is null;
  if v_count > 0 then raise exception 'v_pairs returned a null the PairRow type says cannot happen'; end if;

  -- Same for the inbox the feed reads.
  perform set_config('app.uid', ben::text, false);
  select count(*) into v_count from public.v_inbox
   where trade_id is null or from_id is null or from_name is null
      or moment_id is null or status is null or is_open is null or created_at is null;
  if v_count > 0 then raise exception 'v_inbox returned a null the InboxRow type says cannot happen'; end if;

  -- Storage: a client may write only under its own original/ prefix. The
  -- blurred/ prefix is the server's alone — a client that could write there
  -- could upload the original as its own "blurred" copy and defeat the lock.
  -- psql connects as a superuser, which bypasses RLS outright, so these have to
  -- run as `authenticated` or they prove nothing.
  perform set_config('app.uid', ada::text, false);
  set local role authenticated;
  begin
    insert into storage.objects (bucket_id, name)
    values ('moments', 'original/' || ada || '/1.jpg');
  exception when others then
    raise exception 'a user could not upload under their own prefix: %', SQLERRM;
  end;

  begin
    insert into storage.objects (bucket_id, name)
    values ('moments', 'original/' || ben || '/evil.jpg');
    raise exception 'a user uploaded under someone else''s prefix';
  exception when insufficient_privilege then null;
    when others then
      if SQLERRM !~ 'row-level security' then raise; end if;
  end;

  begin
    insert into storage.objects (bucket_id, name)
    values ('moments', 'blurred/' || ada || '/fake.jpg');
    raise exception 'a client wrote to the blurred prefix';
  exception when insufficient_privilege then null;
    when others then
      if SQLERRM !~ 'row-level security' then raise; end if;
  end;

  reset role;
  raise notice 'live-flows: all assertions passed';
end $$;
