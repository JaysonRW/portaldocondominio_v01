# AI Context — SaaS Condomínio Smart

Este documento descreve o projeto de ponta a ponta (stack, arquitetura, telas, rotas, backend/Supabase e banco) para consulta rápida e para que um agente de IA consiga entender o sistema com alto contexto.

## Visão Geral

**Produto:** SaaS multi-tenant para condomínios, com:
- **Portal público do condomínio** (conteúdo e serviços para moradores)
- **Painel administrativo** (síndico/subsíndico) para gestão de conteúdo e módulos
- **Área do zelador** (ordens de serviço atribuídas)
- **Modo master** (super admin) para operar múltiplos condomínios

**Multi-tenant:** um condomínio (tenant) é identificado por `slug`:
- **Produção com domínio próprio:** via **subdomínio** `slug.seudominio.com`
- **Ambiente de hospedagem (ex.: Vercel):** via **path** `/<slug>/...`
- **Localhost:** via **path** `/<slug>/...`

**Ponto central de resolução do tenant:** `src/app/layout.tsx` (AppShellManager).

## Stack e Ferramentas

- **Frontend:** React 19 + React Router v7 (framework) + Vite
- **Estilo/UI:** Tailwind CSS v4 + componentes UI em `src/components/ui/*` (Radix quando necessário)
- **State:** Zustand (`src/stores/*`)
- **Data Fetching:** TanStack Query v5
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Deploy:** Vercel (SPA estática via `ssr:false`)

Arquivos-chave:
- Rotas: `src/app/routes.ts`
- Layout/tenant/auth shell: `src/app/layout.tsx`
- Guards de acesso: `src/components/layout/ProtectedRoute.tsx`
- Config RR/Vercel: `react-router.config.ts`, `vercel.json`, `package.json`
- Supabase client: `src/lib/supabase.ts`
- Migrations/schema: `supabase/migrations/*`, `supabase/schema_completo.sql`
- Edge Functions: `supabase/functions/*`

## Estrutura de Pastas (Mapa Rápido)

- `src/app/*`
  - `(public)/*`: portal público / landing
  - `(auth)/*`: login, callback, reset/set password
  - `(dashboard)/*`: painel admin (síndico/subsíndico/master)
  - `(zelador)/*`: área do zelador
  - `layout.tsx`: resolve tenant e sessão; injeta tema/tenant
  - `root.tsx`: HTML shell, ErrorBoundary
  - `routes.ts`: configuração de rotas
- `src/components/layout/*`: layouts e navegação
- `src/stores/*`: stores (auth/tenant)
- `src/lib/*`: supabase client, utils, queryClient
- `supabase/*`
  - `migrations/*`: criação/alteração de tabelas, triggers, RLS
  - `functions/*`: Edge Functions (convites/criação de usuários)
  - `schema*.sql`: dumps/resumos do schema

## Modelos de Usuário e Permissões (Alto Nível)

**Roles observadas no app:**
- `super_admin` (master)
- `sindico`
- `subsindico`
- `zelador`
- `morador`
- `fornecedor` (existem redirecionamentos/placeholder)

**Guard principal:** `ProtectedRoute`:
- Não autenticado → redireciona para `/login` (com prefixo de tenant quando aplicável). Agora protege TODAS as rotas do portal (`/portal/*`).
- Primeiro acesso (`primeiro_acesso`) → força `set-password`
- Morador não entra em `/painel*` → vai para `/portal/comunicados`
- Síndico/subsíndico/zelador entram no painel; master entra em `/painel-master`

## Resolução do Tenant (Slug) — Regras

Local: `src/app/layout.tsx` (dentro do `AppShellManager`).

### Entrada (hostname/path)

O `slug` pode ser lido de:
- **Host:** `slugFromHost` quando o hostname é um domínio real com subdomínio de tenant
- **Path:** `slugFromPath` quando estamos em localhost ou domínio de hospedagem (ex.: `*.vercel.app`)

### Domínios de hospedagem (previews/staging)

No Vercel, o hostname é do tipo `projeto.vercel.app` e **não** deve ser interpretado como tenant.
Por isso existe a lista `hostingDomains = ['vercel.app', 'netlify.app', 'pages.dev']` e `isHostingDomain`.

