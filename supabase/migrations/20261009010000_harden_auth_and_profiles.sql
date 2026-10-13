-- ============================================================
-- Security baseline: auth, profiles and exposed legacy tables
-- ============================================================
-- This migration intentionally keeps the current resident join and
-- administrative invitation flows, while removing client-controlled
-- authorization data from the trust boundary.

BEGIN;

-- Authorization helpers must read the current database state. JWT claims
-- remain useful to the UI, but they can be stale until the token is refreshed.
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role::text
  FROM public.perfis AS p
  WHERE p.id = (SELECT auth.uid())
    AND COALESCE(p.ativo, false)
    AND COALESCE(p.status_aprovacao, false)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.jwt_condominio_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.condominio_id
  FROM public.perfis AS p
  WHERE p.id = (SELECT auth.uid())
    AND COALESCE(p.ativo, false)
    AND COALESCE(p.status_aprovacao, false)
  LIMIT 1;
$$;

-- Legacy policies still call these helpers. Keep them database-backed and make
-- them fail closed so pending or inactive profiles cannot inherit tenant access
-- through an older permissive policy.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS varchar
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role::varchar
  FROM public.perfis AS p
  WHERE p.id = (SELECT auth.uid())
    AND COALESCE(p.ativo, false)
    AND COALESCE(p.status_aprovacao, false)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_condominio_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.condominio_id
  FROM public.perfis AS p
  WHERE p.id = (SELECT auth.uid())
    AND COALESCE(p.ativo, false)
    AND COALESCE(p.status_aprovacao, false)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.jwt_status_aprovacao()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT p.status_aprovacao
    FROM public.perfis AS p
    WHERE p.id = (SELECT auth.uid())
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT p.ativo
    FROM public.perfis AS p
    WHERE p.id = (SELECT auth.uid())
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_primeiro_acesso()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT p.primeiro_acesso
    FROM public.perfis AS p
    WHERE p.id = (SELECT auth.uid())
    LIMIT 1
  ), true);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.jwt_role() = 'super_admin'
    AND public.jwt_ativo()
    AND public.jwt_status_aprovacao();
$$;

CREATE OR REPLACE FUNCTION public.is_sindico()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.jwt_role() = 'sindico'
    AND public.jwt_ativo()
    AND public.jwt_status_aprovacao();
$$;

CREATE OR REPLACE FUNCTION public.is_morador_aprovado()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.jwt_role() = 'morador'
    AND public.jwt_status_aprovacao()
    AND public.jwt_ativo();
$$;

