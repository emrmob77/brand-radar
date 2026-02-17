insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos',
  'client-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id)
do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists client_logos_public_read on storage.objects;
create policy client_logos_public_read
on storage.objects
for select
using (bucket_id = 'client-logos');

drop policy if exists client_logos_authenticated_insert on storage.objects;
create policy client_logos_authenticated_insert
on storage.objects
for insert
to authenticated
with check (bucket_id = 'client-logos');

drop policy if exists client_logos_authenticated_update on storage.objects;
create policy client_logos_authenticated_update
on storage.objects
for update
to authenticated
using (bucket_id = 'client-logos')
with check (bucket_id = 'client-logos');

drop policy if exists client_logos_authenticated_delete on storage.objects;
create policy client_logos_authenticated_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'client-logos');

