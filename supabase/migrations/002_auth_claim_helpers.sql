-- ============================================================
-- Migration: Auth Claim Helpers
-- Objetivo:
-- Criar funções auxiliares para policies RLS mais legíveis.
-- ============================================================

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  val text;
BEGIN
  -- 1. Tenta pegar do JWT
  val := auth.jwt() -> 'app_metadata' ->> 'role';
  IF val IS NOT NULL AND val <> '' THEN
    RETURN val;
  END IF;
  
  -- 2. Fallback: Consulta direta na tabela perfis
  SELECT role INTO val FROM public.perfis WHERE id = auth.uid() LIMIT 1;
  RETURN val;
END;
$$;

CREATE OR REPLACE FUNCTION public.jwt_condominio_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  val uuid;
  jwt_val text;
BEGIN
  -- 1. Tenta pegar do JWT
  jwt_val := auth.jwt() -> 'app_metadata' ->> 'condominio_id';
  IF jwt_val IS NOT NULL AND jwt_val <> '' THEN
    RETURN jwt_val::uuid;
  END IF;
  
  -- 2. Fallback: Consulta direta na tabela perfis
  SELECT condominio_id INTO val FROM public.perfis WHERE id = auth.uid() LIMIT 1;
  RETURN val;
END;
$$;

CREATE OR REPLACE FUNCTION public.jwt_status_aprovacao()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  val boolean;
  jwt_val text;
BEGIN
  -- 1. Tenta pegar do JWT
  jwt_val := auth.jwt() -> 'app_metadata' ->> 'status_aprovacao';
  IF jwt_val IS NOT NULL AND jwt_val <> '' THEN
    RETURN jwt_val::boolean;
  END IF;
  
  -- 2. Fallback: Consulta direta na tabela perfis
  SELECT status_aprovacao INTO val FROM public.perfis WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(val, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.jwt_ativo()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  val boolean;
  jwt_val text;
BEGIN
  -- 1. Tenta pegar do JWT
  jwt_val := auth.jwt() -> 'app_metadata' ->> 'ativo';
  IF jwt_val IS NOT NULL AND jwt_val <> '' THEN
    RETURN jwt_val::boolean;
  END IF;
  
  -- 2. Fallback: Consulta direta na tabela perfis
  SELECT ativo INTO val FROM public.perfis WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(val, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.jwt_role() = 'super_admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'propagoumkd@gmail.com';
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
