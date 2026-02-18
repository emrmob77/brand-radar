create table if not exists public.prompt_runs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  query_id uuid not null references public.queries (id) on delete cascade,
  platform_id uuid not null references public.platforms (id),
  answer text not null,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2) check (sentiment_score >= -1 and sentiment_score <= 1),
  brand_mentioned boolean not null default false,
  citations jsonb not null default '[]'::jsonb,
  web_results jsonb not null default '[]'::jsonb,
  detected_at timestamptz not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_prompt_runs_client_id on public.prompt_runs (client_id);
create index if not exists idx_prompt_runs_query_id on public.prompt_runs (query_id);
create index if not exists idx_prompt_runs_detected_at on public.prompt_runs (detected_at desc);

alter table public.prompt_runs enable row level security;

drop policy if exists prompt_runs_select_agency on public.prompt_runs;
create policy prompt_runs_select_agency
on public.prompt_runs
for select
using (public.can_access_client(client_id));

drop policy if exists prompt_runs_insert_editor_admin on public.prompt_runs;
create policy prompt_runs_insert_editor_admin
on public.prompt_runs
for insert
with check (public.can_access_client(client_id) and public.can_write_data());

drop policy if exists prompt_runs_update_editor_admin on public.prompt_runs;
create policy prompt_runs_update_editor_admin
on public.prompt_runs
for update
using (public.can_access_client(client_id) and public.can_write_data())
with check (public.can_access_client(client_id) and public.can_write_data());

drop policy if exists prompt_runs_delete_admin on public.prompt_runs;
create policy prompt_runs_delete_admin
on public.prompt_runs
for delete
using (public.can_access_client(client_id) and public.is_admin());
