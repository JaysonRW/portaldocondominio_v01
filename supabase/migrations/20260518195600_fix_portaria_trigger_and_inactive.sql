-- =====================================================================
-- CORREÇÃO DO GATILHO DE NOVO USUÁRIO PARA PORTARIA E CONVITES
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  solicitacao RECORD;
BEGIN
  -- Busca a solicitação mais recente para este e-mail (aprovado ou pendente)
  SELECT * INTO solicitacao FROM public.solicitacoes_adesao 
  WHERE email = NEW.email
  ORDER BY criado_em DESC
  LIMIT 1;

  IF solicitacao.id IS NOT NULL THEN
    INSERT INTO public.perfis (id, condominio_id, role, nome, email, unidade, bloco, numero_vaga, foto_url, cpf, telefone, status_aprovacao)
    VALUES (
      NEW.id, 
      solicitacao.condominio_id,
      'morador', 
      solicitacao.nome,
      NEW.email,
      solicitacao.unidade,
      solicitacao.bloco,
      solicitacao.numero_vaga,
      solicitacao.foto_url,
      solicitacao.cpf,
      solicitacao.telefone,
      solicitacao.status = 'aprovado'
    );
  ELSE
    -- Para usuários convidados por e-mail (Síndicos, Zeladores, Portaria)
    INSERT INTO public.perfis (id, role, nome, email, condominio_id, status_aprovacao)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'role', 'morador'), 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'nome', NEW.email),
      NEW.email,
      (NEW.raw_user_meta_data->>'condominio_id')::UUID,
      CASE 
        WHEN NEW.raw_user_meta_data->>'role' IN ('portaria', 'zelador', 'sindico', 'subsindico') THEN true 
        ELSE false 
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
