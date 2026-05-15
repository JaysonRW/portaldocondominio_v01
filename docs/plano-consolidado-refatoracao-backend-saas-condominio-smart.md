# Plano Consolidado de Refatoração Backend — SaaS Condomínio Smart

## Autenticação, Multi-Tenancy, RLS, Perfis e Integração com a Nova Estrutura de Pastas

Este documento consolida o plano de refatoração do projeto **SaaS Condomínio Smart**, considerando que a estrutura de frontend já foi reorganizada e aplicada no projeto.

O foco principal deste documento é orientar a IDE/IA de desenvolvimento a alterar o **backend Supabase**, incluindo:

- autenticação por e-mail e senha;
- perfis de usuário;
- multi-tenancy seguro;
- custom claims no JWT;
- políticas RLS;
- funções SQL;
- Edge Functions;
- estrutura de banco alinhada ao novo posicionamento do produto.

---

# 1. Contexto atualizado do produto

O **SaaS Condomínio Smart** não será um sistema completo de gestão condominial.

Ele será um:

> Portal informativo e comunicacional para condomínios.

O sistema deve centralizar:

- comunicados;
- avisos;
- chamadas para assembleias;
- eventos;
- galeria;
- clube de vantagens;
- FAQ;
- arquivos informativos simples;
- acesso ao aplicativo oficial do condomínio.

O sistema **não deve** assumir responsabilidades de:

- reservas de espaços internos;
- boletos;
- prestação de contas;
- documentos fiscais;
- documentos jurídicos sensíveis;
- gestão financeira;
- controle de inadimplência;
- substituição do aplicativo oficial do condomínio.

A mensagem estratégica do projeto é:

```txt
Este portal informa.
O aplicativo oficial opera.
```

---

# 2. Estrutura de rotas já aplicada no frontend

A estrutura de frontend já foi reorganizada. A IDE não deve desfazer essa estrutura.

A nova organização conceitual é:

```txt
/portal        → páginas públicas e institucionais do condomínio
/app           → área logada informativa do morador
/painel        → painel administrativo do condomínio
/master        → gateway ou acesso master
/painel-master → painel global do super_admin
```

## 2.1 Portal público

Rotas públicas esperadas:

```txt
/
/portal/comunicados
/portal/assembleias
/portal/avisos
/portal/eventos
/portal/galeria
/portal/clube
/portal/faq
/portal/app-oficial
/join
/login
/auth/callback
/reset-password
```

## 2.2 Área logada do morador

Rotas esperadas:

```txt
/app
/app/comunicados
/app/assembleias
/app/avisos
/app/eventos
/app/galeria
/app/clube
/app/faq
/app/arquivos
/app/app-oficial
/app/perfil
```

## 2.3 Painel administrativo do condomínio

Rotas esperadas:

```txt
/painel
/painel/comunicados
/painel/assembleias
/painel/avisos
/painel/eventos
/painel/galeria
/painel/clube
/painel/faq
/painel/arquivos
/painel/moradores
/painel/configuracoes
```

## 2.4 Painel master

Rotas esperadas:

```txt
/master
/painel-master
/painel-master/condominios
/painel-master/usuarios
/painel-master/planos
```

## 2.5 Regra importante

A IDE deve considerar que:

- o morador aprovado deve ser redirecionado para `/app`;
- o síndico deve ser redirecionado para `/painel`;
- o super_admin deve ser redirecionado para `/painel-master`;
- o fornecedor deve ser redirecionado futuramente para `/painel-fornecedor`;
- rotas públicas ficam em `/portal`;
- rotas administrativas ficam em `/painel`;
- rotas do morador ficam em `/app`.

---

# 3. Objetivo principal da refatoração

A refatoração deve transformar o backend em uma base segura, performática e escalável para multi-tenancy.

Objetivos técnicos:

```txt
Migrar autenticação de Magic Link para E-mail/Senha.
Consolidar os perfis oficiais do sistema.
Injetar role e condominio_id no JWT via Supabase Custom Access Token Hook.
Refatorar RLS para ler claims do JWT.
Reduzir consultas repetidas na tabela perfis.
Garantir isolamento entre tenants.
Preparar Edge Functions para criação/convite de usuários.
Alinhar banco ao novo escopo informativo do produto.
```

