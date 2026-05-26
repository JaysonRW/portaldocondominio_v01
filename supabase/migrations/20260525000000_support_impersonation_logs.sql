-- ============================================================
-- Migration: Support impersonation logs
-- Objetivo:
-- Registrar auditoria de acessos de suporte (MASTER) ao painel de condomínios via link mágico.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_impersonation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  master_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  target_role TEXT NULL,
  redirect_to TEXT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error TEXT NULL
);

CREATE INDEX IF NOT EXISTS support_impersonation_logs_created_at_idx
  ON public.support_impersonation_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS support_impersonation_logs_condominio_created_at_idx
  ON public.support_impersonation_logs (condominio_id, created_at DESC);

ALTER TABLE public.support_impersonation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Master can read support impersonation logs" ON public.support_impersonation_logs;
CREATE POLICY "Master can read support impersonation logs"
ON public.support_impersonation_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin());

