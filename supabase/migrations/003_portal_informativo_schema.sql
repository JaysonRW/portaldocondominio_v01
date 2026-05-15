-- ============================================================
-- Migration: Portal Informativo Schema
-- Objetivo:
-- Alinhar o banco de dados ao propósito informativo do produto.
-- ============================================================

-- 1. Ajustes em Condomínios
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS app_oficial_nome TEXT,
ADD COLUMN IF NOT EXISTS app_oficial_url TEXT,
ADD COLUMN IF NOT EXISTS app_oficial_descricao TEXT,
ADD COLUMN IF NOT EXISTS exibir_card_app_oficial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);

-- 2. Tabela de Assembleias (Refatorada/Criada)
CREATE TABLE IF NOT EXISTS public.assembleias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('ordinaria', 'extraordinaria')) DEFAULT 'ordinaria',
  descricao TEXT,
  data_assembleia DATE,
  horario TIME,
  local TEXT,
  link_externo TEXT,
  arquivo_url TEXT,
  storage_path TEXT,
  status TEXT CHECK (status IN ('rascunho', 'publicado', 'encerrado')) DEFAULT 'rascunho',
  destaque BOOLEAN DEFAULT false,
  visibilidade TEXT CHECK (visibilidade IN ('publico', 'moradores', 'administrativo')) DEFAULT 'moradores',
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Avisos e Circulares
CREATE TABLE IF NOT EXISTS public.avisos_circulares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  arquivo_url TEXT,
  storage_path TEXT,
  fixado BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('rascunho', 'publicado', 'arquivado')) DEFAULT 'publicado',
  visibilidade TEXT CHECK (visibilidade IN ('publico', 'moradores', 'administrativo')) DEFAULT 'moradores',
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Arquivos Informativos (Migração de documentos)
CREATE TABLE IF NOT EXISTS public.arquivos_informativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  arquivo_url TEXT,
  storage_path TEXT,
  status TEXT CHECK (status IN ('rascunho', 'publicado', 'arquivado')) DEFAULT 'publicado',
  visibilidade TEXT CHECK (visibilidade IN ('publico', 'moradores', 'administrativo')) DEFAULT 'moradores',
  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 5. Controle de Módulos (Tenants podem ativar/desativar seções)
CREATE TABLE IF NOT EXISTS public.tenant_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (condominio_id, modulo)
);

-- 6. Tabela FAQ (Perguntas Frequentes) - Garantir que existe
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria VARCHAR(100) DEFAULT 'Geral',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Inserir módulos padrão para todos os condomínios existentes
INSERT INTO public.tenant_modulos (condominio_id, modulo, ativo)
SELECT c.id, m.modulo, true
FROM public.condominios c
CROSS JOIN (
  SELECT unnest(ARRAY['comunicados', 'assembleias', 'avisos', 'eventos', 'galeria', 'clube', 'faq', 'arquivos', 'app_oficial']) as modulo
) m
ON CONFLICT (condominio_id, modulo) DO NOTHING;
