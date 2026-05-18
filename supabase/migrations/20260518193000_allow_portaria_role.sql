-- =====================================================================
-- ADICIONAR ROLE 'portaria' E 'fornecedor' AO CHECK CONSTRAINT DE PERFIS
-- =====================================================================
-- Remove a restrição antiga se ela existir (geralmente gerada como perfis_role_check)
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_role_check;

-- Adiciona a nova restrição incluindo o papel 'portaria' e 'fornecedor'
ALTER TABLE public.perfis ADD CONSTRAINT perfis_role_check 
  CHECK (role IN ('super_admin', 'sindico', 'subsindico', 'zelador', 'morador', 'clube_gestor', 'fornecedor', 'portaria'));
