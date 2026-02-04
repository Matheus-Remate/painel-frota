-- Correção da tabela vehicles para permitir valores nulos em campos opcionais
-- Execute no Supabase SQL Editor: https://supabase.com/dashboard/project/nbddloeqadanxvzygpyt/sql

-- Permitir null na coluna usage_category ou definir um valor padrão
ALTER TABLE vehicles 
ALTER COLUMN usage_category SET DEFAULT 'GENERAL';

-- Caso a coluna não permita null, alterar para permitir
ALTER TABLE vehicles 
ALTER COLUMN usage_category DROP NOT NULL;

-- Também garantir que capacity_pbt e capacity_vol aceitam null
ALTER TABLE vehicles 
ALTER COLUMN capacity_pbt DROP NOT NULL;

ALTER TABLE vehicles 
ALTER COLUMN capacity_vol DROP NOT NULL;

-- Atualizar registros existentes que tenham null para GENERAL
UPDATE vehicles 
SET usage_category = 'GENERAL' 
WHERE usage_category IS NULL;
