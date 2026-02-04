-- Fix RLS for Occurrence Types and harden get_user_role
-- 1. Ensure get_user_role has correct search_path and is accessible
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Drop ambiguous or restrictive policies
DROP POLICY IF EXISTS "Occurrence Types: gestors and admins manage all" ON public.occurrence_types;
DROP POLICY IF EXISTS "Occurrence Types: only admins manage" ON public.occurrence_types;
DROP POLICY IF EXISTS "Occurence Types: gestors and admins manage all" ON public.occurrence_types; -- Fix potential typo in previous migrations if any

-- 3. Re-create strict policies
-- Allow SELECT for all authenticated
CREATE POLICY "Occurrence Types: viewable by authenticated users"
  ON public.occurrence_types FOR SELECT TO authenticated USING (true);

-- Allow ALL (Insert, Update, Delete) for Admin/Gestor
CREATE POLICY "Occurrence Types: gestors and admins manage all"
  ON public.occurrence_types
  FOR ALL
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
  );
