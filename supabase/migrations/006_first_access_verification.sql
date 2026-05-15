-- ============================================================
-- Migration: First Access Verification
-- Objetivo:
-- Adicionar controle de primeiro acesso para forçar definição de senha.
-- ============================================================

-- 1. Adicionar coluna na tabela perfis
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true;

-- 2. Atualizar a função custom_access_token_hook para injetar essa claim no JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  perfil_record record;
BEGIN
  SELECT
    p.role,
    p.condominio_id,
    p.status_aprovacao,
    p.ativo,
    p.primeiro_acesso
  INTO perfil_record
  FROM public.perfis p
  WHERE p.id = (event ->> 'user_id')::uuid
  LIMIT 1;

  claims := event -> 'claims';

  IF perfil_record IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(perfil_record.role), true);
    claims := jsonb_set(claims, '{app_metadata,condominio_id}', to_jsonb(perfil_record.condominio_id::text), true);
    claims := jsonb_set(claims, '{app_metadata,status_aprovacao}', to_jsonb(COALESCE(perfil_record.status_aprovacao, false)), true);
    claims := jsonb_set(claims, '{app_metadata,ativo}', to_jsonb(COALESCE(perfil_record.ativo, false)), true);
    claims := jsonb_set(claims, '{app_metadata,primeiro_acesso}', to_jsonb(COALESCE(perfil_record.primeiro_acesso, true)), true);
  ELSE
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb('morador'::text), true);
    claims := jsonb_set(claims, '{app_metadata,status_aprovacao}', to_jsonb(false), true);
    claims := jsonb_set(claims, '{app_metadata,ativo}', to_jsonb(false), true);
    claims := jsonb_set(claims, '{app_metadata,primeiro_acesso}', to_jsonb(true), true);
  END IF;

  event := jsonb_set(event, '{claims}', claims, true);
  RETURN event;
END;
$$;

-- 3. Função auxiliar para a policy
CREATE OR REPLACE FUNCTION public.jwt_primeiro_acesso()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'primeiro_acesso')::boolean, true);
$$;

GRANT EXECUTE ON FUNCTION public.jwt_primeiro_acesso() TO authenticated;
