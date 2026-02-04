-- DEBUGGING RLS: Simplify to minimum viable policy
-- Removing the recursive admin check for now to rule out infinite recursion or complexity issues.
-- We will restore admin access later once basic owner access is confirmed.

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles; -- precaution

CREATE POLICY "Simple owner access"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
