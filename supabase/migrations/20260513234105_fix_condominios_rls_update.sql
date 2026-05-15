-- ============================================================
-- Migration: Add Update Policy for Condominios Table
-- ============================================================

-- Permite que o Síndico ou Master atualize os dados do seu próprio condomínio
DROP POLICY IF EXISTS "Sindico can update tenant condominios" ON public.condominios;
CREATE POLICY "Sindico can update tenant condominios"
ON public.condominios
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.is_sindico()
    AND id = public.jwt_condominio_id()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.is_sindico()
    AND id = public.jwt_condominio_id()
  )
);
