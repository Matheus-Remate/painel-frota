-- Row Level Security (RLS)

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;

-- Políticas para Veículos
CREATE POLICY "Veículos são visíveis para todos"
  ON vehicles FOR SELECT
  USING (true);

CREATE POLICY "Apenas usuários autenticados podem criar veículos"
  ON vehicles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas usuários autenticados podem atualizar veículos"
  ON vehicles FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Políticas para Condutores
CREATE POLICY "Condutores visíveis para autenticados"
  ON drivers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Condutores podem atualizar seus próprios dados"
  ON drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem criar condutores"
  ON drivers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Políticas para Check-ins
CREATE POLICY "Check-ins visíveis para autenticados"
  ON check_ins FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Condutores podem criar check-ins"
  ON check_ins FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Políticas para Fotos
CREATE POLICY "Fotos visíveis para autenticados"
  ON photos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem fazer upload de fotos"
  ON photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Políticas para Reservas
CREATE POLICY "Reservas visíveis para autenticados"
  ON reservations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar reservas"
  ON reservations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar reservas"
  ON reservations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Políticas para Manutenções
CREATE POLICY "Manutenções visíveis para autenticados"
  ON maintenances FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar manutenções"
  ON maintenances FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar manutenções"
  ON maintenances FOR UPDATE
  USING (auth.role() = 'authenticated');
