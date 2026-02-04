-- Adiciona coluna deleted_at para exclusão lógica (Soft Delete)
-- Execute este comando no Editor SQL do Supabase para corrigir o erro de exclusão

ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Opcional: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);
