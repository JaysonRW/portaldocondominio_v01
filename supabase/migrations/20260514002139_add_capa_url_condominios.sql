-- ============================================================
-- Migration: Add Capa URL to Condominios Table
-- ============================================================

ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS capa_url TEXT;
