-- Habilita extensão necessária para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 1. TABELA CONDOMÍNIOS (Tenant System)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS condominios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#3E594D',
  cor_secundaria VARCHAR(7) DEFAULT '#A3C168',
  plano VARCHAR(50) DEFAULT 'basico',
  endereco VARCHAR(255),
  descricao_curta TEXT,
  app_oficial_nome VARCHAR(100) DEFAULT 'App do Condomínio',
  app_oficial_url TEXT,
  whatsapp_contato VARCHAR(20),
  modulos_ativos JSONB DEFAULT '{"comunicados": true, "assembleias": true, "arquivos": true, "galeria": true, "clube": true, "faq": true}'::JSONB,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 2. TABELA PERFIS (Extensão do schema auth.users)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES condominios(id),
  role VARCHAR(50) NOT NULL DEFAULT 'morador' CHECK (role IN ('super_admin', 'sindico', 'subsindico', 'zelador', 'morador', 'clube_gestor')),
  nome VARCHAR(255) NOT NULL,
  unidade VARCHAR(50),
  bloco VARCHAR(50),
  numero_vaga VARCHAR(50),
  foto_url TEXT,
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  status_aprovacao BOOLEAN DEFAULT false,
  horario_trabalho VARCHAR(255),
  termos_aceitos_em TIMESTAMP WITH TIME ZONE, -- Registro LGPD
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 2.1 TABELA SOLICITACOES_ADESAO (Public Access)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitacoes_adesao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  telefone VARCHAR(20),           -- Celular/WhatsApp do morador
  bloco VARCHAR(50),
  unidade VARCHAR(50),
  numero_vaga VARCHAR(50),
  foto_url TEXT,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 3. TABELA COMUNICADOS (Feed / Mural)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS comunicados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  autor_id UUID NOT NULL REFERENCES perfis(id),
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  tag VARCHAR(50) DEFAULT 'Aviso Geral',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS publicar_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS link_documento TEXT;

-----------------------------------------------------------
-- FUNÇÕES / TRIGGERS BASE
-----------------------------------------------------------
-- CORREÇÃO: Funções não devem ser criadas no schema remoto "auth" pois ele é restrito. 
-- Devem ser criadas no "public". 

-- get_my_role: função auxiliar SECURITY DEFINER que lê diretamente sem RLS.
-- ESSENCIAL: evita recursão infinita quando get_user_role() é usada dentro
-- de policies da própria tabela 'perfis'.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS VARCHAR
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;

-- CORREÇÃO: Lê condominio_id diretamente da tabela perfis (não do JWT)
CREATE OR REPLACE FUNCTION public.get_condominio_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condominio_id FROM public.perfis WHERE id = auth.uid() LIMIT 1;
$$;

-- CORREÇÃO: Delega para get_my_role() para evitar recursão
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_my_role();
$$;

CREATE OR REPLACE FUNCTION public.sync_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_perfis_updated_at ON perfis;
CREATE TRIGGER tr_perfis_updated_at
BEFORE UPDATE ON perfis
FOR EACH ROW EXECUTE PROCEDURE public.sync_updated_at();

-- GATILHO: Criar Perfil automaticamente ao logar no Supabase (auth.users) pela primeira vez
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_solicitacao_aprovada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status <> 'aprovado' OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT id INTO target_user_id FROM auth.users WHERE email = NEW.email LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.perfis
  SET
    condominio_id = NEW.condominio_id,
    role = 'morador',
    status_aprovacao = true,
    nome = COALESCE(nome, NEW.nome),
    email = NEW.email,
    bloco = COALESCE(bloco, NEW.bloco),
    unidade = COALESCE(unidade, NEW.unidade),
    numero_vaga = COALESCE(numero_vaga, NEW.numero_vaga),
    foto_url = COALESCE(foto_url, NEW.foto_url),
    cpf = COALESCE(cpf, NEW.cpf),
    telefone = COALESCE(telefone, NEW.telefone)
  WHERE id = target_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_solicitacoes_aprovacao ON solicitacoes_adesao;
