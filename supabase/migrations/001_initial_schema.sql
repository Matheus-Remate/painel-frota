-- Criação de ENUMs
CREATE TYPE usage_category AS ENUM ('FIXED', 'OFFICE', 'GENERAL', 'MARKETING');
CREATE TYPE vehicle_status AS ENUM ('IN_YARD', 'ON_ROUTE', 'AWAITING_REPAIR', 'IN_MAINTENANCE');
CREATE TYPE check_status AS ENUM ('OK', 'ALERT', 'DAMAGE');
CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE maintenance_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Veículos
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate VARCHAR(10) UNIQUE NOT NULL,
  chassis VARCHAR(50) UNIQUE NOT NULL,
  renavam VARCHAR(20) UNIQUE NOT NULL,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(30) NOT NULL,
  capacity JSONB NOT NULL,
  fuel_type VARCHAR(20) NOT NULL,
  usage_category usage_category NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'IN_YARD',
  qr_code_url TEXT UNIQUE,
  qr_code_data TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Condutores
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  cnh_category VARCHAR(10) NOT NULL,
  cnh_expiration DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  odometer INTEGER NOT NULL,
  cleanliness_status check_status NOT NULL,
  dash_lights_status check_status NOT NULL,
  tires_exterior_status check_status NOT NULL,
  repair_notes TEXT,
  has_issues BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_check_ins_vehicle ON check_ins(vehicle_id);
CREATE INDEX idx_check_ins_driver ON check_ins(driver_id);

-- Tabela de Fotos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id UUID NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_checkin ON photos(check_in_id);

-- Tabela de Reservas
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  purpose TEXT,
  status reservation_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);

-- Tabela de Manutenções
CREATE TABLE maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  description TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status maintenance_status DEFAULT 'SCHEDULED',
  cost DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenances_vehicle ON maintenances(vehicle_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON maintenances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
