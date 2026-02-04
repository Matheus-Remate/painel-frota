-- FIX DRIVERS RLS V2 (SOLUÇÃO AGRESSIVA)
-- Este script remove TODAS as regras anteriores da tabela drivers para evitar conflitos.

-- 1. Habilitar segurança
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 2. LIMPAR TUDO (Remove regras velhas que podem estar bloqueando)
DROP POLICY IF EXISTS "Drivers access policy" ON drivers;
DROP POLICY IF EXISTS "Drivers read access" ON drivers;
DROP POLICY IF EXISTS "Drivers insert policy" ON drivers;
DROP POLICY IF EXISTS "Drivers manage access" ON drivers;
DROP POLICY IF EXISTS "Drivers basic insert" ON drivers;
DROP POLICY IF EXISTS "Drivers full access" ON drivers;
DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;

-- 3. CRIAR REGRA ÚNICA PERMISSIVA
-- Permite que qualquer usuário logado faça TUDO (Ver, Criar, Editar, Deletar) na tabela drivers
CREATE POLICY "Drivers_Policy_V2_Ok"
  ON drivers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
