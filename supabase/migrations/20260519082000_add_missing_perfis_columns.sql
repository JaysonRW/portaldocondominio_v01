-- ============================================================
-- Migration: Add Missing Perfis Columns
-- Objetivo:
-- Adicionar as colunas 'email' e 'ativo' na tabela public.perfis.
-- Essas colunas são referenciadas no trigger 'handle_new_user',
-- na sincronização de aprovação de adesão, no token hook e nos
-- helpers do JWT, mas não constavam na definição física da tabela.
-- ============================================================

-- 1. Adiciona coluna email se não existir
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Adiciona coluna ativo se não existir
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. Atualiza perfis existentes para ativo = true
UPDATE public.perfis 
SET ativo = true 
WHERE ativo IS NULL;
