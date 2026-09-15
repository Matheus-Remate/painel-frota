-- Seed de Marcas de Exemplo
INSERT INTO brands (name) VALUES 
  ('Fiat'),
  ('Volkswagen'),
  ('Chevrolet'),
  ('Ford'),
  ('Toyota'),
  ('Honda'),
  ('Renault'),
  ('Hyundai'),
  ('Jeep'),
  ('Mercedes-Benz')
ON CONFLICT (name) DO NOTHING;

-- Seed de Modelos de Exemplo
INSERT INTO models (brand_id, name)
SELECT b.id, m.name
FROM brands b
CROSS JOIN (
  SELECT 'Argo' AS name, 'Fiat' AS brand UNION ALL
  SELECT 'Cronos', 'Fiat' UNION ALL
  SELECT 'Strada', 'Fiat' UNION ALL
  SELECT 'Ducato', 'Fiat' UNION ALL
  SELECT 'Fiorino', 'Fiat' UNION ALL
  SELECT 'Toro', 'Fiat' UNION ALL
  SELECT 'Gol', 'Volkswagen' UNION ALL
  SELECT 'Polo', 'Volkswagen' UNION ALL
  SELECT 'Virtus', 'Volkswagen' UNION ALL
  SELECT 'Saveiro', 'Volkswagen' UNION ALL
  SELECT 'Amarok', 'Volkswagen' UNION ALL
  SELECT 'Onix', 'Chevrolet' UNION ALL
  SELECT 'S10', 'Chevrolet' UNION ALL
  SELECT 'Spin', 'Chevrolet' UNION ALL
  SELECT 'Tracker', 'Chevrolet' UNION ALL
  SELECT 'Ranger', 'Ford' UNION ALL
  SELECT 'Ka', 'Ford' UNION ALL
  SELECT 'Territory', 'Ford' UNION ALL
  SELECT 'Hilux', 'Toyota' UNION ALL
  SELECT 'Corolla', 'Toyota' UNION ALL
  SELECT 'SW4', 'Toyota' UNION ALL
  SELECT 'Civic', 'Honda' UNION ALL
  SELECT 'HR-V', 'Honda' UNION ALL
  SELECT 'City', 'Honda' UNION ALL
  SELECT 'Kwid', 'Renault' UNION ALL
  SELECT 'Sandero', 'Renault' UNION ALL
  SELECT 'Duster', 'Renault' UNION ALL
  SELECT 'Master', 'Renault' UNION ALL
  SELECT 'HB20', 'Hyundai' UNION ALL
  SELECT 'Creta', 'Hyundai' UNION ALL
  SELECT 'Tucson', 'Hyundai' UNION ALL
  SELECT 'Compass', 'Jeep' UNION ALL
  SELECT 'Renegade', 'Jeep' UNION ALL
  SELECT 'Commander', 'Jeep' UNION ALL
  SELECT 'Sprinter', 'Mercedes-Benz' UNION ALL
  SELECT 'Vito', 'Mercedes-Benz'
) m
WHERE b.name = m.brand
ON CONFLICT (brand_id, name) DO NOTHING;
