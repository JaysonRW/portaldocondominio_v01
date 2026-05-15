-- ============================================================
-- Migration: Add Missing Columns to Condominios Table
-- ============================================================

-- Adiciona a coluna whatsapp_contato caso não exista
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS whatsapp_contato VARCHAR(20);

-- Adiciona a coluna modulos_ativos caso não exista, com JSONB padrão
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS modulos_ativos JSONB DEFAULT '{"comunicados": true, "assembleias": true, "arquivos": true, "galeria": true, "clube": true, "faq": true}'::JSONB;
