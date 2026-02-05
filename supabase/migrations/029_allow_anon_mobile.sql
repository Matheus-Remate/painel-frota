-- Allow anonymous read access to vehicles (so the QR page works)
create policy "Allow generic read access to vehicles"
on public.vehicles
for select
to anon
using (true);

-- Allow anonymous insert to check_ins (so they can submit return)
create policy "Allow anonymous inserts to check_ins"
on public.check_ins
for insert
to anon
with check (true);

-- Make driver_id nullable to allow anonymous check-ins
alter table public.check_ins alter column driver_id drop not null;

-- Grant usage on sequence just in case (usually generic, but good to be safe)
grant usage, select on all sequences in schema public to anon;
grant insert on public.check_ins to anon;
grant select on public.vehicles to anon;
grant select on public.brands to anon;
grant select on public.models to anon;
grant select on public.occurrence_types to anon; -- For validation if needed
