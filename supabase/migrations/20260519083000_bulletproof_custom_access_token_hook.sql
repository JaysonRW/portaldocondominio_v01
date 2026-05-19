-- ============================================================
-- Migration: Bulletproof Custom Access Token Hook
-- Objetivo:
-- Tornar a função custom_access_token_hook extremamente robusta
-- contra valores NULL, caminhos de JSON ausentes e a checagem
-- insegura de "record IS NOT NULL" no Postgres.
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
  row_found boolean := false;
BEGIN
  -- 1. Busca as informações do perfil associado ao usuário
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

  row_found := FOUND;

  -- 2. Obtém as claims atuais do evento
  claims := event -> 'claims';

  -- 3. Garante que claims não seja nulo e que claims.app_metadata exista e seja um objeto
  IF claims IS NULL THEN
    claims := '{}'::jsonb;
  END IF;

  IF NOT (claims ? 'app_metadata') OR jsonb_typeof(claims -> 'app_metadata') <> 'object' THEN
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb, true);
  END IF;

  -- 4. Injeta as claims personalizadas baseadas no perfil ou valores padrão
  IF row_found THEN
    claims := jsonb_set(claims, '{app_metadata,role}', COALESCE(to_jsonb(perfil_record.role), 'null'::jsonb), true);
    claims := jsonb_set(claims, '{app_metadata,condominio_id}', COALESCE(to_jsonb(perfil_record.condominio_id), 'null'::jsonb), true);
    claims := jsonb_set(claims, '{app_metadata,status_aprovacao}', COALESCE(to_jsonb(perfil_record.status_aprovacao), 'false'::jsonb), true);
    claims := jsonb_set(claims, '{app_metadata,ativo}', COALESCE(to_jsonb(perfil_record.ativo), 'false'::jsonb), true);
    claims := jsonb_set(claims, '{app_metadata,primeiro_acesso}', COALESCE(to_jsonb(perfil_record.primeiro_acesso), 'true'::jsonb), true);
  ELSE
    -- Fallback para usuários recém-criados que ainda não têm perfil no banco
    claims := jsonb_set(claims, '{app_metadata,role}', '"morador"'::jsonb, true);
    claims := jsonb_set(claims, '{app_metadata,condominio_id}', 'null'::jsonb, true);
    claims := jsonb_set(claims, '{app_metadata,status_aprovacao}', 'false'::jsonb, true);
    claims := jsonb_set(claims, '{app_metadata,ativo}', 'true'::jsonb, true);
    claims := jsonb_set(claims, '{app_metadata,primeiro_acesso}', 'true'::jsonb, true);
  END IF;

  -- 5. Atualiza o objeto claims no evento original e retorna
  event := jsonb_set(event, '{claims}', claims, true);
  RETURN event;
END;
$$;

-- Garante que a role interna do Supabase Auth tenha permissão para executar
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