CREATE TRIGGER tr_solicitacoes_aprovacao
AFTER UPDATE ON solicitacoes_adesao
FOR EACH ROW EXECUTE PROCEDURE public.handle_solicitacao_aprovada();

-----------------------------------------------------------
-- SEGURANÇA (ROW LEVEL SECURITY - RLS)
-----------------------------------------------------------
-- Habilitar RLS em todas
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_adesao ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Solicitacoes: Público insere (Join), Master/Síndico vê/edita.
DROP POLICY IF EXISTS "Public insert join" ON solicitacoes_adesao;
DROP POLICY IF EXISTS "Read solicitudes admin" ON solicitacoes_adesao;
DROP POLICY IF EXISTS "Update solicitudes admin" ON solicitacoes_adesao;
CREATE POLICY "Public insert join" ON solicitacoes_adesao FOR INSERT WITH CHECK (true);
CREATE POLICY "Read solicitudes admin" ON solicitacoes_adesao FOR SELECT USING (
  (SELECT role FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  IN ('super_admin', 'sindico')
);
CREATE POLICY "Update solicitudes admin" ON solicitacoes_adesao FOR UPDATE USING (
  (SELECT role FROM public.perfis WHERE id = auth.uid() LIMIT 1)
  IN ('super_admin', 'sindico')
);

-- Condomínios: Leitura pública para acesso ao login.
DROP POLICY IF EXISTS "Leitura de condominios publica" ON condominios;
DROP POLICY IF EXISTS "Inserção anon para onboarding" ON condominios;
CREATE POLICY "Leitura de condominios publica" ON condominios FOR SELECT USING (true);
CREATE POLICY "Inserção anon para onboarding" ON condominios FOR INSERT WITH CHECK (true); 

-- Perfis: super_admin vê tudo. Outros veem o próprio tenant OU o próprio perfil.
-- CORREÇÃO v4: Usa get_my_role() com SECURITY DEFINER para evitar recursão infinita.
-- NUNCA fazer subquery direta em perfis dentro de policy de perfis!
DROP POLICY IF EXISTS "Perfis visiveis ao tenant" ON perfis;
DROP POLICY IF EXISTS "Edicao pelo proprio user" ON perfis;
DROP POLICY IF EXISTS "Insercao pelo proprio user" ON perfis;
CREATE POLICY "Perfis visiveis ao tenant" ON perfis FOR SELECT USING (
  public.get_my_role() = 'super_admin'        -- super_admin vê todos os perfis
  OR id = auth.uid()                           -- usuário sempre vê o próprio perfil
  OR condominio_id = public.get_condominio_id() -- moradores veem o mesmo tenant
);
CREATE POLICY "Edicao pelo proprio user" ON perfis FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Insercao pelo proprio user" ON perfis FOR INSERT WITH CHECK (id = auth.uid());

-- Comunicados: Todos do condomínio leem. Só Síndicos inserem.
DROP POLICY IF EXISTS "Leitura avisos tenant" ON comunicados;
DROP POLICY IF EXISTS "Escrita avisos sindico" ON comunicados;
CREATE POLICY "Leitura avisos tenant" ON comunicados FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita avisos sindico" ON comunicados FOR INSERT WITH CHECK (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'super_admin')
);

-----------------------------------------------------------
-- 6. TABELA CLUBES / PARCEIROS (Módulo de Vantagens)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS clube_parceiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  desconto_info VARCHAR(255) NOT NULL,
  logo_url TEXT,
  link_site TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 7. TABELA DOCUMENTOS (Registro / Atas)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  autor_id UUID NOT NULL REFERENCES perfis(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) DEFAULT 'Geral', -- Ex: Ata, Regimento, Balancete, Circular
  storage_path TEXT NOT NULL,          -- Caminho físico dentro do bucket do Supabase Storage
  tamanho_bytes BIGINT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- SEGURANÇA EXTRAS (RLS - Sprint 5)
