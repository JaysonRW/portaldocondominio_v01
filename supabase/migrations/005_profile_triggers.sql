-- ============================================================
-- Migration: Profile Triggers
-- Objetivo:
-- Automatizar criação e sincronização de perfis.
-- ============================================================

-- 1. Função de Handlers de Novos Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requested_role text;
  requested_condominio_id uuid;
  join_request record;
BEGIN
  -- Tenta pegar do metadata enviado no SignUp
  requested_role := COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'morador'
  );

  requested_condominio_id := NULLIF(
    NEW.raw_user_meta_data ->> 'condominio_id',
    ''
  )::uuid;

  -- Busca se existe uma solicitação de adesão aprovada ou pendente para este email
  SELECT *
  INTO join_request
  FROM public.solicitacoes_adesao s
  WHERE lower(s.email) = lower(NEW.email)
    AND s.status IN ('pendente', 'aprovado')
  ORDER BY s.criado_em DESC
  LIMIT 1;

  IF join_request IS NOT NULL THEN
    -- Se tem solicitação, prioriza os dados dela
    INSERT INTO public.perfis (
      id,
      condominio_id,
      role,
      nome,
      email,
      telefone,
      bloco,
      unidade,
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
      join_request.telefone,
      join_request.bloco,
      join_request.unidade,
      CASE WHEN join_request.status = 'aprovado' THEN true ELSE false END,
      true,
      true -- Moradores que se auto-cadastram via convite pendente precisam setar senha se vierem de link mágico antigo, mas aqui estamos usando senha no cadastro.
    )
    ON CONFLICT (id)
    DO UPDATE SET
      condominio_id = EXCLUDED.condominio_id,
      role = EXCLUDED.role,
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      bloco = EXCLUDED.bloco,
      unidade = EXCLUDED.unidade,
      status_aprovacao = EXCLUDED.status_aprovacao,
      ativo = EXCLUDED.ativo,
      primeiro_acesso = EXCLUDED.primeiro_acesso,
      atualizado_em = now();

  ELSE
    -- Cadastro manual/convite
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
      requested_condominio_id,
      requested_role,
      COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
      NEW.email,
      CASE WHEN requested_role IN ('sindico', 'super_admin', 'fornecedor') THEN true ELSE false END,
      true,
      false -- Se chegou aqui via signUp com senha, não é primeiro acesso de definição
    )
    ON CONFLICT (id)
    DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 2. Função de Sincronização de Aprovação
CREATE OR REPLACE FUNCTION public.handle_solicitacao_aprovada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Busca o usuário pelo email
    SELECT id
    INTO target_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
      -- Atualiza ou Cria o perfil
      INSERT INTO public.perfis (
        id,
        condominio_id,
        role,
        nome,
        email,
        telefone,
        bloco,
        unidade,
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
        true,
        true
      )
      ON CONFLICT (id)
      DO UPDATE SET
        condominio_id = EXCLUDED.condominio_id,
        role = 'morador',
        nome = EXCLUDED.nome,
        telefone = EXCLUDED.telefone,
        bloco = EXCLUDED.bloco,
        unidade = EXCLUDED.unidade,
        status_aprovacao = true,
        ativo = true,
        atualizado_em = now();
    END IF;

    -- NEW.aprovado_em := COALESCE(NEW.aprovado_em, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para solicitações_adesao
DROP TRIGGER IF EXISTS tr_solicitacoes_aprovacao ON public.solicitacoes_adesao;
CREATE TRIGGER tr_solicitacoes_aprovacao
BEFORE UPDATE ON public.solicitacoes_adesao
FOR EACH ROW
EXECUTE FUNCTION public.handle_solicitacao_aprovada();
