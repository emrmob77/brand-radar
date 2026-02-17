create or replace function public.current_agency_id()
returns uuid
language sql
stable
as $$
  select agency_id from public.users where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.agency_id = public.current_agency_id()
  )
$$;

create or replace function public.can_write_data()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

alter table public.agencies enable row level security;
alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.platforms enable row level security;
alter table public.mentions enable row level security;
alter table public.citations enable row level security;
alter table public.competitors enable row level security;
alter table public.queries enable row level security;
alter table public.optimizations enable row level security;
alter table public.hallucinations enable row level security;
alter table public.alert_rules enable row level security;
alter table public.alerts enable row level security;

drop policy if exists agencies_select_own on public.agencies;
create policy agencies_select_own
on public.agencies
for select
using (id = public.current_agency_id());

drop policy if exists agencies_update_admin on public.agencies;
create policy agencies_update_admin
on public.agencies
for update
using (id = public.current_agency_id() and public.is_admin())
with check (id = public.current_agency_id() and public.is_admin());

drop policy if exists users_select_self on public.users;
create policy users_select_self
on public.users
for select
using (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists clients_select_agency on public.clients;
create policy clients_select_agency
on public.clients
for select
using (agency_id = public.current_agency_id());

drop policy if exists clients_insert_editor_admin on public.clients;
create policy clients_insert_editor_admin
on public.clients
for insert
with check (agency_id = public.current_agency_id() and public.can_write_data());

drop policy if exists clients_update_editor_admin on public.clients;
create policy clients_update_editor_admin
on public.clients
for update
using (agency_id = public.current_agency_id() and public.can_write_data())
with check (agency_id = public.current_agency_id() and public.can_write_data());

drop policy if exists clients_delete_admin on public.clients;
create policy clients_delete_admin
on public.clients
for delete
using (agency_id = public.current_agency_id() and public.is_admin());

drop policy if exists platforms_read_all on public.platforms;
create policy platforms_read_all
on public.platforms
for select
using (true);

drop policy if exists platforms_write_service_role on public.platforms;
create policy platforms_write_service_role
on public.platforms
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

do $$
declare
  table_name text;
  child_tables text[] := array[
    'mentions',
    'citations',
    'competitors',
    'queries',
    'optimizations',
    'hallucinations',
    'alert_rules',
    'alerts'
  ];
begin
  foreach table_name in array child_tables
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_agency', table_name);
    execute format(
      'create policy %I on public.%I for select using (public.can_access_client(client_id))',
      table_name || '_select_agency',
      table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_insert_editor_admin', table_name);
    execute format(
      'create policy %I on public.%I for insert with check (public.can_access_client(client_id) and public.can_write_data())',
      table_name || '_insert_editor_admin',
      table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_update_editor_admin', table_name);
    execute format(
      'create policy %I on public.%I for update using (public.can_access_client(client_id) and public.can_write_data()) with check (public.can_access_client(client_id) and public.can_write_data())',
      table_name || '_update_editor_admin',
      table_name
    );

    execute format('drop policy if exists %I on public.%I', table_name || '_delete_admin', table_name);
    execute format(
      'create policy %I on public.%I for delete using (public.can_access_client(client_id) and public.is_admin())',
      table_name || '_delete_admin',
      table_name
    );
  end loop;
end;
$$;
