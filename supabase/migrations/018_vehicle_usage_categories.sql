-- Migration 018: Vehicle Usage Categories
-- Purpose: Allow dynamic management of vehicle usage types

CREATE TABLE IF NOT EXISTS public.usage_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed with default categories
INSERT INTO public.usage_categories (name)
VALUES ('Uso Geral'), ('Marketing'), ('Fixo')
ON CONFLICT (name) DO NOTHING;