---

# 4. Perfis oficiais do sistema

O sistema terá 4 perfis principais:

```txt
super_admin
sindico
morador
fornecedor
```

## 4.1 super_admin

Perfil master, dono do SaaS.

Pode:

- acessar `/painel-master`;
- visualizar todos os condomínios;
- gerenciar tenants;
- gerenciar usuários globais;
- acessar dados de qualquer condomínio;
- operar em modo de gerenciamento de tenant.

## 4.2 sindico

Administrador do tenant/condomínio.

Pode:

- acessar `/painel`;
- gerenciar comunicados;
- gerenciar assembleias;
- gerenciar avisos;
- gerenciar eventos;
- gerenciar galeria;
- gerenciar clube de vantagens;
- gerenciar FAQ;
- gerenciar arquivos informativos;
- aprovar ou recusar moradores;
- editar configurações do condomínio.

## 4.3 morador

Usuário final do condomínio.

Pode:

- acessar `/app`;
- visualizar comunicados internos;
- visualizar assembleias;
- visualizar avisos;
- visualizar eventos;
- visualizar galeria conforme visibilidade;
- visualizar clube de vantagens;
- visualizar FAQ;
- visualizar arquivos informativos permitidos;
- acessar o card do aplicativo oficial.

Não pode:

- acessar `/painel`;
- criar conteúdo;
- alterar configurações;
- ver dados de outros condomínios.

## 4.4 fornecedor

Perfil futuro para parceiros comerciais.

Neste momento:

- deve existir na tipagem;
- pode ser armazenado em `perfis.role`;
- deve ser redirecionado para `/painel-fornecedor`;
- pode ter tela placeholder;
- ainda não precisa ter regras avançadas de negócio.

---

# 5. Nova regra de redirecionamento pós-login

A autenticação deve respeitar a nova estrutura.

Após login bem-sucedido:

```txt
super_admin       → /painel-master
sindico           → /painel
morador aprovado  → /app
morador pendente  → /aguardando-aprovacao
fornecedor        → /painel-fornecedor
sem perfil        → /onboarding ou fluxo de correção
```

Importante:

> Não redirecionar morador aprovado para `/`.  
> O destino correto do morador aprovado é `/app`.

---

# 6. Refatoração da autenticação

## 6.1 Remover dependência principal de Magic Link

O sistema deve migrar para autenticação por:

```txt
E-mail + Senha
```

Substituir:

```ts
supabase.auth.signInWithOtp()
```

por:

```ts
supabase.auth.signInWithPassword({
  email,
  password
})
```

## 6.2 Cadastro com senha

Fluxos que criam usuários devem usar:

```ts
supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role,
      condominio_id
    }
  }
})
```

## 6.3 Recuperação de senha

Implementar fluxo com:

```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${origin}/reset-password`
})
```

E na tela `/reset-password`:

```ts
supabase.auth.updateUser({
  password: newPassword
})
```

## 6.4 Primeiro acesso de convidado

Para usuário convidado por síndico/master, recomenda-se usar uma rota dedicada:

```txt
/set-password
```

Uso sugerido:

```txt
/reset-password → recuperação de senha de conta existente
/set-password   → definição da primeira senha após convite
```

Se quiser simplificar no MVP, `/reset-password` pode atender os dois casos, desde que a copy da tela seja genérica.

---

# 7. Estrutura recomendada da tabela perfis

A tabela `perfis` é a base de autorização do sistema.

## 7.1 Campos recomendados

```sql
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'sindico', 'morador', 'fornecedor')),
  nome TEXT,
  email TEXT,
  telefone TEXT,
  bloco TEXT,
  unidade TEXT,
  status_aprovacao BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);
```

## 7.2 Observações

- `super_admin` pode ter `condominio_id` nulo.
- `sindico`, `morador` e `fornecedor` devem ter `condominio_id`.
- `morador` só deve acessar `/app` se `status_aprovacao = true`.
- `ativo = false` deve bloquear acesso.

---

# 8. Custom Claims no Supabase JWT

## 8.1 Objetivo

Injetar diretamente no JWT:

```txt
role
condominio_id
status_aprovacao
ativo
```

Isso evita que as policies RLS precisem consultar repetidamente a tabela `perfis`.

## 8.2 Claims esperadas no JWT

Dentro de `app_metadata`:

```json
{
  "role": "sindico",
  "condominio_id": "uuid-do-condominio",
  "status_aprovacao": true,
  "ativo": true
}
```

## 8.3 Benefício

Permite policies como:

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = 'sindico'
```