### Rotas com tenant no path (mais comuns em Vercel/localhost)

O algoritmo de `slugFromPath` é orientado por padrões reais de rota:
- `/<slug>` → landing do condomínio
- `/<slug>/portal/<pagina>` → páginas do portal público (comunicados, clube, guia, eventos, galeria, arquivos, faq)
- `/<slug>/<segmento>` onde `<segmento>` é um “segmento do tenant” conhecido (ex.: `login`, `painel`, `onboarding`, etc.)

## Rotas (Mapa Completo)

As rotas são definidas em `src/app/routes.ts`. Há versões **com tenant** (`:tenantSlug/...`) e versões **sem tenant** (para domínio customizado onde o tenant vem do host).

### 1) Auth (globais)

- `/login` → `src/app/(auth)/login.tsx`
- `/auth/callback` → `src/app/(auth)/callback.tsx`
- `/reset-password` → `src/app/(auth)/reset-password.tsx`
- `/set-password` → `src/app/(auth)/reset-password.tsx`
- `/master` → `src/app/(auth)/master-gateway.tsx`

### 1.1) Auth (com tenant no path)

- `/:tenantSlug/login` → `src/app/(auth)/login.tsx`
- `/:tenantSlug/auth/callback` → `src/app/(auth)/callback.tsx`
- `/:tenantSlug/reset-password` → `src/app/(auth)/reset-password.tsx`
- `/:tenantSlug/set-password` → `src/app/(auth)/reset-password.tsx`

### 2) Painel Admin (protegido)

Layout: `ProtectedRoute` → `DashboardLayout`

**Com tenant no path:**
- `/:tenantSlug/painel` → Home do painel (`src/app/(dashboard)/home.tsx`)
- `/:tenantSlug/painel/configuracoes` → Configurações (`src/app/(dashboard)/configuracoes/index.tsx`)
- `/:tenantSlug/painel/comunicados` → Comunicados (admin) (`src/app/(dashboard)/avisos/index.tsx`)
- `/:tenantSlug/painel/assembleias` → Assembleias (`src/app/(dashboard)/assembleias/index.tsx`)
- `/:tenantSlug/painel/eventos` → Eventos (`src/app/(dashboard)/eventos/index.tsx`)
- `/:tenantSlug/painel/galeria` → Galeria (`src/app/(dashboard)/galeria/index.tsx`)
- `/:tenantSlug/painel/arquivos` → Documentos/Arquivos (`src/app/(dashboard)/documentos/index.tsx`)
- `/:tenantSlug/painel/faq` → FAQ (admin) (`src/app/(dashboard)/faq/index.tsx`)
- `/:tenantSlug/painel/clube` → Clube (admin) (`src/app/(dashboard)/clube/index.tsx`)
- `/:tenantSlug/painel/guia` → Guia do morador (admin) (`src/app/(dashboard)/guia-morador/index.tsx`)
- `/:tenantSlug/painel/moradores` → Moradores (admin) (`src/app/(dashboard)/moradores/index.tsx`)
- `/:tenantSlug/painel/zeladores` → Zeladores (admin) (`src/app/(dashboard)/zeladores/index.tsx`)
- `/:tenantSlug/painel/canal-morador` → Canal do morador (admin) (`src/app/(dashboard)/canal-morador/index.tsx`)
- `/:tenantSlug/painel/servicos` → Ordens de serviço (admin) (`src/app/(dashboard)/servicos/index.tsx`)
- `/:tenantSlug/painel/servicos/nova` → Nova OS (`src/app/(dashboard)/servicos/nova.tsx`)
- `/:tenantSlug/painel/servicos/agenda` → Agenda de OS (`src/app/(dashboard)/servicos/agenda.tsx`)
- `/:tenantSlug/painel/servicos/relatorios` → Relatórios de OS (`src/app/(dashboard)/servicos/relatorios.tsx`)
- `/:tenantSlug/painel/servicos/:id` → Detalhe da OS (`src/app/(dashboard)/servicos/[id].tsx`)

**Sem tenant no path (tenant via host):**
- `/painel/*` → mesmas telas acima, sem prefixo `/:tenantSlug`

**Master:**
- `/painel-master` → `src/app/(dashboard)/master-dashboard.tsx`

### 2.1) Onboarding

