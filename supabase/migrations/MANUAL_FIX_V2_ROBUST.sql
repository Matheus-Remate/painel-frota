-- =================================================================
-- SCRIPT CORRIGIDO (V2) - NÃO DEPENDE DA COLUNA 'full_name' 
-- =================================================================

-- 1. ADICIONAR COLUNAS (Se não existirem)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. VINCULAR ID DO USUÁRIO
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- 3. RECUPERAR DADOS DO LOGIN (Metadados do Google/Email)
-- Puxa o nome e email direto da tabela de usuários do Supabase, já que não tem 'full_name' na tabela profiles
UPDATE public.profiles p
SET 
  email = u.email,
  first_name = COALESCE(
    p.first_name,
    NULLIF(u.raw_user_meta_data->>'first_name', ''), 
    SPLIT_PART(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Usuario'), ' ', 1)
  ),
  last_name = COALESCE(
    p.last_name,
    NULLIF(u.raw_user_meta_data->>'last_name', ''),
    'Sobrenome' -- Fallback caso não tenha sobrenome
  )
FROM auth.users u
WHERE p.user_id = u.id;

-- 4. CRIAR A FUNÇÃO MÁGICA (RPC) QUE O SITE USA
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.profiles WHERE user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 5. CORRIGIR SEGURANÇA (Para ninguém ver dados de ninguém)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles são visíveis para usuários autenticados" ON profiles;
DROP POLICY IF EXISTS "Simple owner access" ON profiles;

CREATE POLICY "Simple owner access"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
