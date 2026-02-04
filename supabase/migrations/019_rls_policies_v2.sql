-- Migration 019: Comprehensive RLS Upgrade (RBAC)
-- Purpose: Implement granular security for all tables based on Admin, Gestor, and Solicitante roles.

-- 1. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Reset and Enable RLS on ALL tables
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        -- Drop existing policies to ensure a clean state
        EXECUTE (
            SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.%I', policyname, tablename), '; ')
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = table_name
        );
    END LOOP;
END $$;

-- 3. Profiles Policies
CREATE POLICY "Profiles: viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles: users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Profiles: admins can do everything"
  ON public.profiles FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- 4. Vehicles Policies
CREATE POLICY "Vehicles: viewable by authenticated users"
  ON public.vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Vehicles: gestors and admins manage all"
  ON public.vehicles FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 5. Drivers Policies
CREATE POLICY "Drivers: viewable by authenticated users"
  ON public.drivers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Drivers: users manage own driver profile"
  ON public.drivers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Drivers: gestors and admins manage all"
  ON public.drivers FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 6. Check-ins Policies
CREATE POLICY "Check-ins: viewable by authenticated users"
  ON public.check_ins FOR SELECT TO authenticated USING (true);

CREATE POLICY "Check-ins: anyone authenticated can insert"
  ON public.check_ins FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Check-ins: gestors and admins manage all"
  ON public.check_ins FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 7. Photos Policies
CREATE POLICY "Photos: viewable by authenticated users"
  ON public.photos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Photos: anyone authenticated can insert"
  ON public.photos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Photos: gestors and admins manage all"
  ON public.photos FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 8. Reservations Policies
CREATE POLICY "Reservations: users view and manage own"
  ON public.reservations FOR ALL TO authenticated 
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()) OR
    public.get_user_role() IN ('admin', 'gestor')
  );

-- 9. Maintenances Policies
CREATE POLICY "Maintenances: viewable by authenticated users"
  ON public.maintenances FOR SELECT TO authenticated USING (true);

CREATE POLICY "Maintenances: gestors and admins manage all"
  ON public.maintenances FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 10. Vehicle Requests Policies
CREATE POLICY "Vehicle Requests: users view and manage own"
  ON public.vehicle_requests FOR ALL TO authenticated 
  USING (
    requester_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    public.get_user_role() IN ('admin', 'gestor')
  );

-- 11. Occurrences Policies
CREATE POLICY "Occurrences: viewable by authenticated users"
  ON public.occurrences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Occurrences: anyone authenticated can insert"
  ON public.occurrences FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Occurrences: gestors and admins manage all"
  ON public.occurrences FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- 12. Occurrence Types Policies
CREATE POLICY "Occurrence Types: viewable by authenticated users"
  ON public.occurrence_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Occurrence Types: only admins manage"
  ON public.occurrence_types FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- 13. Usage Categories Policies
CREATE POLICY "Usage Categories: viewable by authenticated users"
  ON public.usage_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usage Categories: only admins manage"
  ON public.usage_categories FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- 14. Brands & Models Policies
CREATE POLICY "Brands: viewable by authenticated users"
  ON public.brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "Brands: only admins manage"
  ON public.brands FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Models: viewable by authenticated users"
  ON public.models FOR SELECT TO authenticated USING (true);

CREATE POLICY "Models: only admins manage"
  ON public.models FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');
