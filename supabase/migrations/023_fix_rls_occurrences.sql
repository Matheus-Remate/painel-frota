-- Fix RLS for Occurrences
-- Purpose: Ensure authenticated users can create occurrences, but only Admins/Gestors can manage them (Update/Delete)

-- 1. Drop existing policies to remove ambiguity
DROP POLICY IF EXISTS "Occurrences: viewable by authenticated users" ON public.occurrences;
DROP POLICY IF EXISTS "Occurrences: anyone authenticated can insert" ON public.occurrences;
DROP POLICY IF EXISTS "Occurrences: gestors and admins manage all" ON public.occurrences;

-- 2. Create Explicit Policies

-- VIEW: Everyone can see occurrences (transparency)
CREATE POLICY "Occurrences: viewable by authenticated users"
  ON public.occurrences FOR SELECT TO authenticated USING (true);

-- INSERT: Everyone can report an occurrence
CREATE POLICY "Occurrences: anyone authenticated can insert"
  ON public.occurrences FOR INSERT TO authenticated WITH CHECK (true);

-- UPDATE: Only Admins and Gestors can update (e.g. resolve, add costs)
CREATE POLICY "Occurrences: gestors and admins manage updates"
  ON public.occurrences
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

-- DELETE: Only Admins and Gestors can delete
CREATE POLICY "Occurrences: gestors and admins manage deletes"
  ON public.occurrences
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));
