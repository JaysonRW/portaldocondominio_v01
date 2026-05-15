-- ============================================================
-- Migration: Custom Access Token Hook
-- Objetivo:
-- Injetar role, condominio_id, status_aprovacao e ativo no JWT.
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
  WHERE p.user_id = (event ->> 'user_id')::uuid
  LIMIT 1;

  claims := event -> 'claims';

  IF perfil_record IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb(perfil_record.role),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,condominio_id}',
      to_jsonb(perfil_record.condominio_id::text),
      true
    );

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
      to_jsonb(false),
      true
    );
  END IF;

  event := jsonb_set(event, '{claims}', claims, true);

  RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;

-- IMPORTANTE:
-- Após executar esta migration, acessar o painel do Supabase:
-- Authentication > Hooks > Custom Access Token
-- Selecionar a função: public.custom_access_token_hook
