-- CORREÇÃO DE PERMISSÕES (RLS) PARA MODO DESENVOLVIMENTO
-- Permite que usuários anônimos (sem login) gravem dados.
-- Execute isso no SQL Editor do Supabase.

-- 1. Veículos
DROP POLICY IF EXISTS "Veículos são visíveis para todos" ON vehicles;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem criar veículos" ON vehicles;
DROP POLICY IF EXISTS "Apenas usuários autenticados podem atualizar veículos" ON vehicles;

CREATE POLICY "Public Access Vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);

-- 2. Condutores
DROP POLICY IF EXISTS "Condutores visíveis para autenticados" ON drivers;
DROP POLICY IF EXISTS "Condutores podem atualizar seus próprios dados" ON drivers;
DROP POLICY IF EXISTS "Usuários autenticados podem criar condutores" ON drivers;

CREATE POLICY "Public Access Drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);

-- 3. Check-ins
DROP POLICY IF EXISTS "Check-ins visíveis para autenticados" ON check_ins;
DROP POLICY IF EXISTS "Condutores podem criar check-ins" ON check_ins;

CREATE POLICY "Public Access Checkins" ON check_ins FOR ALL USING (true) WITH CHECK (true);

-- 4. Fotos (Storage Objects table usually handled differently, but here for the table record)
DROP POLICY IF EXISTS "Fotos visíveis para autenticados" ON photos;
DROP POLICY IF EXISTS "Usuários podem fazer upload de fotos" ON photos;

CREATE POLICY "Public Access Photos" ON photos FOR ALL USING (true) WITH CHECK (true);
