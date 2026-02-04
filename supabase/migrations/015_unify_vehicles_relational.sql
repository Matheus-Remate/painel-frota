-- Migration: Unify Vehicles with Models/Brands
-- 1. Add model_id column
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES models(id);

-- 2. Populate model_id based on brand and model strings
-- This assumes brands and models are already synced (which we just did)
UPDATE vehicles v
SET model_id = m.id
FROM models m
JOIN brands b ON m.brand_id = b.id
WHERE 
  LOWER(v.brand) = LOWER(b.name) AND 
  LOWER(v.model) = LOWER(m.name)
  AND v.model_id IS NULL;

-- 3. (Verification) Check if any vehicle is still without model_id
-- SELECT count(*) FROM vehicles WHERE model_id IS NULL;
