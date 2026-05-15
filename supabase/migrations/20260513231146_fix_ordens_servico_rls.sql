-- ============================================================
-- Migration: Fix Ordens Servico RLS para Zelador
-- ============================================================

-- 1. Corrige RLS de Visualização
DROP POLICY IF EXISTS "Zelador can view assigned service orders" ON public.ordens_servico;
CREATE POLICY "Zelador can view assigned service orders"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    -- Usa diretamente a função JWT otimizada
    public.jwt_role() = 'zelador'
    AND responsavel_id = auth.uid()
    AND public.same_tenant(condominio_id)
  )
);

-- 2. Corrige RLS de Atualização
DROP POLICY IF EXISTS "Zelador can update assigned service orders" ON public.ordens_servico;
CREATE POLICY "Zelador can update assigned service orders"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (
  public.jwt_role() = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
)
WITH CHECK (
  public.jwt_role() = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
);
