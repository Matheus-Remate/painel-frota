-- =================================================================
-- SCRIPT DE CORREÇÃO COMPLETA - EXECUTE NO SQL EDITOR DO SUPABASE
-- https://supabase.com/dashboard/project/nbddloeqadanxvzygpyt/sql
-- =================================================================

-- PARTE 1: CORRIGIR ESTRUTURA DO BANCO (Colunas faltando)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Preencher dados antigos
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

UPDATE public.profiles
SET 
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = NULLIF(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2), '')
WHERE first_name IS NULL AND full_name IS NOT NULL;

UPDATE public.profiles
SET last_name = ''
WHERE last_name IS NULL AND first_name IS NOT NULL;

-- PARTE 2: CORRIGIR FUNÇÃO TRIGGER (Para novos usuários)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'solicitante'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', (NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name')),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 3: BUSCA SEGURA (RPC)
-- Esta função garante que o site funcione mesmo se as regras de permissão falharem
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- PARTE 4: CORREÇÃO DE SEGURANÇA (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles são visíveis para usuários autenticados" ON profiles;

-- Regra simples e segura: Cada um vê o seu
CREATE POLICY "Simple owner access"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
