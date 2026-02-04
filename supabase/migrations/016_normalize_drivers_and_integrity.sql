-- 1. Create enum for occurrence status if not exists
DO $$ BEGIN
    CREATE TYPE occurrence_status AS ENUM ('OPEN', 'RESOLVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Normalize occurrences status
-- First drop the default to avoid casting errors
ALTER TABLE occurrences ALTER COLUMN status DROP DEFAULT;

ALTER TABLE occurrences 
ALTER COLUMN status TYPE occurrence_status 
USING (
    CASE 
        WHEN status = 'RESOLVED' THEN 'RESOLVED'::occurrence_status
        WHEN status = 'CANCELLED' THEN 'CANCELLED'::occurrence_status
        ELSE 'OPEN'::occurrence_status
    END
);

-- Re-set the default using the enum type
ALTER TABLE occurrences ALTER COLUMN status SET DEFAULT 'OPEN'::occurrence_status;

-- 3. Standardize driver references and integrity
-- Add ON DELETE CASCADE to check_ins for easier maintenance
ALTER TABLE check_ins
DROP CONSTRAINT IF EXISTS check_ins_driver_id_fkey,
ADD CONSTRAINT check_ins_driver_id_fkey 
    FOREIGN KEY (driver_id) 
    REFERENCES drivers(id) 
    ON DELETE CASCADE;

-- Add ON DELETE SET NULL to reservations and occurrences
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS reservations_driver_id_fkey,
ADD CONSTRAINT reservations_driver_id_fkey 
    FOREIGN KEY (driver_id) 
    REFERENCES drivers(id) 
    ON DELETE SET NULL;

ALTER TABLE occurrences
DROP CONSTRAINT IF EXISTS occurrences_driver_id_fkey,
ADD CONSTRAINT occurrences_driver_id_fkey 
    FOREIGN KEY (driver_id) 
    REFERENCES drivers(id) 
    ON DELETE SET NULL;

-- 4. Standardize Admin/Review references
-- Change check_ins.resolved_by from auth.users(id) to profiles(id)
-- Note: Profiles table uses user_id as a link, but referencing profiles(id) is more consistent with the rest of the app logic.
ALTER TABLE check_ins
DROP CONSTRAINT IF EXISTS check_ins_resolved_by_fkey,
ADD CONSTRAINT check_ins_resolved_by_fkey 
    FOREIGN KEY (resolved_by) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;

-- 5. Add soft delete to drivers
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 6. Attempt to auto-populate driver_id in vehicle_requests using driver_name matching
-- This is a one-time best-effort recovery for existing data
UPDATE vehicle_requests vr
SET driver_id = d.id
FROM drivers d
WHERE vr.driver_id IS NULL 
  AND vr.driver_name IS NOT NULL 
  AND LOWER(vr.driver_name) = LOWER(d.name);