e:

```sql
(auth.jwt() -> 'app_metadata' ->> 'condominio_id') = condominio_id::text
```

Atenção:

> Não comparar role com `"super_admin"` incluindo aspas extras.  
> O correto é comparar com `'super_admin'`.

Correto:

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
```

Incorreto:

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = '"super_admin"'
```

---

# 9. Migration 1 — Custom Access Token Hook

Criar arquivo:

```txt
supabase/migrations/001_custom_access_token_hook.sql
```

Conteúdo recomendado:

```sql
-- ============================================================
-- Migration: Custom Access Token Hook
-- Objetivo:
-- Injetar role, condominio_id, status_aprovacao e ativo no JWT.
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  perfil_record record;
BEGIN
  SELECT
    p.role,
    p.condominio_id,
    p.status_aprovacao,
    p.ativo
  INTO perfil_record
  FROM public.perfis p
  WHERE p.user_id = (event ->> 'user_id')::uuid
  LIMIT 1;

  claims := event -> 'claims';

  IF perfil_record IS NOT NULL THEN
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb(perfil_record.role),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,condominio_id}',
      to_jsonb(perfil_record.condominio_id::text),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,status_aprovacao}',
      to_jsonb(COALESCE(perfil_record.status_aprovacao, false)),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,ativo}',
      to_jsonb(COALESCE(perfil_record.ativo, false)),
      true
    );
  ELSE
    claims := jsonb_set(
      claims,
      '{app_metadata,role}',
      to_jsonb('morador'::text),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,status_aprovacao}',
      to_jsonb(false),
      true
    );

    claims := jsonb_set(
      claims,
      '{app_metadata,ativo}',
      to_jsonb(false),
      true
    );
  END IF;

  event := jsonb_set(event, '{claims}', claims, true);

  RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon;

-- IMPORTANTE:
-- Após executar esta migration, acessar o painel do Supabase:
-- Authentication > Hooks > Custom Access Token
-- Selecionar a função:
-- public.custom_access_token_hook
```

---

# 10. Migration 2 — Funções auxiliares para RLS

Criar arquivo:

```txt
supabase/migrations/002_auth_claim_helpers.sql
```

Conteúdo recomendado:

```sql
-- ============================================================
-- Migration: Auth Claim Helpers
-- Objetivo:
-- Criar funções auxiliares para policies RLS mais legíveis.
-- ============================================================

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$;

CREATE OR REPLACE FUNCTION public.jwt_condominio_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'condominio_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.jwt_status_aprovacao()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'status_aprovacao')::boolean, false);
$$;

CREATE OR REPLACE FUNCTION public.jwt_ativo()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'ativo')::boolean, false);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION public.is_sindico()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'sindico';
$$;

CREATE OR REPLACE FUNCTION public.is_morador_aprovado()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() = 'morador'
    AND public.jwt_status_aprovacao() = true
    AND public.jwt_ativo() = true;
$$;

CREATE OR REPLACE FUNCTION public.same_tenant(target_condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_condominio_id() = target_condominio_id;
$$;

GRANT EXECUTE ON FUNCTION public.jwt_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_condominio_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_status_aprovacao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.jwt_ativo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sindico() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_morador_aprovado() TO authenticated;
GRANT EXECUTE ON FUNCTION public.same_tenant(uuid) TO authenticated;
```

---

# 11. Migration 3 — Estrutura backend alinhada ao portal informativo

Criar arquivo:

```txt
supabase/migrations/003_portal_informativo_schema.sql
```

## 11.1 Condomínios

Adicionar campos para app oficial:

```sql
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS app_oficial_nome TEXT,
ADD COLUMN IF NOT EXISTS app_oficial_url TEXT,
ADD COLUMN IF NOT EXISTS app_oficial_descricao TEXT,
ADD COLUMN IF NOT EXISTS exibir_card_app_oficial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
```

## 11.2 Assembleias

```sql
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
```

## 11.3 Avisos e circulares

```sql
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
```

