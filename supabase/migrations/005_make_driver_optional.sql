-- Tornar driver_id opcional na tabela check_ins para evitar erro enquanto não temos auth completa
ALTER TABLE check_ins ALTER COLUMN driver_id DROP NOT NULL;