- `/:tenantSlug/onboarding` → `src/app/(dashboard)/onboarding/index.tsx`
- `/onboarding` → `src/app/(dashboard)/onboarding/index.tsx`

### 3) Portal (Área Protegida do Morador)

*Nota: Todas as rotas do portal agora exigem autenticação e estão dentro do `ProtectedRoute`.*

**Com tenant no path:**
- `/:tenantSlug/portal/comunicados` → `src/app/(public)/comunicados.tsx`
- `/:tenantSlug/portal/clube` → `src/app/(public)/clube.tsx`
- `/:tenantSlug/portal/guia` → `src/app/(public)/guia.tsx`
- `/:tenantSlug/portal/eventos` → `src/app/(public)/eventos.tsx`
- `/:tenantSlug/portal/galeria` → `src/app/(public)/galeria.tsx`
- `/:tenantSlug/portal/arquivos` → `src/app/(public)/documentos.tsx`
- `/:tenantSlug/portal/faq` → `src/app/(public)/faq.tsx`

**Sem tenant no path (tenant via host):**
- `/portal/comunicados` → `src/app/(public)/comunicados.tsx`
- `/portal/clube` → `src/app/(public)/clube.tsx`
- `/portal/guia` → `src/app/(public)/guia.tsx`
- `/portal/eventos` → `src/app/(public)/eventos.tsx`
- `/portal/galeria` → `src/app/(public)/galeria.tsx`
- `/portal/arquivos` → `src/app/(public)/documentos.tsx`
- `/portal/faq` → `src/app/(public)/faq.tsx`

### 4) Landing / Cadastro

- `/:tenantSlug` → Landing do condomínio (`src/app/(public)/landing.tsx`) (Usa Dropdown dinâmico para seleção do condomínio nos modais de acesso)
- `/` → Landing global (`src/app/(public)/landing.tsx`)
- `/:tenantSlug/join` → Adesão (solicitação) (`src/app/(public)/join.tsx`)
- `/:tenantSlug/login` → Login tenant (duplicado por compatibilidade; ver `routes.ts`)

### 5) Zelador

- `/:tenantSlug/zelador` → `src/app/(zelador)/index.tsx`
- `/zelador` → `src/app/(zelador)/index.tsx`

## Telas por Módulo (O que cada uma faz)

### Auth

- **Login** (`(auth)/login.tsx`): autentica via Supabase Auth; redireciona por role.
- **Callback** (`(auth)/callback.tsx`): lê hash/erros de OTP e estabelece sessão.
- **Reset/Set password** (`(auth)/reset-password.tsx`): fluxo de redefinição/definição de senha.
- **Master gateway** (`(auth)/master-gateway.tsx`): entrada para operação master.

### Portal (Área do Morador)

*Nota: O menu inferior mobile (BottomNav) foi padronizado para 5 atalhos focados no morador: Início, Avisos, Guia, Eventos, Clube.*

- **Comunicados**: lista comunicados do condomínio.
- **Clube**: lista parceiros do `clube_parceiros` e exibe banners premium quando aplicável.
- **Guia do Morador**: lista itens do guia.
- **Eventos**: agenda social do condomínio.
- **Galeria**: álbuns e fotos.
- **Arquivos/Documentos**: lista documentos e gera link público via Storage.
- **FAQ**: perguntas frequentes.

### Painel Admin (Síndico/Subsíndico)

- **Home**: KPIs e atalhos; contagens e cards.
- **Comunicados**: CRUD de comunicados.
- **Assembleias**: CRUD de assembleias.
- **Eventos**: CRUD de eventos.
- **Galeria**: CRUD de álbuns e upload de fotos (Storage).
- **Documentos**: upload/remoção e publicação (Storage).
- **FAQ**: CRUD de FAQs.
- **Guia do Morador**: CRUD de itens do guia.
- **Moradores**: lista/aprovação; gestão de solicitações.
- **Zeladores**: gestão de perfis e convites.
- **Serviços/OS**: gestão de ordens de serviço e detalhe por ID.
- **Canal do Morador**: tickets/mensagens com status (inclui contagem de `respondida` como resolvida).
- **Configurações**: branding do condomínio (logo/capa), dados e módulos ativos.

### Painel Master (Super Admin)