## 11.4 Arquivos informativos

Caso o projeto ainda use `documentos`, a recomendação é migrar o conceito para `arquivos_informativos`.

```sql
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
```

## 11.5 Controle de módulos

```sql
CREATE TABLE IF NOT EXISTS public.tenant_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (condominio_id, modulo)
);
```

Módulos possíveis:

```txt
comunicados
assembleias
avisos
eventos
galeria
clube
faq
arquivos
app_oficial
```

---

# 12. Migration 4 — RLS base para portal informativo

Criar arquivo:

```txt
supabase/migrations/004_rls_portal_informativo.sql
```

## 12.1 Regras gerais

As policies devem seguir esta lógica:

```txt
super_admin vê e altera tudo.
sindico altera dados do próprio condomínio.
morador aprovado vê dados do próprio condomínio com visibilidade permitida.
público anônimo vê apenas registros com visibilidade publico e status publicado.
fornecedor ainda sem acesso específico.
```

## 12.2 Exemplo para comunicados

```sql
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public comunicados" ON public.comunicados;
CREATE POLICY "Public can view public comunicados"
ON public.comunicados
FOR SELECT
TO anon
USING (
  visibilidade = 'publico'
  AND status = 'publicado'
);

DROP POLICY IF EXISTS "Authenticated users can view tenant comunicados" ON public.comunicados;
CREATE POLICY "Authenticated users can view tenant comunicados"
ON public.comunicados
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo()
    AND (
      visibilidade IN ('publico', 'moradores')
      OR public.jwt_role() = 'sindico'
    )
  )
);

DROP POLICY IF EXISTS "Sindico can manage tenant comunicados" ON public.comunicados;
CREATE POLICY "Sindico can manage tenant comunicados"
ON public.comunicados
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);
```

## 12.3 Repetir padrão para tabelas informativas

Aplicar padrão similar em:

```txt
assembleias
avisos_circulares
arquivos_informativos
eventos
galeria_albuns
galeria_fotos
clube_parceiros
faqs
```

## 12.4 Exemplo genérico para assembleias

```sql
ALTER TABLE public.assembleias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public assembleias"
ON public.assembleias
FOR SELECT
TO anon
USING (
  visibilidade = 'publico'
  AND status = 'publicado'
);

CREATE POLICY "Authenticated users can view tenant assembleias"
ON public.assembleias
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.same_tenant(condominio_id)
    AND public.jwt_ativo()
    AND (
      visibilidade IN ('publico', 'moradores')
      OR public.jwt_role() = 'sindico'
    )
  )
);

CREATE POLICY "Sindico can manage tenant assembleias"
ON public.assembleias
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);
```

---

# 13. RLS para perfis

## 13.1 Regras desejadas

```txt
super_admin vê todos.
sindico vê moradores do próprio condomínio.
morador vê apenas o próprio perfil.
morador pode atualizar dados básicos próprios, se permitido.
```

## 13.2 SQL recomendado

```sql
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.perfis;
CREATE POLICY "Users can view own profile"
ON public.perfis
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Sindico can view tenant profiles" ON public.perfis;
CREATE POLICY "Sindico can view tenant profiles"
ON public.perfis
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);

DROP POLICY IF EXISTS "Users can update own basic profile" ON public.perfis;
CREATE POLICY "Users can update own basic profile"
ON public.perfis
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Sindico can manage tenant moradores" ON public.perfis;
CREATE POLICY "Sindico can manage tenant moradores"
ON public.perfis
FOR ALL
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);
```

---

# 14. RLS para solicitações de adesão

## 14.1 Regras desejadas

```txt
anônimo pode criar solicitação de adesão.
sindico vê solicitações do próprio condomínio.
sindico aprova ou recusa solicitações do próprio condomínio.
super_admin vê tudo.
```

## 14.2 SQL recomendado

```sql
ALTER TABLE public.solicitacoes_adesao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create join request" ON public.solicitacoes_adesao;
CREATE POLICY "Anyone can create join request"
ON public.solicitacoes_adesao
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pendente'
);

DROP POLICY IF EXISTS "Sindico can view tenant join requests" ON public.solicitacoes_adesao;
CREATE POLICY "Sindico can view tenant join requests"
ON public.solicitacoes_adesao
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);

DROP POLICY IF EXISTS "Sindico can update tenant join requests" ON public.solicitacoes_adesao;
CREATE POLICY "Sindico can update tenant join requests"
ON public.solicitacoes_adesao
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'sindico'
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);
```