-----------------------------------------------------------
ALTER TABLE clube_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Clube de Parceiros: Leitura Tenant e Edição exclusiva do SUPER ADMIN do Portal
DROP POLICY IF EXISTS "Leitura parceiros tenant" ON clube_parceiros;
DROP POLICY IF EXISTS "Escrita parceiros sindico" ON clube_parceiros;
DROP POLICY IF EXISTS "Escrita parceiros admin" ON clube_parceiros;
CREATE POLICY "Leitura parceiros tenant" ON clube_parceiros FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita parceiros admin" ON clube_parceiros FOR ALL USING (
  public.get_user_role() = 'super_admin'
);

-- Documentos: Leitura Tenant e Edição Síndico
DROP POLICY IF EXISTS "Leitura documentos tenant" ON documentos;
DROP POLICY IF EXISTS "Escrita documentos sindico" ON documentos;
CREATE POLICY "Leitura documentos tenant" ON documentos FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita documentos sindico" ON documentos FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico')
);

/*
INSTRUÇÃO EXTRA PARA O SUPABASE STORAGE (Para Rodar via Painel Web):
Para o módulo de Documentos funcionar, você precisará ir no Supabase em "Storage":
1. Clique em "New Bucket".
2. Nome: `documentos_condominio`
3. Marque "Public bucket" (para os links de PDF funcionarem na leitura)
4. Policies recomendadas do bucket (opcionais, ou faça manualmente via UI):
   Leitura pública: (bucket_id = 'documentos_condominio')
   Escrita (Insert): (auth.uid() IS NOT NULL) 
*/

-----------------------------------------------------------
-- 8. TABELA EVENTOS (Calendário Social)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  autor_id UUID NOT NULL REFERENCES perfis(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  horario_inicio TIME,
  local VARCHAR(255),
  imagem_capa_url TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- 9. TABELA GALERIA (Álbuns e Fotos)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS galeria_albuns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS galeria_fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES galeria_albuns(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  legenda TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- SEGURANÇA (RLS - Eventos & Galeria)
-----------------------------------------------------------
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_albuns ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_fotos ENABLE ROW LEVEL SECURITY;

-- Eventos: Leitura Tenant e Edição Síndico
DROP POLICY IF EXISTS "Leitura eventos tenant" ON eventos;
DROP POLICY IF EXISTS "Escrita eventos sindico" ON eventos;
CREATE POLICY "Leitura eventos tenant" ON eventos FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita eventos sindico" ON eventos FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico')
);

-- Galeria: Leitura Tenant e Edição Síndico
DROP POLICY IF EXISTS "Leitura galeria tenant" ON galeria_albuns;
DROP POLICY IF EXISTS "Escrita galeria sindico" ON galeria_albuns;
CREATE POLICY "Leitura galeria tenant" ON galeria_albuns FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita galeria sindico" ON galeria_albuns FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico')
);

DROP POLICY IF EXISTS "Leitura fotos tenant" ON galeria_fotos;
DROP POLICY IF EXISTS "Escrita fotos sindico" ON galeria_fotos;
CREATE POLICY "Leitura fotos tenant" ON galeria_fotos FOR SELECT USING (
  EXISTS (SELECT 1 FROM galeria_albuns WHERE id = album_id AND condominio_id = public.get_condominio_id())
);
CREATE POLICY "Escrita fotos sindico" ON galeria_fotos FOR ALL USING (
  EXISTS (SELECT 1 FROM galeria_albuns WHERE id = album_id AND condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico'))
);

-----------------------------------------------------------
-- STORAGE: Bucket de Fotos para Onboarding
-----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding_fotos', 'onboarding_fotos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload publico onboarding" ON storage.objects;
DROP POLICY IF EXISTS "Leitura publica onboarding" ON storage.objects;

CREATE POLICY "Upload publico onboarding"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'onboarding_fotos');

CREATE POLICY "Leitura publica onboarding"
ON storage.objects FOR SELECT
USING (bucket_id = 'onboarding_fotos');

