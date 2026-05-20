-- ============================================================
-- Migration: Fix RLS Policies for clube_parceiros and promote Master
-- Objetivo: 
-- 1. Permitir que moradores leiam parceiros globais (condominio_id IS NULL).
-- 2. Garantir que super_admin possa visualizar e gerenciar parceiros de todos os condomínios.
-- 3. Promover o email do Master (propagoumkd@gmail.com) para super_admin na tabela perfis.
-- ============================================================

ALTER TABLE public.clube_parceiros ENABLE ROW LEVEL SECURITY;

-- 1. Recriar política de Leitura para moradores e síndicos (incluindo parceiros globais)
DROP POLICY IF EXISTS "Leitura parceiros tenant" ON public.clube_parceiros;
CREATE POLICY "Leitura parceiros tenant" ON public.clube_parceiros
FOR SELECT
USING (
  condominio_id = public.get_condominio_id() 
  OR condominio_id IS NULL
);

-- 2. Recriar política de Escrita e Acesso Total para super_admin
DROP POLICY IF EXISTS "Escrita parceiros admin" ON public.clube_parceiros;
CREATE POLICY "Escrita parceiros admin" ON public.clube_parceiros
FOR ALL
USING (
  public.get_user_role() = 'super_admin'
);

-- 3. Promover usuário propagoumkd@gmail.com a super_admin para garantir bypass do RLS
UPDATE public.perfis
SET role = 'super_admin'
WHERE email = 'propagoumkd@gmail.com';
