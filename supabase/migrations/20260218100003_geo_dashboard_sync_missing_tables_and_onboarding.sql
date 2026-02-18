alter table public.users
add column if not exists onboarding_completed_at timestamptz,
add column if not exists onboarding_skipped_at timestamptz;

create index if not exists idx_users_onboarding_completed_at
on public.users (onboarding_completed_at);

update public.users u
set onboarding_completed_at = now()
where u.onboarding_completed_at is null
  and exists (
    select 1
    from public.clients c
    where c.agency_id = u.agency_id
  );

create table if not exists public.export_audit_logs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  scope text not null,
  format text not null check (format in ('csv', 'json', 'pdf', 'zip')),
  file_name text not null,
  row_count integer not null default 0 check (row_count >= 0),
  is_bulk boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_audit_logs_agency_created_at
  on public.export_audit_logs (agency_id, created_at desc);

alter table public.export_audit_logs enable row level security;

drop policy if exists export_audit_logs_select_agency on public.export_audit_logs;
create policy export_audit_logs_select_agency
on public.export_audit_logs
for select
using (agency_id = public.current_agency_id());

drop policy if exists export_audit_logs_insert_writer on public.export_audit_logs;
create policy export_audit_logs_insert_writer
on public.export_audit_logs
for insert
with check (
  agency_id = public.current_agency_id()
  and user_id = auth.uid()
  and public.can_write_data()
  and (client_id is null or public.can_access_client(client_id))
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  created_by uuid not null references public.users (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies (id) on delete set null,
  source text not null default 'ai_monitoring',
  event_type text not null,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_api_keys_agency_id on public.api_keys (agency_id);
create index if not exists idx_api_keys_revoked_at on public.api_keys (revoked_at);
create index if not exists idx_webhook_events_received_at on public.webhook_events (received_at desc);
create index if not exists idx_webhook_events_agency_id on public.webhook_events (agency_id);

alter table public.api_keys enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists api_keys_select_admin on public.api_keys;
create policy api_keys_select_admin
on public.api_keys
for select
using (agency_id = public.current_agency_id() and public.is_admin());

drop policy if exists api_keys_insert_admin on public.api_keys;
create policy api_keys_insert_admin
on public.api_keys
for insert
with check (agency_id = public.current_agency_id() and public.is_admin());

drop policy if exists api_keys_update_admin on public.api_keys;
create policy api_keys_update_admin
on public.api_keys
for update
using (agency_id = public.current_agency_id() and public.is_admin())
with check (agency_id = public.current_agency_id() and public.is_admin());

drop policy if exists webhook_events_select_admin on public.webhook_events;
create policy webhook_events_select_admin
on public.webhook_events
for select
using (agency_id is null or (agency_id = public.current_agency_id() and public.is_admin()));

drop policy if exists webhook_events_insert_service_role on public.webhook_events;
create policy webhook_events_insert_service_role
on public.webhook_events
for insert
with check (auth.role() = 'service_role');

drop policy if exists webhook_events_update_service_role on public.webhook_events;
create policy webhook_events_update_service_role
on public.webhook_events
for update
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