- **Master Dashboard**: gerencia condomínios e usuários; convites e operações globais.

## Integração com Supabase (Backend)

### Client

Local: `src/lib/supabase.ts`

Variáveis (sem valores no repositório):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Observação importante: se essas variáveis não estiverem configuradas na Vercel, o client cai em placeholders e a aplicação pode ficar em estado inconsistente.

### Stores (estado global)

- `src/stores/tenantStore.ts`: `tenant`, `isMasterMode`, `isLoading`
- `src/stores/authStore.ts`: `user`, `session`, `perfil`, flags de loading

### Edge Functions (Supabase)

- `supabase/functions/create-morador`: convite/criação de morador (Admin API) e upsert em `perfis`
- `supabase/functions/invite-condominio-user`: convite parametrizável (role, tenantSlug, redirectTo)

### Storage (Buckets usados pelo frontend)

Pelos usos em `src/app/*`:
- `documentos_condominio` (documentos/arquivos)
- `galeria_condominio` (fotos de galeria)
- `onboarding_fotos` (onboarding)

## Banco de Dados (Schema Resumido)

Fonte principal consultável:
- `supabase/schema_completo.sql` (tabelas base e parte da segurança)
- `supabase/migrations/*` (tabelas/módulos incrementais, ex.: ordens de serviço, mensagens do morador)

### Tabelas centrais

- `condominios` (tenant)
  - `id`, `slug`, `nome`, `logo_url`, `capa_url`, `cor_primaria`, `cor_secundaria`, `plano`, `modulos_ativos`, `ativo`
- `perfis` (extensão de `auth.users`)
  - `id` (= `auth.users.id`), `condominio_id`, `role`, `nome`, `email`, `telefone`, `unidade`, `bloco`, `status_aprovacao`, `primeiro_acesso` (via migrations)
- `solicitacoes_adesao`
  - pedidos de entrada de moradores (pendente/aprovado/recusado)

### Conteúdo do portal

- `comunicados` (mural/feed)
- `eventos` (agenda)
- `assembleias` (chamadas formais)
- `documentos` (metadados + `storage_path`)
- `faqs`
- `galeria_albuns` / `galeria_fotos`
- `clube_parceiros` (clube de vantagens)
- `guia_morador_itens` (usado no frontend; não está visível em `schema_completo.sql` — validar no banco/migrations)

### Operação/Serviços

- `ordens_servico`
- `ordem_servico_atualizacoes`
- `ordem_servico_materiais`
- `ordem_servico_fotos`

### Comunicação do morador

- `mensagens_morador` (tickets do canal do morador)

### Notificações e categorias

- `notificacoes`
- `categorias_condominio`

## Deploy (Vercel) — Referência Rápida

**Objetivo:** build estático SPA com React Router v7.

Arquivos relevantes:
- `react-router.config.ts`: `ssr: false`, `prerender: ["/"]`, `presets: [vercelPreset()]`
- `vercel.json`: rewrites para suportar rotas profundas (SPA)
- `package.json`: build usando `react-router build` (não `vite build`)

Padrão de build/output:
- `build/client/index.html` (prerender de `/`)
- `build/client/__spa-fallback.html` (fallback SPA para deep links)

## Pontos de Atenção / Inconsistências a validar

Estas discrepâncias são sinais de “drift” entre código e schema:
- Frontend referencia `guia_morador_itens` mas não aparece no `schema_completo.sql`.
- Frontend referencia `clubes` e `clube` em alguns pontos; schema base define `clube_parceiros`. Validar se existem tabelas legadas e se o frontend deve padronizar.
- `withTenantPrefix()` só aplica prefixo em localhost; em ambientes de hosting domain, rotas podem exigir construção explícita com `/:tenantSlug/...`.

## Exemplos de URLs (para testes)

**Vercel (hosting domain):**
- Landing global: `https://<projeto>.vercel.app/`
- Landing do tenant: `https://<projeto>.vercel.app/<slug>`
- Portal: `https://<projeto>.vercel.app/<slug>/portal/comunicados`
- Painel: `https://<projeto>.vercel.app/<slug>/painel`

**Domínio próprio (subdomínio do tenant):**
- Portal: `https://<slug>.<dominio>/portal/comunicados`
- Painel: `https://<slug>.<dominio>/painel`

