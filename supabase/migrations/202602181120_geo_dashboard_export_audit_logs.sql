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
