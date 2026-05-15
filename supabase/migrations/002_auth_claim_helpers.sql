-- ============================================================
-- Migration: Auth Claim Helpers
-- Objetivo:
-- Criar funções auxiliares para policies RLS mais legíveis.
-- ============================================================

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION public.jwt_condominio_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'condominio_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.jwt_status_aprovacao()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'status_aprovacao')::boolean, false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'ativo')::boolean, false);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    public.jwt_role() = 'super_admin'
    OR auth.jwt() ->> 'email' = 'propagoumkd@gmail.com';
$$;

CREATE OR REPLACE FUNCTION public.is_sindico()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'sindico';
$$;

CREATE OR REPLACE FUNCTION public.is_morador_aprovado()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'morador'
    AND public.jwt_status_aprovacao() = true
    AND public.jwt_ativo() = true;
$$;

CREATE OR REPLACE FUNCTION public.same_tenant(target_condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_condominio_id() = target_condominio_id;
$$;

GRANT EXECUTE ON FUNCTION public.jwt_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_condominio_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_status_aprovacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sindico() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_morador_aprovado() TO authenticated;
GRANT EXECUTE ON FUNCTION public.same_tenant(uuid) TO authenticated;
