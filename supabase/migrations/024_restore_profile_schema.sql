-- Restore missing columns to match Application Code expectations
-- This migration fixes the schema drift where profiles table had id/full_name but code expected user_id/first_name/last_name/email

-- 1. Add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill user_id (Assuming current id is the user_id based on previous analysis of constraints)
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;

-- 3. Backfill email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 4. Backfill first_name and last_name from full_name
UPDATE public.profiles
SET 
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = NULLIF(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2), '')
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Handling cases where last_name is empty (single name)
UPDATE public.profiles
SET last_name = ''
WHERE last_name IS NULL AND first_name IS NOT NULL;

-- 5. Fix the trigger function to populate these columns correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email, role, full_name, avatar_url)
  VALUES (
    NEW.id, -- Use the same ID for simplicity if that was the pattern, or generate new if we want strict separation, but keeping 1:1 is fine regarding existing data
    NEW.id, -- user_id is definitely NEW.id
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'solicitante'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', (NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name')),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Handle potential race conditions
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable constraints/policies if needed
-- (Assuming RLS policies are already fine, but might need to check if they rely on user_id column now)

-- Update RLS "Users can insert own profile" to ensure it checks user_id
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Update RLS "Users can update own profile"
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
