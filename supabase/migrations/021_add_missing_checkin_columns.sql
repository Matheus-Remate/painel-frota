-- Add missing columns to check_ins table
-- These columns are referenced in the dashboard queries but were missing from the schema

ALTER TABLE check_ins
ADD COLUMN IF NOT EXISTS fuel_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Optional: Comment on columns
COMMENT ON COLUMN check_ins.fuel_level IS 'Fuel level at check-in (e.g. 1/4, 1/2, Full)';
COMMENT ON COLUMN check_ins.photos IS 'Array of photo URLs attached to the check-in';