CREATE OR REPLACE FUNCTION public.same_tenant(target_condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.jwt_condominio_id() IS NOT NULL
    AND public.jwt_condominio_id() = target_condominio_id;
$$;

-- CREATE OR REPLACE FUNCTION preserves the existing ACL. Earlier migrations
-- revoked anon/authenticated directly but left the default PUBLIC grant in
-- place, which still made this SECURITY DEFINER hook callable through RPC.
REVOKE ALL ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- A public Auth sign-up may control raw_user_meta_data. Never derive a role,
-- approval status or tenant membership from that payload. Administrative Edge
-- Functions use service_role and upsert the intended profile after Auth creates
-- the user, so invitations continue to work.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  join_request public.solicitacoes_adesao%ROWTYPE;
  display_name text;
  requires_password_setup boolean;
BEGIN
  SELECT s.*
  INTO join_request
  FROM public.solicitacoes_adesao AS s
  WHERE lower(s.email) = lower(NEW.email)
    AND s.status IN ('pendente', 'aprovado')
  ORDER BY s.criado_em DESC
  LIMIT 1;

  display_name := left(trim(COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'nome',
    NEW.email
  )), 255);
  requires_password_setup := NEW.invited_at IS NOT NULL;

  IF FOUND THEN
    INSERT INTO public.perfis (
      id,
      condominio_id,
      role,
      nome,
      email,
      unidade,
      bloco,
      numero_vaga,
      foto_url,
      cpf,
      telefone,
      status_aprovacao,
      ativo,
      primeiro_acesso
    )
    VALUES (
      NEW.id,
      join_request.condominio_id,
      'morador',
      join_request.nome,
      NEW.email,
      join_request.unidade,
      join_request.bloco,
      join_request.numero_vaga,
      join_request.foto_url,
      join_request.cpf,
      join_request.telefone,
      join_request.status = 'aprovado',
      true,
      requires_password_setup
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.perfis (
      id,
      condominio_id,
      role,
      nome,
      email,
      status_aprovacao,
      ativo,
      primeiro_acesso
    )
    VALUES (
      NEW.id,
      NULL,
      'morador',
      display_name,
      NEW.email,
      false,
      true,
      requires_password_setup
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin, service_role;

-- Approval can only promote a resident request. It must never demote or move an
-- existing administrative account that happens to use the same email address.
CREATE OR REPLACE FUNCTION public.handle_solicitacao_aprovada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
  existing_role text;
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT u.id
    INTO target_user_id
    FROM auth.users AS u
    WHERE lower(u.email) = lower(NEW.email)
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
      SELECT p.role::text
      INTO existing_role
      FROM public.perfis AS p
      WHERE p.id = target_user_id;

      IF existing_role IS NOT NULL AND existing_role <> 'morador' THEN
        RAISE EXCEPTION 'A solicitação pertence a uma conta administrativa existente.'
          USING ERRCODE = '42501';
      END IF;

      INSERT INTO public.perfis (
        id,
        condominio_id,
        role,
        nome,
        email,
        telefone,
        bloco,
        unidade,
        numero_vaga,
        foto_url,
        status_aprovacao,
        ativo
      )
      VALUES (
        target_user_id,
        NEW.condominio_id,
        'morador',
        NEW.nome,
        NEW.email,
        NEW.telefone,
        NEW.bloco,
        NEW.unidade,
        NEW.numero_vaga,
        NEW.foto_url,
        true,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        condominio_id = EXCLUDED.condominio_id,
        role = 'morador',
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        bloco = EXCLUDED.bloco,
        unidade = EXCLUDED.unidade,
        numero_vaga = EXCLUDED.numero_vaga,
        foto_url = EXCLUDED.foto_url,
        status_aprovacao = true,
        ativo = true,
        atualizado_em = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_solicitacao_aprovada() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_solicitacao_aprovada() TO service_role;

-- RLS controls rows, not columns. This trigger is the final guard against a
-- user changing role, tenant or approval fields through a crafted REST call.
CREATE OR REPLACE FUNCTION public.enforce_perfis_update_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_role text := COALESCE(auth.role(), '');
  caller_id uuid := auth.uid();
  caller_profile public.perfis%ROWTYPE;
BEGIN
  -- Database-internal operations and service-role Edge Functions remain the
  -- only trusted paths for unrestricted profile maintenance.
  IF request_role = 'service_role' OR request_role NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF request_role <> 'authenticated' OR caller_id IS NULL THEN
    RAISE EXCEPTION 'Perfil só pode ser alterado por um usuário autenticado.'
      USING ERRCODE = '42501';
  END IF;

  SELECT p.*
  INTO caller_profile
  FROM public.perfis AS p
  WHERE p.id = caller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do usuário autenticado não encontrado.'
      USING ERRCODE = '42501';
  END IF;

  IF caller_profile.role = 'super_admin'
     AND COALESCE(caller_profile.ativo, false)
     AND COALESCE(caller_profile.status_aprovacao, false) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
      RAISE EXCEPTION 'Identidade e data de criação do perfil são imutáveis.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF caller_id = OLD.id THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.condominio_id IS DISTINCT FROM OLD.condominio_id
       OR NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status_aprovacao IS DISTINCT FROM OLD.status_aprovacao
       OR NEW.ativo IS DISTINCT FROM OLD.ativo
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
      RAISE EXCEPTION 'Role, condomínio, aprovação, status e identidade não podem ser alterados pelo próprio usuário.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF caller_profile.role = 'sindico'
     AND COALESCE(caller_profile.ativo, false)
     AND COALESCE(caller_profile.status_aprovacao, false) THEN
    IF OLD.condominio_id IS DISTINCT FROM caller_profile.condominio_id
       OR NEW.condominio_id IS DISTINCT FROM caller_profile.condominio_id THEN
      RAISE EXCEPTION 'Síndico só pode alterar perfis do próprio condomínio.'
        USING ERRCODE = '42501';
    END IF;

    IF OLD.role IN ('super_admin', 'sindico')
       OR NEW.role NOT IN ('morador', 'subsindico', 'zelador', 'portaria', 'fornecedor', 'clube_gestor') THEN
      RAISE EXCEPTION 'Síndico não pode criar ou alterar contas de síndico ou master.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
      RAISE EXCEPTION 'Identidade e data de criação do perfil são imutáveis.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Usuário sem permissão para alterar este perfil.'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_perfis_update_security() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_perfis_update_security() TO service_role;

DROP TRIGGER IF EXISTS tr_perfis_security_guard ON public.perfis;
CREATE TRIGGER tr_perfis_security_guard
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION public.enforce_perfis_update_security();

-- Consolidate profile policies and remove permissive legacy policies that were
-- still active alongside the newer migration set.
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Edicao pelo proprio user" ON public.perfis;
DROP POLICY IF EXISTS "Insercao pelo proprio user" ON public.perfis;
DROP POLICY IF EXISTS "Master Full Access" ON public.perfis;
DROP POLICY IF EXISTS "Perfis visiveis ao tenant" ON public.perfis;
DROP POLICY IF EXISTS "Sindico can manage tenant moradores" ON public.perfis;
DROP POLICY IF EXISTS "Sindico can view tenant profiles" ON public.perfis;
DROP POLICY IF EXISTS "Users can update own basic profile" ON public.perfis;
DROP POLICY IF EXISTS "Users can view own profile" ON public.perfis;
DROP POLICY IF EXISTS "Super admin full access" ON public.perfis;
DROP POLICY IF EXISTS "Authenticated tenant profiles are visible" ON public.perfis;
DROP POLICY IF EXISTS "Authorized profiles are visible" ON public.perfis;
DROP POLICY IF EXISTS "Users can update own safe profile fields" ON public.perfis;
DROP POLICY IF EXISTS "Sindico can update tenant profiles" ON public.perfis;

CREATE POLICY "Super admin full access"
ON public.perfis
FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY "Authorized profiles are visible"
ON public.perfis
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_super_admin())
  OR (
    (SELECT public.jwt_role()) IN ('sindico', 'subsindico', 'zelador', 'portaria')
    AND
    condominio_id = (SELECT public.jwt_condominio_id())
  )
);

CREATE POLICY "Users can update own safe profile fields"
ON public.perfis
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Sindico can update tenant profiles"
ON public.perfis
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_sindico())
  AND condominio_id = (SELECT public.jwt_condominio_id())
)
WITH CHECK (
  (SELECT public.is_sindico())
  AND condominio_id = (SELECT public.jwt_condominio_id())
);

