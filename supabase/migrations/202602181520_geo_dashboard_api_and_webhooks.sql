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
