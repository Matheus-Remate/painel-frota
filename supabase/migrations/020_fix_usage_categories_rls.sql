-- Migration 020: Fix RLS for Usage Categories, Brands and Models
-- Purpose: Allow Gestors to also manage these settings tables, which were previously restricted to Admins only.

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Usage Categories: only admins manage" ON public.usage_categories;
DROP POLICY IF EXISTS "Brands: only admins manage" ON public.brands;
DROP POLICY IF EXISTS "Models: only admins manage" ON public.models;
DROP POLICY IF EXISTS "Occurrence Types: only admins manage" ON public.occurrence_types;

-- Create new inclusive policies
CREATE POLICY "Usage Categories: gestors and admins manage all"
  ON public.usage_categories FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

CREATE POLICY "Brands: gestors and admins manage all"
  ON public.brands FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

CREATE POLICY "Models: gestors and admins manage all"
  ON public.models FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));

CREATE POLICY "Occurrence Types: gestors and admins manage all"
  ON public.occurrence_types FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'gestor'));
