-- ============================================================
-- Migration: RLS Eventos
-- Objetivo: Adicionar políticas RLS à tabela eventos existente
-- ============================================================

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores caso existam
DROP POLICY IF EXISTS "Leitura eventos tenant" ON public.eventos;
DROP POLICY IF EXISTS "Escrita eventos sindico" ON public.eventos;
DROP POLICY IF EXISTS "Public can view tenant eventos" ON public.eventos;

-- Permite que qualquer pessoa (anon ou autenticada) veja os eventos na visão do morador
CREATE POLICY "Public can view tenant eventos"
ON public.eventos FOR SELECT TO anon, authenticated
USING (true);

-- Política para inserção/edição/deleção restrita ao Síndico e Admin
CREATE POLICY "Escrita eventos sindico" 
ON public.eventos FOR ALL TO authenticated 
USING (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
)
WITH CHECK (
  public.is_super_admin()
  OR (public.is_sindico() AND public.same_tenant(condominio_id) AND public.jwt_ativo())
);
