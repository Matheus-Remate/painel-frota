-- Migration 017: Vehicle Soft Delete and Data Cleanup
-- Purpose: Implement a consistent soft-delete pattern for vehicles and clean up reports of "phantom" vehicles.

-- 1. Add deleted_at column to vehicles table
ALTER TABLE IF EXISTS public.vehicles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Clean up based on user report:
-- The user stated that ONLY these plates should exist:
-- ABC5262 (Silverado)
-- abc1231 (Montana)
-- CGO-03E20 (Montana)

-- We will mark all other vehicles as deleted if they don't match these plates.
-- We use ILIKE because the user provided some plates in lowercase/uppercase.

UPDATE public.vehicles
SET deleted_at = NOW()
WHERE license_plate NOT IN ('ABC5262', 'abc1231', 'CGO-03E20')
  AND (license_plate NOT ILIKE 'ABC5262')
  AND (license_plate NOT ILIKE 'abc1231')
  AND (license_plate NOT ILIKE 'CGO-03E20');

-- 3. Verify specifically the user's reported "phantom" plates if they exist as hard records
-- CGO-03B9
-- CGO-03E1
-- CGO-03E2
UPDATE public.vehicles
SET deleted_at = NOW()
WHERE license_plate IN ('CGO-03B9', 'CGO-03E1', 'CGO-03E2');
