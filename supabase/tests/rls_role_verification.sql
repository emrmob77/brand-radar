-- RLS role verification for GEO Dashboard
-- Runs inside a transaction and rolls back all fixture data.
-- Validates:
-- 1) Tenant isolation (agency A cannot see agency B data)
-- 2) Role-based write rules (admin/editor/viewer)
-- 3) Child table access control through client_id

begin;

insert into public.agencies (id, name) values
  ('11111111-1111-4111-8111-111111111111', 'RLS Agency A'),
  ('22222222-2222-4222-8222-222222222222', 'RLS Agency B');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('11111111-1111-4111-8111-111111111211', 'authenticated', 'authenticated', 'rls-admin-a@example.com', 'x', now()),
  ('11111111-1111-4111-8111-111111111212', 'authenticated', 'authenticated', 'rls-editor-a@example.com', 'x', now()),
  ('11111111-1111-4111-8111-111111111213', 'authenticated', 'authenticated', 'rls-viewer-a@example.com', 'x', now()),
  ('22222222-2222-4222-8222-222222222214', 'authenticated', 'authenticated', 'rls-editor-b@example.com', 'x', now());

insert into public.users (id, agency_id, email, full_name, role)
values
  ('11111111-1111-4111-8111-111111111211', '11111111-1111-4111-8111-111111111111', 'rls-admin-a@example.com', 'Admin A', 'admin'),
  ('11111111-1111-4111-8111-111111111212', '11111111-1111-4111-8111-111111111111', 'rls-editor-a@example.com', 'Editor A', 'editor'),
  ('11111111-1111-4111-8111-111111111213', '11111111-1111-4111-8111-111111111111', 'rls-viewer-a@example.com', 'Viewer A', 'viewer'),
  ('22222222-2222-4222-8222-222222222214', '22222222-2222-4222-8222-222222222222', 'rls-editor-b@example.com', 'Editor B', 'editor');

insert into public.clients (id, agency_id, name, domain, industry)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'Client A', 'client-a.example', 'Tech'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '22222222-2222-4222-8222-222222222222', 'Client B', 'client-b.example', 'Retail');

-- Admin A: can see only own agency and can create/delete own clients.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111211', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare n int;
begin
  select count(*) into n from public.clients;
  if n <> 1 then
    raise exception 'admin_a should see exactly 1 client, got %', n;
  end if;
end $$;

insert into public.clients (id, agency_id, name, domain, industry)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '11111111-1111-4111-8111-111111111111', 'Client A2', 'client-a2.example', 'Tech');

do $$
declare n int;
begin
  with deleted as (delete from public.clients where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2' returning id)
  select count(*) into n from deleted;

  if n <> 1 then
    raise exception 'admin_a should delete own client, deleted % rows', n;
  end if;
end $$;

reset role;

-- Editor A: can write within own client scope, cannot delete clients.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111212', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare n int;
begin
  with deleted as (delete from public.clients where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' returning id)
  select count(*) into n from deleted;

  if n <> 0 then
    raise exception 'editor_a must not delete clients, deleted % rows', n;
  end if;
end $$;

insert into public.mentions (id, client_id, platform_id, query, content, sentiment, sentiment_score, detected_at)
values (
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.platforms order by created_at asc limit 1),
  'brand query',
  'owned mention',
  'neutral',
  0,
  now()
);

do $$
begin
  begin
    insert into public.mentions (id, client_id, platform_id, query, content, sentiment, sentiment_score, detected_at)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      (select id from public.platforms order by created_at asc limit 1),
      'brand query',
      'cross agency mention',
      'neutral',
      0,
      now()
    );
    raise exception 'editor_a should not insert mention for another agency';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise;
    end if;
  end;
end;
$$;

reset role;

-- Viewer A: read-only inside own agency.
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111213', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
begin
  begin
    insert into public.mentions (id, client_id, platform_id, query, content, sentiment, sentiment_score, detected_at)
    values (
      'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      (select id from public.platforms order by created_at asc limit 1),
      'brand query',
      'viewer mention',
      'neutral',
      0,
      now()
    );
    raise exception 'viewer_a should not insert mentions';
  exception when others then
    if sqlerrm not ilike '%row-level security%' then
      raise;
    end if;
  end;
end;
$$;

reset role;

-- Editor B: cannot see agency A data.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222214', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare n_clients int;
declare n_mentions int;
begin
  select count(*) into n_clients from public.clients;
  if n_clients <> 1 then
    raise exception 'editor_b should see exactly 1 own client, got %', n_clients;
  end if;

  select count(*) into n_mentions from public.mentions;
  if n_mentions <> 0 then
    raise exception 'editor_b should not see agency_a mentions, got %', n_mentions;
  end if;
end $$;

reset role;
rollback;

