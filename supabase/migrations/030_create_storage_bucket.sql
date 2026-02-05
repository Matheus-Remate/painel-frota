-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', true)
on conflict (id) do nothing;

-- Allow anonymous uploads to the bucket
create policy "Allow anonymous uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'checkin-photos');

-- Allow generic select access (to view photos)
create policy "Give public access to checkin-photos"
on storage.objects
for select
to public
using (bucket_id = 'checkin-photos');

-- Allow authenticated uploads as well
create policy "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'checkin-photos');