---

# 15. Trigger de criação de perfil

## 15.1 Objetivo

Quando um usuário for criado em `auth.users`, o sistema deve criar ou completar seu perfil em `public.perfis`.

## 15.2 Regras

A trigger deve tentar identificar:

```txt
role vindo de raw_user_meta_data
condominio_id vindo de raw_user_meta_data
solicitação de adesão pendente pelo e-mail
cadastro de síndico pelo fluxo de register
```

## 15.3 SQL recomendado

Criar arquivo:

```txt
supabase/migrations/005_profile_triggers.sql
```

Conteúdo:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requested_role text;
  requested_condominio_id uuid;
  join_request record;
BEGIN
  requested_role := COALESCE(
    NEW.raw_user_meta_data ->> 'role',
    'morador'
  );

  requested_condominio_id := NULLIF(
    NEW.raw_user_meta_data ->> 'condominio_id',
    ''
  )::uuid;

  SELECT *
  INTO join_request
  FROM public.solicitacoes_adesao s
  WHERE lower(s.email) = lower(NEW.email)
    AND s.status IN ('pendente', 'aprovado')
  ORDER BY s.criado_em DESC
  LIMIT 1;

  IF join_request IS NOT NULL THEN
    INSERT INTO public.perfis (
      user_id,
      condominio_id,
      role,
      nome,
      email,
      telefone,
      bloco,
      unidade,
      status_aprovacao,
      ativo
    )
    VALUES (
      NEW.id,
      join_request.condominio_id,
      'morador',
      join_request.nome,
      NEW.email,
      join_request.telefone,
      join_request.bloco,
      join_request.unidade,
      CASE WHEN join_request.status = 'aprovado' THEN true ELSE false END,
      true
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      condominio_id = EXCLUDED.condominio_id,
      role = EXCLUDED.role,
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      bloco = EXCLUDED.bloco,
      unidade = EXCLUDED.unidade,
      status_aprovacao = EXCLUDED.status_aprovacao,
      ativo = EXCLUDED.ativo,
      atualizado_em = now();

  ELSE
    INSERT INTO public.perfis (
      user_id,
      condominio_id,
      role,
      nome,
      email,
      status_aprovacao,
      ativo
    )
    VALUES (
      NEW.id,
      requested_condominio_id,
      requested_role,
      COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email),
      NEW.email,
      CASE WHEN requested_role IN ('sindico', 'super_admin', 'fornecedor') THEN true ELSE false END,
      true
    )
    ON CONFLICT (user_id)
    DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

---

# 16. Trigger de aprovação de solicitação

## 16.1 Objetivo

Quando uma solicitação for aprovada, sincronizar o perfil do morador, se o usuário já existir.

## 16.2 SQL recomendado

```sql
CREATE OR REPLACE FUNCTION public.handle_solicitacao_aprovada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT id
    INTO target_user_id
    FROM auth.users
    WHERE lower(email) = lower(NEW.email)
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
      INSERT INTO public.perfis (
        user_id,
        condominio_id,
        role,
        nome,
        email,
        telefone,
        bloco,
        unidade,
        status_aprovacao,
        ativo
      )
      VALUES (
        target_user_id,
        NEW.condominio_id,
        'morador',
        NEW.nome,
        NEW.email,
        NEW.telefone,
        NEW.bloco,
        NEW.unidade,
        true,
        true
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        condominio_id = EXCLUDED.condominio_id,
        role = 'morador',
        nome = EXCLUDED.nome,
        telefone = EXCLUDED.telefone,
        bloco = EXCLUDED.bloco,
        unidade = EXCLUDED.unidade,
        status_aprovacao = true,
        ativo = true,
        atualizado_em = now();
    END IF;

    NEW.aprovado_em := COALESCE(NEW.aprovado_em, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_solicitacoes_aprovacao ON public.solicitacoes_adesao;

CREATE TRIGGER tr_solicitacoes_aprovacao
BEFORE UPDATE ON public.solicitacoes_adesao
FOR EACH ROW
EXECUTE FUNCTION public.handle_solicitacao_aprovada();
```

