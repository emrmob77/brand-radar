create extension if not exists pgcrypto;

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  primary_color text default '#376df6',
  secondary_color text default '#2563eb',
  custom_domain text,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  name text not null,
  domain text not null,
  logo_url text,
  industry text not null,
  health_score integer not null default 0 check (health_score >= 0 and health_score <= 100),
  active_platforms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_id, domain)
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon_url text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mentions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  platform_id uuid not null references public.platforms (id),
  query text not null,
  content text not null,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  sentiment_score numeric(3,2) check (sentiment_score >= -1 and sentiment_score <= 1),
  detected_at timestamptz not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.citations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  platform_id uuid not null references public.platforms (id),
  query text not null,
  source_url text not null,
  source_type text not null check (source_type in ('wikipedia', 'reddit', 'review_site', 'news', 'blog', 'other')),
  authority_score integer check (authority_score >= 0 and authority_score <= 100),
  detected_at timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'lost'))
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  domain text not null,
  created_at timestamptz not null default now(),
  unique (client_id, domain)
);

create table if not exists public.queries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  text text not null,
  category text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table if not exists public.optimizations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  description text not null,
  impact text not null check (impact in ('low', 'medium', 'high')),
  effort text not null check (effort in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  readiness_score integer check (readiness_score >= 0 and readiness_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.hallucinations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  platform_id uuid not null references public.platforms (id),
  query text not null,
  incorrect_info text not null,
  correct_info text not null,
  risk_level text not null check (risk_level in ('critical', 'high', 'medium', 'low')),
  detected_at timestamptz not null,
  corrected_at timestamptz,
  status text not null default 'open' check (status in ('open', 'corrected', 'monitoring')),
  created_at timestamptz not null default now()
);

create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  metric text not null check (metric in ('mentions', 'sentiment', 'citations', 'hallucinations', 'competitor_movement')),
  condition text not null check (condition in ('above', 'below', 'equals', 'changes_by')),
  threshold numeric not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  alert_rule_id uuid not null references public.alert_rules (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  message text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_agency_id on public.clients (agency_id);
create index if not exists idx_mentions_client_id on public.mentions (client_id);
create index if not exists idx_mentions_platform_id on public.mentions (platform_id);
create index if not exists idx_mentions_detected_at on public.mentions (detected_at desc);
create index if not exists idx_citations_client_id on public.citations (client_id);
create index if not exists idx_citations_status on public.citations (status);
create index if not exists idx_competitors_client_id on public.competitors (client_id);
create index if not exists idx_queries_client_id on public.queries (client_id);
create index if not exists idx_optimizations_client_status on public.optimizations (client_id, status);
create index if not exists idx_hallucinations_client_risk on public.hallucinations (client_id, risk_level);
create index if not exists idx_alert_rules_client_id on public.alert_rules (client_id);
create index if not exists idx_alerts_client_id_read on public.alerts (client_id, read);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row
execute function public.set_updated_at();

drop trigger if exists trg_optimizations_updated_at on public.optimizations;
create trigger trg_optimizations_updated_at
before update on public.optimizations
for each row
execute function public.set_updated_at();
