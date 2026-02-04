-- FIX DRIVERS RLS (Permitir criar motoristas)

-- Habilitar RLS na tabela drivers (se não estiver)
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- 1. Permitir LEITURA para todos autenticados
DROP POLICY IF EXISTS "Drivers access policy" ON drivers;
CREATE POLICY "Drivers read access"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

-- 2. Permitir CRIAÇÃO/EDIÇÃO para Admins e Gestores
-- (Ajuste conforme necessidade: se users comuns puderem criar, mude a regra)
DROP POLICY IF EXISTS "Drivers insert policy" ON drivers;
CREATE POLICY "Drivers manage access"
  ON drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  );

-- 3. PERMISSÃO TEMPORÁRIA (FALLBACK)
-- Se você ainda estiver sem role definida, use esta regra genérica 
-- (DELETE APÓS TESTAR SE QUISER MAIS SEGURANÇA)
CREATE POLICY "Drivers basic insert"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);
