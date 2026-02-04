-- Enums para roles e status de solicitações
CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'solicitante');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- Tabela de Perfis de Usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'solicitante',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Marcas de Veículos
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Modelos de Veículos
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE INDEX idx_models_brand ON models(brand_id);

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Solicitações de Veículos
CREATE TABLE vehicle_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  model_id UUID REFERENCES models(id),
  model_name VARCHAR(100), -- Backup caso modelo seja excluído
  event_name VARCHAR(255) NOT NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  driver_name VARCHAR(100) NOT NULL,
  status request_status NOT NULL DEFAULT 'PENDING',
  vehicle_id UUID REFERENCES vehicles(id), -- Preenchido quando aprovado
  approved_by UUID REFERENCES profiles(id),
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_requests_requester ON vehicle_requests(requester_id);
CREATE INDEX idx_vehicle_requests_status ON vehicle_requests(status);
CREATE INDEX idx_vehicle_requests_dates ON vehicle_requests(pickup_datetime, return_datetime);

CREATE TRIGGER update_vehicle_requests_updated_at BEFORE UPDATE ON vehicle_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles são visíveis para usuários autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem criar perfis"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR NOT EXISTS (SELECT 1 FROM profiles) -- Permite primeiro usuário
  );

-- RLS Policies para brands
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marcas são visíveis para todos autenticados"
  ON brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar marcas"
  ON brands FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies para models
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modelos são visíveis para todos autenticados"
  ON models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar modelos"
  ON models FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies para vehicle_requests
ALTER TABLE vehicle_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solicitantes veem suas próprias solicitações"
  ON vehicle_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Solicitantes podem criar solicitações"
  ON vehicle_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Gestores e admins podem atualizar solicitações"
  ON vehicle_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'solicitante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