---

# 17. Edge Function de convite de usuário

## 17.1 Renomeação recomendada

A função atual:

```txt
create-morador
```

pode continuar temporariamente, mas o nome mais correto seria:

```txt
invite-condominio-user
```

Motivo:

- pode convidar morador;
- pode convidar síndico;
- futuramente pode convidar fornecedor;
- não fica limitada ao papel de morador.

## 17.2 Objetivo da função

A função deve:

```txt
Receber email, nome, role e condominio_id.
Validar se o usuário autenticado pode convidar.
Usar service role com segurança.
Criar convite no Supabase Auth.
Criar ou atualizar perfil em public.perfis.
Marcar morador como aprovado, quando aplicável.
Retornar resultado claro para o frontend.
```

## 17.3 Importante sobre senha

Como o sistema agora usa e-mail/senha, o usuário convidado deve definir senha no primeiro acesso.

O template de e-mail de convite do Supabase deve redirecionar para:

```txt
/reset-password
```

ou, preferencialmente:

```txt
/set-password
```

Recomendação:

```txt
Criar /set-password para primeiro acesso.
Manter /reset-password para recuperação de senha.
```

## 17.4 Payload esperado

```json
{
  "email": "morador@email.com",
  "nome": "Nome do Morador",
  "role": "morador",
  "condominio_id": "uuid-do-condominio",
  "telefone": "41999999999",
  "bloco": "A",
  "unidade": "101"
}
```

## 17.5 Regras de autorização

```txt
super_admin pode convidar qualquer role.
sindico pode convidar moradores do próprio condomínio.
sindico não pode convidar super_admin.
morador não pode convidar usuários.
fornecedor não pode convidar usuários.
```

## 17.6 Observação para IDE

A função deve receber o JWT do usuário logado e validar a permissão usando os dados do próprio usuário chamador.

Não confiar apenas no payload enviado pelo frontend.

---

# 18. Prompt principal para IDE — Backend Supabase

Use este prompt como base para a IDE.

```text
@workspace
Atue como um Engenheiro de Software Sênior especialista em Supabase, PostgreSQL, RLS, Auth Hooks, Edge Functions e SaaS multi-tenant.

Contexto:
O projeto SaaS Condomínio Smart já teve a estrutura de frontend reorganizada em:
- /portal para páginas públicas
- /app para área logada do morador
- /painel para painel administrativo do condomínio
- /painel-master para painel global do super_admin

Não desfaça essa estrutura de rotas e pastas.
O foco agora é refatorar o backend Supabase.

O produto não será um sistema completo de gestão condominial.
Ele será um portal informativo e comunicacional para condomínios.

Não implementar backend para:
- reservas de espaços internos
- boletos
- prestação de contas
- documentos fiscais
- documentos jurídicos sensíveis
- financeiro
- inadimplência

Implementar ou ajustar backend para:
- comunicados
- assembleias
- avisos/circulares
- arquivos informativos simples
- eventos
- galeria
- clube de vantagens
- FAQ
- moradores
- solicitações de adesão
- configurações do condomínio
- card/link do aplicativo oficial

Perfis oficiais:
- super_admin
- sindico
- morador
- fornecedor

Regras de redirecionamento:
- super_admin → /painel-master
- sindico → /painel
- morador aprovado → /app
- morador pendente → /aguardando-aprovacao
- fornecedor → /painel-fornecedor

Tarefas:
1. Revisar o schema Supabase atual.
2. Criar migrations SQL organizadas para:
   - custom access token hook;
   - helpers de leitura do JWT;
   - ajustes na tabela perfis;
   - ajustes na tabela condominios;
   - criação/ajuste de assembleias;
   - criação/ajuste de avisos_circulares;
   - criação/ajuste de arquivos_informativos;
   - tabela tenant_modulos;
   - triggers de criação de perfil;
   - trigger de aprovação de solicitação.
3. Refatorar policies RLS para usar claims do JWT:
   - role
   - condominio_id
   - status_aprovacao
   - ativo
4. Garantir isolamento multi-tenant:
   - usuários só acessam dados do próprio condominio_id;
   - super_admin acessa tudo;
   - sindico gerencia apenas o próprio tenant;
   - morador aprovado apenas visualiza conteúdo permitido;
   - anônimo só vê conteúdos com visibilidade publico.
5. Ajustar Edge Function create-morador ou criar invite-condominio-user:
   - usar service role apenas no backend;
   - validar permissão do usuário chamador;
   - criar convite no Supabase Auth;
   - criar/upsert em perfis;
   - preparar fluxo para definição de senha no primeiro acesso.
6. Atualizar o frontend apenas quando necessário para integração com o backend:
   - signInWithPassword;
   - signUp com senha;
   - reset-password;
   - set-password, se criado;
   - callback pós-login respeitando as novas roles.

Cuidados:
- Não comparar role com aspas extras no JWT.
  Correto: (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
- Não usar get_condominio_id() nas novas policies, preferir claims do JWT.
- Não permitir que morador acesse /painel.
- Não redirecionar morador aprovado para /, e sim para /app.
- Não criar funcionalidades de reservas, boletos ou documentos sensíveis.
- Manter o produto como portal informativo.
```

