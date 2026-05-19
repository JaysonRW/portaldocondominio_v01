-- ============================================================
-- Migration: Fix Custom Access Token Hook Security
-- Objetivo:
-- Adicionar 'security definer' e 'set search_path = public' 
-- na função custom_access_token_hook para permitir que a role
-- supabase_auth_admin a execute com sucesso sem violar RLS ou 
-- sofrer com falta de permissão de leitura na tabela public.perfis.
-- Além disso, reintegra a claim 'primeiro_acesso'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  claims jsonb;
  perfil_record record;
BEGIN
  -- Busca as informações do perfil associado ao usuário
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
    -- Injeta role
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb(perfil_record.role),
      true
    );

    -- Injeta condominio_id se existir
    IF perfil_record.condominio_id IS NOT NULL THEN
      claims := jsonb_set(
        claims,
        '{app_metadata,condominio_id}',
        to_jsonb(perfil_record.condominio_id::text),
        true
      );
    END IF;

    -- Injeta status_aprovacao
    claims := jsonb_set(
      claims,
      '{app_metadata,status_aprovacao}',
      to_jsonb(COALESCE(perfil_record.status_aprovacao, false)),
      true
    );

    -- Injeta ativo
    claims := jsonb_set(
      claims,
      '{app_metadata,ativo}',
      to_jsonb(COALESCE(perfil_record.ativo, false)),
      true
    );

    -- Injeta primeiro_acesso
    claims := jsonb_set(
      claims,
      '{app_metadata,primeiro_acesso}',
      to_jsonb(COALESCE(perfil_record.primeiro_acesso, true)),
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

    claims := jsonb_set(
      claims,
      '{app_metadata,primeiro_acesso}',
      to_jsonb(true),
      true
    );
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Garante as permissões de execução para o supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;
