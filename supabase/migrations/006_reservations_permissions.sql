-- Liberar acesso publico para reservas (dev mode) para evitar erros de RLS
DROP POLICY IF EXISTS "Reservas visíveis para todos" ON reservations;
DROP POLICY IF EXISTS "Todos podem criar reservas" ON reservations;
DROP POLICY IF EXISTS "Public Access Reservations" ON reservations;

CREATE POLICY "Public Access Reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