---

# 19. Prompt específico — Auth frontend mínimo

Use apenas se a IDE precisar ajustar integração frontend.

```text
@workspace
Atue como especialista em React, Vite, TypeScript, Supabase Auth e React Router.

A estrutura de rotas já foi reorganizada em:
- /portal
- /app
- /painel
- /painel-master

Não desfaça essa estrutura.

Objetivo:
Migrar o login de Magic Link para E-mail/Senha e garantir redirecionamento correto por role.

Tarefas:
1. Em src/app/(auth)/login.tsx:
   - adicionar campo senha;
   - trocar signInWithOtp por signInWithPassword;
   - adicionar link "Esqueci minha senha";
   - chamar resetPasswordForEmail.

2. Criar ou ajustar:
   - /reset-password para recuperação de senha;
   - opcionalmente /set-password para primeiro acesso de convite.

3. Em register/join:
   - adicionar senha e confirmar senha quando o fluxo criar auth.users diretamente;
   - usar signUp com options.data contendo role e condominio_id quando aplicável.

4. Em callback:
   - ler sessão;
   - obter role preferencialmente do JWT app_metadata;
   - redirecionar:
     super_admin → /painel-master
     sindico → /painel
     morador aprovado → /app
     morador pendente → /aguardando-aprovacao
     fornecedor → /painel-fornecedor

5. Em ProtectedRoute:
   - bloquear morador em /painel;
   - bloquear não aprovado em /app;
   - permitir sindico em /painel;
   - permitir super_admin em /painel-master e /painel;
   - tratar fornecedor como placeholder.

Use Sonner para toasts de erro.
Mantenha o design system atual.
```

---

# 20. Prompt específico — Migrations SQL

```text
@workspace
Crie as migrations SQL do Supabase para o novo backend do SaaS Condomínio Smart.

Contexto:
O frontend já está organizado em /portal, /app, /painel e /painel-master.
O produto é um portal informativo para condomínios, não um sistema completo de gestão condominial.

Crie arquivos em supabase/migrations com nomes ordenados:

001_custom_access_token_hook.sql
002_auth_claim_helpers.sql
003_portal_informativo_schema.sql
004_rls_portal_informativo.sql
005_profile_triggers.sql

As migrations devem implementar:
- Custom Access Token Hook para injetar role, condominio_id, status_aprovacao e ativo no JWT.
- Funções auxiliares jwt_role(), jwt_condominio_id(), jwt_status_aprovacao(), jwt_ativo(), is_super_admin(), is_sindico(), is_morador_aprovado(), same_tenant().
- Ajustes em perfis.
- Ajustes em condominios para app oficial.
- Criação/ajuste de assembleias.
- Criação/ajuste de avisos_circulares.
- Criação/ajuste de arquivos_informativos.
- Criação de tenant_modulos.
- Policies RLS para leitura pública, leitura autenticada por tenant e gestão por síndico/super_admin.
- Triggers para criação de perfil ao criar auth.users.
- Trigger para sincronizar aprovação de solicitação de adesão.

Não criar tabelas de:
- reservas;
- boletos;
- financeiro;
- prestação de contas;
- documentos fiscais;
- inadimplência.

Garanta que as policies usem claims do JWT:
(auth.jwt() -> 'app_metadata' ->> 'role')
(auth.jwt() -> 'app_metadata' ->> 'condominio_id')

Não usar get_condominio_id() nas novas policies.
```

