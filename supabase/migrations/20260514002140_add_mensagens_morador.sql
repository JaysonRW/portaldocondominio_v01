-- ============================================================
-- Criação da Tabela de Mensagens do Morador (Correção)
-- ============================================================

-- 1. Cria a função handle_updated_at caso não exista no banco
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.atualizado_em = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Cria a tabela
CREATE TABLE IF NOT EXISTS public.mensagens_morador (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
    morador_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    local_descricao VARCHAR(255),
    status VARCHAR(30) DEFAULT 'nova' CHECK (status IN ('nova', 'em análise', 'respondida', 'resolvida')),
    prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
    resposta_admin TEXT,
    respondido_por UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    respondido_em TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Cria o Trigger
DROP TRIGGER IF EXISTS handle_updated_at_mensagens_morador ON public.mensagens_morador;
CREATE TRIGGER handle_updated_at_mensagens_morador
    BEFORE UPDATE ON public.mensagens_morador
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. RLS e Políticas
ALTER TABLE public.mensagens_morador ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Moradores podem criar mensagens" ON public.mensagens_morador;
CREATE POLICY "Moradores podem criar mensagens" ON public.mensagens_morador
    FOR INSERT TO authenticated
    WITH CHECK (morador_id = auth.uid() AND public.same_tenant(condominio_id));

DROP POLICY IF EXISTS "Moradores podem ver suas próprias mensagens" ON public.mensagens_morador;
CREATE POLICY "Moradores podem ver suas próprias mensagens" ON public.mensagens_morador
    FOR SELECT TO authenticated
    USING (morador_id = auth.uid());

DROP POLICY IF EXISTS "Administração pode ver todas as mensagens" ON public.mensagens_morador;
CREATE POLICY "Administração pode ver todas as mensagens" ON public.mensagens_morador
    FOR SELECT TO authenticated
    USING (public.is_super_admin() OR (public.jwt_role() IN ('sindico', 'subsindico', 'zelador') AND public.same_tenant(condominio_id)));

DROP POLICY IF EXISTS "Administração pode atualizar mensagens" ON public.mensagens_morador;
CREATE POLICY "Administração pode atualizar mensagens" ON public.mensagens_morador
    FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR (public.jwt_role() IN ('sindico', 'subsindico') AND public.same_tenant(condominio_id)));
