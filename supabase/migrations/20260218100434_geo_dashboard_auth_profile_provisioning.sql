create or replace function public.provision_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agency_id uuid;
  v_full_name text;
begin
  if p_user_id is null then
    return;
  end if;

  if exists (select 1 from public.users u where u.id = p_user_id) then
    return;
  end if;

  v_full_name := nullif(trim(coalesce(p_full_name, '')), '');
  if v_full_name is null then
    v_full_name := nullif(trim(split_part(coalesce(p_email, ''), '@', 1)), '');
  end if;
  if v_full_name is null then
    v_full_name := 'Workspace User';
  end if;

  insert into public.agencies (id, name)
  values (gen_random_uuid(), format('%s Workspace', v_full_name))
  returning id into v_agency_id;

  insert into public.users (
    id,
    agency_id,
    email,
    full_name,
    role,
    onboarding_completed_at,
    onboarding_skipped_at
  )
  values (
    p_user_id,
    v_agency_id,
    coalesce(p_email, format('%s@unknown.local', p_user_id::text)),
    v_full_name,
    'admin',
    null,
    null
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.provision_user_profile(
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

do $$
declare
  r record;
begin
  for r in
    select
      a.id,
      a.email,
      coalesce(a.raw_user_meta_data ->> 'full_name', a.raw_user_meta_data ->> 'name') as full_name
    from auth.users a
    left join public.users u on u.id = a.id
    where u.id is null
  loop
    perform public.provision_user_profile(r.id, r.email, r.full_name);
  end loop;
end;
$$;