-- Profiles are created by the Auth trigger or service-role Edge Functions.
REVOKE INSERT, DELETE ON TABLE public.perfis FROM anon, authenticated;

-- Public self-service tenant creation is disabled. The master dashboard remains
-- able to create tenants through the authenticated super-admin policy.
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inserção anon para onboarding" ON public.condominios;
DROP POLICY IF EXISTS "Super admin all access" ON public.condominios;

CREATE POLICY "Super admin all access"
ON public.condominios
FOR ALL
TO authenticated
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

REVOKE INSERT, UPDATE, DELETE ON TABLE public.condominios FROM anon;

-- Keep public resident requests, but remove the legacy policy that accepted any
-- status and the public policies that exposed or updated all requests.
ALTER TABLE public.solicitacoes_adesao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert join" ON public.solicitacoes_adesao;
DROP POLICY IF EXISTS "Read solicitudes admin" ON public.solicitacoes_adesao;
DROP POLICY IF EXISTS "Update solicitudes admin" ON public.solicitacoes_adesao;
DROP POLICY IF EXISTS "Anyone can create join request" ON public.solicitacoes_adesao;
DROP POLICY IF EXISTS "Sindico can view tenant join requests" ON public.solicitacoes_adesao;
DROP POLICY IF EXISTS "Sindico can update tenant join requests" ON public.solicitacoes_adesao;

CREATE POLICY "Anyone can create pending join request"
ON public.solicitacoes_adesao
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pendente'
  AND EXISTS (
    SELECT 1
    FROM public.condominios AS c
    WHERE c.id = condominio_id
      AND COALESCE(c.ativo, false)
  )
);

CREATE POLICY "Tenant admins can view join requests"
ON public.solicitacoes_adesao
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_super_admin())
  OR (
    (SELECT public.is_sindico())
    AND condominio_id = (SELECT public.jwt_condominio_id())
  )
);

CREATE POLICY "Tenant admins can update join requests"
ON public.solicitacoes_adesao
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_super_admin())
  OR (
    (SELECT public.is_sindico())
    AND condominio_id = (SELECT public.jwt_condominio_id())
  )
)
WITH CHECK (
  (SELECT public.is_super_admin())
  OR (
    (SELECT public.is_sindico())
    AND condominio_id = (SELECT public.jwt_condominio_id())
  )
);

REVOKE SELECT, UPDATE, DELETE ON TABLE public.solicitacoes_adesao FROM anon;
GRANT INSERT ON TABLE public.solicitacoes_adesao TO anon;

-- These legacy public tables currently have no frontend consumers. Deny API
-- access until explicit tenant-aware policies are designed for them.
ALTER TABLE public.arquivos_informativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modulos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.arquivos_informativos FROM anon, authenticated;
REVOKE ALL ON TABLE public.tenant_modulos FROM anon, authenticated;

COMMIT;
