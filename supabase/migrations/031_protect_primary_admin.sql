-- Protect the primary administrator without storing authentication credentials.
-- The account must already exist in auth.users; its real UUID remains the source of truth.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.is_protected IS
  'Marks the single primary administrator protected from deletion, identity changes, and role downgrade.';

-- If the Auth account already exists when this migration runs, reconcile its profile idempotently.
UPDATE public.profiles AS profile
SET
  first_name = 'Administrador',
  last_name = '',
  email = auth_user.email,
  role = 'admin'::public.user_role,
  is_protected = TRUE
FROM auth.users AS auth_user
WHERE profile.user_id = auth_user.id
  AND lower(auth_user.email) = lower('matheus.marques@remateweb.com');

INSERT INTO public.profiles (id, user_id, first_name, last_name, email, role, is_protected)
SELECT
  auth_user.id,
  auth_user.id,
  'Administrador',
  '',
  auth_user.email,
  'admin'::public.user_role,
  TRUE
FROM auth.users AS auth_user
WHERE lower(auth_user.email) = lower('matheus.marques@remateweb.com')
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.user_id = auth_user.id
  );

CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_protected_account
  ON public.profiles (is_protected)
  WHERE is_protected;

CREATE OR REPLACE FUNCTION public.guard_protected_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_protected THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Este administrador e uma conta protegida e nao pode ser excluido.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id
      OR lower(NEW.email) IS DISTINCT FROM lower(OLD.email)
      OR NEW.is_protected IS DISTINCT FROM TRUE THEN
      RAISE EXCEPTION 'A identidade do administrador principal e protegida.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.role IS DISTINCT FROM 'admin'::public.user_role THEN
      RAISE EXCEPTION 'O administrador principal deve permanecer com o nivel de acesso admin.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS guard_protected_profile_changes ON public.profiles;
CREATE TRIGGER guard_protected_profile_changes
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_protected_profile();

-- Profile creation/deletion is administrative and must stay behind server-side service-role code.
REVOKE INSERT, DELETE ON TABLE public.profiles FROM authenticated;

-- A browser session may edit ordinary profile fields, but never identity, protection, or role.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;

DO $$
DECLARE
  safe_columns TEXT;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
  INTO safe_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = ANY (ARRAY[
      'first_name', 'last_name', 'email', 'avatar_url', 'full_name', 'updated_at'
    ]);

  IF safe_columns IS NOT NULL THEN
    EXECUTE format(
      'GRANT UPDATE (%s) ON TABLE public.profiles TO authenticated',
      safe_columns
    );
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Profiles: users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

CREATE POLICY "Profiles: users can update safe fields on own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Apenas admins podem criar perfis" ON public.profiles;

CREATE POLICY "Profiles: users can insert own basic profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'solicitante'::public.user_role
    AND NOT is_protected
  );
