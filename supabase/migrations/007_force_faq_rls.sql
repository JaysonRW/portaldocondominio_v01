-- Script temporário para forçar RLS das FAQs

-- 1. Garante que a tabela existe (mesmo que a migração 003 não tenha criado)
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  categoria VARCHAR(100) DEFAULT 'Geral',
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Aplica as regras de segurança
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view tenant faqs" ON public.faqs;
CREATE POLICY "Public can view tenant faqs"
ON public.faqs FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Leitura faqs tenant" ON public.faqs;
DROP POLICY IF EXISTS "Escrita faqs sindico" ON public.faqs;

DROP POLICY IF EXISTS "Sindico can manage faqs" ON public.faqs;
CREATE POLICY "Sindico can manage faqs"
ON public.faqs FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (
    (public.is_sindico() OR public.jwt_role() = 'subsindico') 
    AND public.same_tenant(condominio_id) 
    AND public.jwt_ativo()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    (public.is_sindico() OR public.jwt_role() = 'subsindico') 
    AND public.same_tenant(condominio_id) 
    AND public.jwt_ativo()
  )
);
