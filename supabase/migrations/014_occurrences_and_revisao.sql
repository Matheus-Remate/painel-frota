-- Add driver_id to vehicle_requests (linking to drivers table)
ALTER TABLE vehicle_requests 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);

-- Create occurrence_types table
CREATE TABLE IF NOT EXISTS occurrence_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default occurrence types
INSERT INTO occurrence_types (name) VALUES 
('Multa'),
('Pneu'),
('Acionamento de Seguro'),
('Manutenção Corretiva'),
('Avaria');

-- Create occurrences table
CREATE TABLE IF NOT EXISTS occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id), -- Nullable, but auto-linked if possible
  type_id UUID NOT NULL REFERENCES occurrence_types(id),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, RESOLVED
  observation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_occurrences_vehicle ON occurrences(vehicle_id);
CREATE INDEX idx_occurrences_driver ON occurrences(driver_id);
CREATE INDEX idx_occurrences_date ON occurrences(date);

CREATE TRIGGER update_occurrences_updated_at BEFORE UPDATE ON occurrences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update check_ins table for "Revisão" (Resolved status)
ALTER TABLE check_ins 
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

CREATE INDEX idx_check_ins_resolved ON check_ins(resolved);
