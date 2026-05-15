-- ============================================================
-- Migration: Fix Custom Access Token Hook
-- Objetivo:
-- Corrigir a consulta do perfil no hook do JWT. A tabela perfis
-- usa 'id' como chave primária vinculada ao auth.users.id, 
-- e não 'user_id'.
-- ============================================================

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
    p.ativo
  INTO perfil_record
  FROM public.perfis p
  WHERE p.id = (event ->> 'user_id')::uuid
  LIMIT 1;

  claims := event -> 'claims';

  IF perfil_record IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb(perfil_record.role),
      true
    );

    IF perfil_record.condominio_id IS NOT NULL THEN
      claims := jsonb_set(
        claims,
        '{app_metadata,condominio_id}',
        to_jsonb(perfil_record.condominio_id::text),
        true
      );
    END IF;

    claims := jsonb_set(
      claims,
      '{app_metadata,status_aprovacao}',
      to_jsonb(COALESCE(perfil_record.status_aprovacao, false)),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,ativo}',
      to_jsonb(COALESCE(perfil_record.ativo, false)),
      true
    );
  ELSE
    -- Fallback para novos usuários sem perfil ainda
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb('morador'::text),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,status_aprovacao}',
      to_jsonb(false),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,ativo}',
      to_jsonb(true),
      true
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;