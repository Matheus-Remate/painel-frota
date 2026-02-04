-- Make chassis and renavam optional
-- Execute in Supabase SQL Editor

ALTER TABLE vehicles 
ALTER COLUMN chassis DROP NOT NULL;

ALTER TABLE vehicles 
ALTER COLUMN renavam DROP NOT NULL;
