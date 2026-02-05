-- 1. Vehicles: Drop existing policy to avoid conflict and recreate
drop policy if exists "Allow generic read access to vehicles" on public.vehicles;

create policy "Allow generic read access to vehicles"
on public.vehicles
for select
to anon
using (true);

-- 2. Check-ins: Drop existing policy and recreate
drop policy if exists "Allow anonymous inserts to check_ins" on public.check_ins;

create policy "Allow anonymous inserts to check_ins"
on public.check_ins
for insert
to anon
with check (true);

-- 3. Make driver_id nullable (safe operation, succeeds even if already nullable)
alter table public.check_ins alter column driver_id drop not null;

-- 4. Grants (idempotent)
grant select on public.vehicles to anon;
grant insert on public.check_ins to anon;
grant select on public.brands to anon;
grant select on public.models to anon;
grant select on public.occurrence_types to anon;
grant usage, select on all sequences in schema public to anon;