---

# 21. Prompt específico — Edge Function

```text
@workspace
Refatore a Edge Function supabase/functions/create-morador/index.ts ou crie uma nova função chamada supabase/functions/invite-condominio-user/index.ts.

Objetivo:
Adaptar o convite de usuários ao novo fluxo com E-mail/Senha e ao modelo multi-tenant seguro.

Contexto:
Roles oficiais:
- super_admin
- sindico
- morador
- fornecedor

Regras:
- super_admin pode convidar qualquer usuário.
- sindico pode convidar apenas moradores do próprio condominio_id.
- sindico não pode convidar super_admin.
- morador não pode convidar.
- fornecedor não pode convidar.

Tarefas:
1. Validar o JWT do usuário chamador.
2. Buscar o perfil do usuário chamador ou ler claims seguras.
3. Validar permissão antes de usar service role.
4. Chamar Supabase Admin API para convidar/criar usuário.
5. Incluir user_metadata com:
   - role
   - condominio_id
   - nome
6. Fazer upsert em public.perfis:
   - user_id
   - condominio_id
   - role
   - nome
   - email
   - telefone
   - bloco
   - unidade
   - status_aprovacao
   - ativo
7. Para morador convidado pelo síndico:
   - status_aprovacao = true
   - ativo = true
8. Adicionar comentários explicando que o template de invite do Supabase deve redirecionar para /set-password ou /reset-password.
9. Retornar respostas claras para o frontend.

Não confiar apenas no payload do frontend.
Não expor service role.
Não permitir convite cross-tenant por síndico.
```

---

# 22. Checklist final para validação

Após aplicar a refatoração, testar:

## 22.1 Auth

```txt
Login com e-mail/senha funciona.
Senha incorreta exibe toast.
E-mail inexistente exibe toast.
Esqueci minha senha envia e-mail.
Reset de senha funciona.
Convite de usuário permite definição de senha.
```

## 22.2 Redirecionamento

```txt
super_admin entra em /painel-master.
sindico entra em /painel.
morador aprovado entra em /app.
morador pendente entra em /aguardando-aprovacao.
fornecedor entra em /painel-fornecedor.
morador não acessa /painel.
usuário sem sessão é enviado para /login.
```

## 22.3 Multi-tenancy

```txt
Síndico do Condomínio A não vê dados do Condomínio B.
Morador do Condomínio A não vê dados do Condomínio B.
Conteúdo público aparece para anônimos.
Conteúdo moradores aparece apenas para autenticados do tenant.
Super admin vê todos os tenants.
```

## 22.4 RLS

```txt
Policies usam JWT claims.
Não dependem mais de get_condominio_id().
Role é comparada corretamente como 'super_admin', 'sindico', 'morador' ou 'fornecedor'.
Anon só acessa conteúdo público.
Morador só acessa conteúdo permitido.
Síndico só gerencia próprio condomínio.
```

## 22.5 Escopo do produto

```txt
Não existe fluxo novo de reservas internas.
Não existe backend para boletos.
Não existe backend financeiro.
Não existe upload incentivado de documentos sensíveis.
Existe card/link para aplicativo oficial.
Existe página /app/app-oficial.
Existe configuração do app oficial no tenant.
```

---

# 23. Resultado esperado

Ao final da refatoração, o projeto deve ter:

```txt
Autenticação por e-mail e senha.
Recuperação de senha.
Perfis oficiais consolidados.
JWT com claims de role e condominio_id.
RLS performática e segura.
Multi-tenancy isolado.
Área do morador em /app.
Painel administrativo em /painel.
Painel master em /painel-master.
Backend alinhado ao escopo informativo do produto.
Edge Function preparada para convites com definição de senha.
```

---

# 24. Diretriz principal para a IDE

A instrução mais importante é:

```txt
Não transformar o SaaS Condomínio Smart em um sistema completo de administração condominial.
O backend deve sustentar um portal informativo, seguro e multi-tenant.
Reservas, boletos, financeiro e documentos oficiais ficam fora do escopo e devem ser direcionados para o aplicativo oficial do condomínio.
```
