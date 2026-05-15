-- ============================================================
-- Migration: RLS Portal Informativo
-- Objetivo:
-- Garantir isolamento multi-tenant e permissões baseadas em role.
-- ============================================================

-- 1. RLS para Perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.perfis;
CREATE POLICY "Users can view own profile"
ON public.perfis FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Sindico can view tenant profiles" ON public.perfis;
CREATE POLICY "Sindico can view tenant profiles"
ON public.perfis FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.perfis;
CREATE POLICY "Users can update own basic profile"
ON public.perfis FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Sindico can manage tenant moradores" ON public.perfis;
CREATE POLICY "Sindico can manage tenant moradores"
ON public.perfis FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

-- 6. RLS para FAQ
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view tenant faqs" ON public.faqs;
CREATE POLICY "Public can view tenant faqs"
ON public.faqs FOR SELECT TO anon, authenticated
USING (ativo = true);

DROP POLICY IF EXISTS "Sindico can manage faqs" ON public.faqs;
CREATE POLICY "Sindico can manage faqs"
ON public.faqs FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

-- 2. RLS para Solicitações de Adesão
ALTER TABLE public.solicitacoes_adesao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create join request" ON public.solicitacoes_adesao;
CREATE POLICY "Anyone can create join request"
ON public.solicitacoes_adesao FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pendente');

DROP POLICY IF EXISTS "Sindico can view tenant join requests" ON public.solicitacoes_adesao;
CREATE POLICY "Sindico can view tenant join requests"
ON public.solicitacoes_adesao FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

DROP POLICY IF EXISTS "Sindico can update tenant join requests" ON public.solicitacoes_adesao;
CREATE POLICY "Sindico can update tenant join requests"
ON public.solicitacoes_adesao FOR UPDATE TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

-- 3. RLS para Comunicados
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public comunicados" ON public.comunicados;
CREATE POLICY "Public can view public comunicados"
ON public.comunicados FOR SELECT TO anon, authenticated
USING (true); -- Ajustado: Na versão antiga não existe a coluna visibilidade

DROP POLICY IF EXISTS "Authenticated users can view tenant comunicados" ON public.comunicados;
CREATE POLICY "Authenticated users can view tenant comunicados"
ON public.comunicados FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);

DROP POLICY IF EXISTS "Sindico can manage tenant comunicados" ON public.comunicados;
CREATE POLICY "Sindico can manage tenant comunicados"
ON public.comunicados FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

-- 4. RLS para Assembleias
ALTER TABLE public.assembleias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public assembleias" ON public.assembleias;
CREATE POLICY "Public can view public assembleias"
ON public.assembleias FOR SELECT TO anon, authenticated
USING (visibilidade = 'publico' AND status = 'publicado');

DROP POLICY IF EXISTS "Authenticated users can view tenant assembleias" ON public.assembleias;
CREATE POLICY "Authenticated users can view tenant assembleias"
ON public.assembleias FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo()
    AND (visibilidade IN ('publico', 'moradores') OR public.is_sindico())
  )
);

DROP POLICY IF EXISTS "Sindico can manage tenant assembleias" ON public.assembleias;
CREATE POLICY "Sindico can manage tenant assembleias"
ON public.assembleias FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);

-- 5. RLS para Avisos e Circulares
ALTER TABLE public.avisos_circulares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant users can view avisos" ON public.avisos_circulares;
CREATE POLICY "Tenant users can view avisos"
ON public.avisos_circulares FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (public.same_tenant(condominio_id) AND public.jwt_ativo())
);

DROP POLICY IF EXISTS "Sindico can manage avisos" ON public.avisos_circulares;
CREATE POLICY "Sindico can manage avisos"
ON public.avisos_circulares FOR ALL TO authenticated
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);