-----------------------------------------------------------
-- 10. TABELA FAQ (Perguntas Frequentes)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria VARCHAR(100) DEFAULT 'Geral',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-----------------------------------------------------------
-- SEGURANÇA (RLS - FAQ)
-----------------------------------------------------------
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura faqs tenant" ON faqs;
DROP POLICY IF EXISTS "Escrita faqs sindico" ON faqs;

CREATE POLICY "Leitura faqs tenant" ON faqs FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita faqs sindico" ON faqs FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico', 'super_admin')
);

-----------------------------------------------------------
-- MIGRAÇÕES INCREMENTAIS (idempotentes)
-----------------------------------------------------------
ALTER TABLE solicitacoes_adesao ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE solicitacoes_adesao ALTER COLUMN cpf DROP NOT NULL;

-----------------------------------------------------------
-- 11. NOVAS COLUNAS E TABELAS (PROFISSIONAL SAAS)
-----------------------------------------------------------
-- Tabela de Assembleias (Chamadas Formais)
CREATE TABLE IF NOT EXISTS assembleias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  autor_id UUID NOT NULL REFERENCES perfis(id),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'Ordinária', -- Ordinária, Extraordinária, Especial
  status VARCHAR(50) DEFAULT 'Agendada', -- Agendada, Em Andamento, Finalizada, Cancelada
  data_assembleia DATE NOT NULL,
  horario_primeira_convocacao TIME NOT NULL,
  horario_segunda_convocacao TIME,
  local VARCHAR(255) DEFAULT 'Salão de Festas / Online',
  link_videochamada TEXT,
  pauta TEXT, -- Descrição detalhada da pauta
  ata_storage_path TEXT, -- Link para o PDF da ata após finalizada
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE assembleias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura assembleias tenant" ON assembleias;
DROP POLICY IF EXISTS "Escrita assembleias sindico" ON assembleias;
CREATE POLICY "Leitura assembleias tenant" ON assembleias FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita assembleias sindico" ON assembleias FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'subsindico')
);

-- Coluna de fixado para Comunicados
ALTER TABLE public.comunicados ADD COLUMN IF NOT EXISTS fixado BOOLEAN DEFAULT false;

-- Tabela de Categorias Customizadas
CREATE TABLE IF NOT EXISTS categorias_condominio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  modulo VARCHAR(50) NOT NULL, -- 'avisos', 'eventos', 'documentos', 'faq'
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) DEFAULT '#64748b',
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(condominio_id, modulo, nome)
);

ALTER TABLE categorias_condominio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura categorias tenant" ON categorias_condominio;
DROP POLICY IF EXISTS "Escrita categorias sindico" ON categorias_condominio;
CREATE POLICY "Leitura categorias tenant" ON categorias_condominio FOR SELECT USING (condominio_id = public.get_condominio_id());
CREATE POLICY "Escrita categorias sindico" ON categorias_condominio FOR ALL USING (
  condominio_id = public.get_condominio_id() AND public.get_user_role() IN ('sindico', 'super_admin')
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID NOT NULL REFERENCES condominios(id),
  usuario_id UUID REFERENCES perfis(id), -- NULL para notificações globais
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  link TEXT,
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura notificacoes usuario" ON notificacoes;
CREATE POLICY "Leitura notificacoes usuario" ON notificacoes FOR SELECT USING (
);

-----------------------------------------------------------
-- 12. TABELA UNIDADES (Estrutura do Condomínio)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.condominio_unidades (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id  uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  bloco          varchar,
  unidade        varchar NOT NULL,
  tipo           text DEFAULT 'residencial',
  ativo          boolean DEFAULT true,
  criado_em      timestamptz DEFAULT now(),
  CONSTRAINT uk_condominio_bloco_unidade UNIQUE (condominio_id, bloco, unidade)
);

ALTER TABLE public.condominio_unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de unidades do tenant" ON public.condominio_unidades
  FOR SELECT USING (
    condominio_id = public.get_condominio_id() OR true
  );

CREATE POLICY "Modificação de unidades por síndicos" ON public.condominio_unidades
  FOR ALL USING (
    condominio_id = public.get_condominio_id() 
    AND public.get_user_role() IN ('sindico', 'super_admin')
  );
