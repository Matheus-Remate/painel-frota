-- SECURE FETCH FUNCTION
-- This function bypasses RLS to guarantee the authenticated user can ALWAYS read their own profile.
-- Usage: supabase.rpc('get_my_profile')

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict check: Return rows only where user_id matches the caller's UUID
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE user_id = auth.uid();
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
