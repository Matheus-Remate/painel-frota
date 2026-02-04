-- CRITICAL SECURITY FIX: Restrict Profile Access
-- Currently, authenticatd users can view ALL profiles (USING true).
-- This migration restricts access so users can ONLY view their own profile.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop insecure policy
DROP POLICY IF EXISTS "Profiles são visíveis para usuários autenticados" ON profiles;

-- Create strict policy
-- Users can only see their own profile
-- Admins/Gestores might need to see others (for listing users), but for the Profile Page specifically, this is the safe baseline.
-- We will add a separate policy for Admins if needed later, but for now, privacy first.

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Verify and ensure update policy is also strict
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
