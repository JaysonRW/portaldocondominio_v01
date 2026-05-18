-- ============================================================
-- Módulo: Ordens de Serviço / Serviços do Zelador
-- SaaS Condomínio Smart
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,

  categoria TEXT,
  prioridade TEXT DEFAULT 'media',

  local_descricao TEXT,

  status TEXT DEFAULT 'pendente',

  criado_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,

  data_agendada TIMESTAMPTZ,
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,

  tempo_estimado_minutos INTEGER,
  tempo_real_minutos INTEGER,

  custo_estimado NUMERIC(10,2),
  custo_real NUMERIC(10,2),

  observacoes_sindico TEXT,
  feedback_final TEXT,

  ativo BOOLEAN DEFAULT true,

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Histórico de atualizações
CREATE TABLE IF NOT EXISTS public.ordem_servico_atualizacoes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  autor_id UUID REFERENCES auth.users(id),

  tipo TEXT DEFAULT 'comentario',
  mensagem TEXT NOT NULL,

  status_anterior TEXT,
  status_novo TEXT,

  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Materiais usados
CREATE TABLE IF NOT EXISTS public.ordem_servico_materiais (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  nome_material VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) DEFAULT 1,
  unidade VARCHAR(50),
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  observacao TEXT,

  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Fotos opcionais
CREATE TABLE IF NOT EXISTS public.ordem_servico_fotos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  foto_url TEXT NOT NULL,
  storage_path TEXT,

  tipo TEXT DEFAULT 'execucao',

  enviado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 5. Constraints seguras com DO para evitar duplicidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordens_servico_status_check'
  ) THEN
    ALTER TABLE public.ordens_servico
    ADD CONSTRAINT ordens_servico_status_check
    CHECK (
      status IN ('rascunho', 'agendado', 'pendente', 'em_andamento', 'pausado', 'concluido', 'cancelado')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordens_servico_prioridade_check'
  ) THEN
    ALTER TABLE public.ordens_servico
    ADD CONSTRAINT ordens_servico_prioridade_check
    CHECK (
      prioridade IN ('baixa', 'media', 'alta', 'urgente')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_servico_atualizacoes_tipo_check'
  ) THEN
    ALTER TABLE public.ordem_servico_atualizacoes
    ADD CONSTRAINT ordem_servico_atualizacoes_tipo_check
    CHECK (
      tipo IN ('comentario', 'mudanca_status', 'material', 'pausa', 'conclusao', 'observacao')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_servico_fotos_tipo_check'
  ) THEN
    ALTER TABLE public.ordem_servico_fotos
    ADD CONSTRAINT ordem_servico_fotos_tipo_check
    CHECK (
      tipo IN ('antes', 'durante', 'depois', 'execucao')
    );
  END IF;
END $$;

-- 6. Trigger de atualização
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ordens_servico_updated_at
ON public.ordens_servico;

CREATE TRIGGER set_ordens_servico_updated_at
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_ordens_servico_condominio
ON public.ordens_servico (condominio_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_responsavel
ON public.ordens_servico (responsavel_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_status
ON public.ordens_servico (status);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_prioridade
ON public.ordens_servico (prioridade);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_categoria
ON public.ordens_servico (categoria);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_agendada
ON public.ordens_servico (data_agendada);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_atualizacoes_ordem
ON public.ordem_servico_atualizacoes (ordem_id);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_materiais_ordem
ON public.ordem_servico_materiais (ordem_id);

-- 8. RLS
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordem_servico_atualizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordem_servico_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordem_servico_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas para ordens_servico
DROP POLICY IF EXISTS "Sindico can manage tenant service orders" ON public.ordens_servico;
CREATE POLICY "Sindico can manage tenant service orders"
ON public.ordens_servico
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.is_sindico()
    AND public.same_tenant(condominio_id)
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.is_sindico()
    AND public.same_tenant(condominio_id)
  )
);

DROP POLICY IF EXISTS "Zelador can view assigned service orders" ON public.ordens_servico;
CREATE POLICY "Zelador can view assigned service orders"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    (SELECT role FROM public.perfis WHERE id = auth.uid()) = 'zelador'
    AND responsavel_id = auth.uid()
    AND public.same_tenant(condominio_id)
  )
);

DROP POLICY IF EXISTS "Zelador can update assigned service orders" ON public.ordens_servico;
CREATE POLICY "Zelador can update assigned service orders"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.perfis WHERE id = auth.uid()) = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
)
WITH CHECK (
  (SELECT role FROM public.perfis WHERE id = auth.uid()) = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
);

-- Políticas para ordem_servico_atualizacoes
DROP POLICY IF EXISTS "Manage updates for service orders" ON public.ordem_servico_atualizacoes;
DROP POLICY IF EXISTS "Allow update management for authorized users" ON public.ordem_servico_atualizacoes;
CREATE POLICY "Allow update management for authorized users"
ON public.ordem_servico_atualizacoes
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR public.same_tenant(condominio_id)
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.criado_por = auth.uid()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR public.same_tenant(condominio_id)
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.criado_por = auth.uid()
  )
);

-- Políticas para ordem_servico_materiais
DROP POLICY IF EXISTS "Manage materials for service orders" ON public.ordem_servico_materiais;
DROP POLICY IF EXISTS "Allow material management for authorized users" ON public.ordem_servico_materiais;
CREATE POLICY "Allow material management for authorized users"
ON public.ordem_servico_materiais
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() IN ('sindico', 'subsindico')
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() IN ('sindico', 'subsindico')
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
);

-- Políticas para ordem_servico_fotos
DROP POLICY IF EXISTS "Manage photos for service orders" ON public.ordem_servico_fotos;
DROP POLICY IF EXISTS "Allow photo management for authorized users" ON public.ordem_servico_fotos;
CREATE POLICY "Allow photo management for authorized users"
ON public.ordem_servico_fotos
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() IN ('sindico', 'subsindico')
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() IN ('sindico', 'subsindico')
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
  OR EXISTS (
    SELECT 1 FROM public.ordens_servico o
    WHERE o.id = ordem_id
      AND o.responsavel_id = auth.uid()
  )
);

-- 9. Atualizar roles
ALTER TABLE public.perfis
DROP CONSTRAINT IF EXISTS perfis_role_check;

ALTER TABLE public.perfis
ADD CONSTRAINT perfis_role_check
CHECK (
  role IN ('super_admin', 'sindico', 'subsindico', 'zelador', 'morador', 'clube_gestor')
);
