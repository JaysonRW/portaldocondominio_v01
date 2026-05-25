-- ============================================================
-- Migration: FAQ Interactions (views + feedback)
-- Objetivo:
-- Registrar visualizações e feedback ("ajudou?") do FAQ para KPIs no painel do síndico.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.faq_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  faq_id UUID NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'feedback')),
  resolved BOOLEAN NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para filtros por tenant/período e por FAQ
CREATE INDEX IF NOT EXISTS faq_interactions_condominio_created_at_idx
  ON public.faq_interactions (condominio_id, created_at DESC);

CREATE INDEX IF NOT EXISTS faq_interactions_faq_created_at_idx
  ON public.faq_interactions (faq_id, created_at DESC);

-- RLS
ALTER TABLE public.faq_interactions ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado ativo do mesmo condomínio pode registrar interação
DROP POLICY IF EXISTS "Authenticated can insert faq interactions" ON public.faq_interactions;
CREATE POLICY "Authenticated can insert faq interactions"
ON public.faq_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo() = true
  )
);

-- Morador pode inserir apenas como ele mesmo (evita forjar user_id)
DROP POLICY IF EXISTS "Morador can only insert self interactions" ON public.faq_interactions;
CREATE POLICY "Morador can only insert self interactions"
ON public.faq_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() <> 'morador'
    OR user_id IS NULL
    OR user_id = auth.uid()
  )
);

-- Select somente para admin do tenant (síndico/subsíndico) ou super_admin
DROP POLICY IF EXISTS "Tenant admin can read faq interactions" ON public.faq_interactions;
CREATE POLICY "Tenant admin can read faq interactions"
ON public.faq_interactions
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo() = true
    AND public.jwt_role() IN ('sindico', 'subsindico')
  )
);

-- ============================================================
-- RPC: KPIs do FAQ (mês atual + top da semana)
-- Observação: SECURITY DEFINER para evitar múltiplas queries no client,
-- mas com checagem explícita de permissão dentro da função.
-- ============================================================

CREATE OR REPLACE FUNCTION public.faq_kpis(p_condominio_id uuid)
RETURNS TABLE (
  views_month bigint,
  feedback_total bigint,
  feedback_yes bigint,
  efficiency_pct numeric,
  top_categoria text,
  top_pergunta text,
  top_views_week bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.is_super_admin()
    OR (
      public.jwt_role() IN ('sindico', 'subsindico')
      AND public.jwt_ativo() = true
      AND public.same_tenant(p_condominio_id)
    )
  ) THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  RETURN QUERY
  WITH
    base AS (
      SELECT i.*
      FROM public.faq_interactions i
      WHERE i.condominio_id = p_condominio_id
    ),
    views_m AS (
      SELECT count(*)::bigint AS c
      FROM base
      WHERE event_type = 'view'
        AND created_at >= date_trunc('month', now())
    ),
    fb AS (
      SELECT
        count(*)::bigint AS total,
        sum(CASE WHEN resolved IS TRUE THEN 1 ELSE 0 END)::bigint AS yes
      FROM base
      WHERE event_type = 'feedback'
        AND created_at >= date_trunc('month', now())
        AND resolved IS NOT NULL
    ),
    top_week AS (
      SELECT
        f.categoria,
        f.pergunta,
        count(*)::bigint AS views
      FROM base b
      JOIN public.faqs f ON f.id = b.faq_id
      WHERE b.event_type = 'view'
        AND b.created_at >= now() - interval '7 days'
      GROUP BY f.categoria, f.pergunta
      ORDER BY views DESC
      LIMIT 1
    )
  SELECT
    (SELECT c FROM views_m) AS views_month,
    (SELECT total FROM fb) AS feedback_total,
    (SELECT yes FROM fb) AS feedback_yes,
    CASE
      WHEN (SELECT total FROM fb) = 0 THEN NULL
      ELSE round(100.0 * (SELECT yes FROM fb)::numeric / nullif((SELECT total FROM fb)::numeric, 0), 1)
    END AS efficiency_pct,
    (SELECT categoria FROM top_week) AS top_categoria,
    (SELECT pergunta FROM top_week) AS top_pergunta,
    COALESCE((SELECT views FROM top_week), 0) AS top_views_week;
END;
$$;

GRANT EXECUTE ON FUNCTION public.faq_kpis(uuid) TO authenticated;
