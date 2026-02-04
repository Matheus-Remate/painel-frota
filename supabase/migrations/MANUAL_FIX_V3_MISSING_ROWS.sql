-- =================================================================
-- SCRIPT DE CORREÇÃO FINAL (V3) - CRIAR PERFIS FALTANTES
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/nbddloeqadanxvzygpyt/sql
-- =================================================================

-- 1. INSERIR PERFIS PARA QUEM NÃO TEM (A Causa Principal do Erro)
-- Isso pega todo mundo do auth.users que não tem linha na tabela profiles e cria uma.
INSERT INTO public.profiles (id, user_id, email, first_name, last_name, role, full_name)
SELECT 
    au.id,
    au.id,
    au.email,
    -- Tenta extrair primeiro nome
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'first_name', ''), 
        SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Usuario'), ' ', 1)
    ),
    -- Tenta extrair sobrenome
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'last_name', ''),
        '' -- Sobrenome vazio por padrão
    ),
    -- Define role padrão
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'solicitante'),
    -- Define nome completo (fallback)
    COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Novo Usuario')
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
);

-- 2. GARANTIR QUE O TRIGGER ESTÁ FUNCIONANDO (Para novos logins)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. CONFIRMAÇÃO EXTRA (Rodar Updates de novo só para garantir consistência)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');
