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
