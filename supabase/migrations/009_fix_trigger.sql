-- Fix para o trigger handle_new_user
-- Execute este SQL no Supabase Dashboard SQL Editor

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recriar a função com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário'),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role, 
      'solicitante'::user_role
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a função tem permissões corretas
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verificar se o enum user_role existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'gestor', 'solicitante');
  END IF;
END$$;

-- Garantir que a tabela profiles permite insert pelo trigger
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política especial para o trigger SECURITY DEFINER
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON profiles;
CREATE POLICY "Allow trigger to create profiles"
  ON profiles FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Política para permitir usuários autenticados inserirem seu próprio perfil
DROP POLICY IF EXISTS "Apenas admins podem criar perfis" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
