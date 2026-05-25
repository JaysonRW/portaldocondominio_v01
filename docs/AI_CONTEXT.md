# AI Context — SaaS Condomínio Smart

Este documento descreve o projeto (stack, arquitetura, telas, rotas e Supabase) para consulta rápida e para que um agente de IA entenda o sistema com alto contexto.

## Visão Geral

**Produto:** SaaS multi-tenant para condomínios, com:
- **Portal do condomínio (morador)**: conteúdo e serviços (comunicados, encomendas, documentos, eventos, FAQ, etc.)
- **Painel administrativo (síndico/subsíndico)**: gestão de conteúdo e módulos
- **Área do zelador**: ordens de serviço atribuídas
- **Área da portaria**: registro e baixa de encomendas
- **Modo master (super admin)**: operar múltiplos condomínios

## Multi-tenancy (tenant por slug)

Um condomínio (tenant) é identificado por `slug`.

- **Domínio próprio:** via subdomínio `slug.seudominio.com`
- **Vercel/hosting domain:** via path `/<slug>/...`
- **Localhost:** via path `/<slug>/...`

**Ponto central de resolução do tenant:** `src/app/layout.tsx` (`AppShellManager`).

## Stack e Ferramentas

- **Frontend:** React 19 + React Router v7 + Vite
- **UI:** Tailwind CSS v4 + componentes em `src/components/ui/*` (Radix quando necessário)
- **State:** Zustand (`src/stores/*`)
- **Data fetching/cache:** TanStack Query v5
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Deploy:** Vercel (SPA estática via `ssr:false`)

Arquivos-chave:
- Rotas: `src/app/routes.ts`
- Layout/tenant/auth shell: `src/app/layout.tsx`
- Guards de acesso: `src/components/layout/ProtectedRoute.tsx`
- RR/Vercel: `react-router.config.ts`, `vercel.json`, `package.json`
- Supabase client: `src/lib/supabase.ts`
- Migrations/schema: `supabase/migrations/*`, `supabase/schema_completo.sql`
- Edge Functions: `supabase/functions/*`

## Estrutura de Pastas (Mapa rápido)

- `src/app/*`
  - `(public)/*`: portal/landing
  - `(auth)/*`: login/callback/reset/set password/master gateway
  - `(dashboard)/*`: painel (síndico/subsíndico) + painel master
  - `(zelador)/*`: área do zelador
  - `(portaria)/*`: console de portaria (encomendas)
  - `layout.tsx`: resolve tenant e sessão; injeta tema/tenant
  - `root.tsx`: HTML shell, meta tags, ErrorBoundary
  - `routes.ts`: configuração de rotas
- `src/components/layout/*`: layouts e navegação
- `src/stores/*`: stores (auth/tenant)
- `src/lib/*`: supabase client, utils, queryClient
- `supabase/*`
  - `migrations/*`: schema incremental, triggers e RLS
  - `functions/*`: Edge Functions (convites/criação de usuários)

## Modelos de Usuário e Permissões (alto nível)

**Roles observadas no app:**
- `super_admin` (master)
- `sindico`
- `subsindico`
- `zelador`
- `portaria`
- `morador`
- `fornecedor` (há redirecionamentos/placeholder)

**Guard principal:** `ProtectedRoute`.
- Não autenticado → redireciona para `/login` (com prefixo de tenant quando aplicável)
- Primeiro acesso (`primeiro_acesso`) → força `set-password`
- Morador não entra em `/painel*` → vai para `/portal/comunicados`
- Portaria não entra em `/painel*` → vai para `/portaria`
- Master entra em `/painel-master`

## Resolução do Tenant (slug) — regras

Local: `src/app/layout.tsx` (dentro do `AppShellManager`).

- `slugFromHost`: quando o hostname é domínio real com subdomínio do tenant
- `slugFromPath`: quando estamos em localhost **ou** em hosting domain (ex.: `*.vercel.app`)

**Hosting domains:** `['vercel.app', 'netlify.app', 'pages.dev']` são tratados como “não-tenant no host”.

**Padrões esperados de URL com slug no path (Vercel/localhost):**
- `/<slug>`
- `/<slug>/portal/<pagina>`
- `/<slug>/login`, `/<slug>/painel`, `/<slug>/onboarding`, `/<slug>/portaria`, etc.

## Rotas (referência)

As rotas são definidas em `src/app/routes.ts` com versões **com tenant** (`:tenantSlug/...`) e **sem tenant** (para domínio customizado onde o tenant vem do host).

Exemplos comuns:
- Morador: `/:tenantSlug/portal/comunicados`, `/:tenantSlug/portal/encomendas`, `/:tenantSlug/portal/faq`
- Admin: `/:tenantSlug/painel/*`
- Portaria: `/:tenantSlug/portaria`
- Master: `/painel-master` (sem slug)

## Supabase (Backend)

### Client

Local: `src/lib/supabase.ts`

Variáveis no frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Observação: sem essas variáveis no deploy, o client cai em placeholders e a aplicação pode ficar inconsistente.

### Edge Functions

- `supabase/functions/create-morador`: convite/criação de morador (Admin API) + upsert em `perfis`
- `supabase/functions/invite-condominio-user`: convite parametrizável (role/condomínio/redirect)

### Storage (buckets usados)

- `documentos_condominio`
- `galeria_condominio`
- `onboarding_fotos`

## Banco de Dados (resumo)

Fontes:
- `supabase/schema_completo.sql`
- `supabase/migrations/*`

Tabelas centrais:
- `condominios`
- `perfis`
- `solicitacoes_adesao`

Conteúdo do portal:
- `comunicados`, `eventos`, `assembleias`, `documentos`, `faqs`, `galeria_albuns`, `galeria_fotos`, `clube_parceiros`

Operação:
- `ordens_servico` (+ tabelas auxiliares)
- `mensagens_morador`

## Métricas/Indicadores (FAQ)

Para KPIs no painel do síndico existe tracking em `public.faq_interactions` (views + feedback) e RPC `public.faq_kpis(condominio_id)`.

- Migration: `supabase/migrations/20260522000000_faq_interactions.sql`
- Painel do síndico: `src/app/(dashboard)/faq/index.tsx`
- Portal do morador (tracking): `src/app/(public)/faq.tsx`

## Deploy (Vercel) — referência rápida

Objetivo: build estático SPA com React Router v7.

Arquivos:
- `react-router.config.ts`: `ssr: false`, `prerender: ["/"]`, `presets: [vercelPreset()]`
- `vercel.json`: rewrites para suportar rotas profundas (SPA)
- `package.json`: build usa `react-router build`

Outputs:
- `build/client/index.html`
- `build/client/__spa-fallback.html`

## Pontos de Atenção (drift / riscos)

- `withTenantPrefix()` só aplica prefixo em localhost; em hosting domains, garanta rotas `/<slug>/...`.
- Valide tabelas/colunas referenciadas pelo frontend vs migrations.

## URLs de teste

Vercel:
- Landing global: `https://<projeto>.vercel.app/`
- Landing tenant: `https://<projeto>.vercel.app/<slug>`
- Portal: `https://<projeto>.vercel.app/<slug>/portal/comunicados`
- Painel: `https://<projeto>.vercel.app/<slug>/painel`
- Portaria: `https://<projeto>.vercel.app/<slug>/portaria`

Domínio próprio (subdomínio do tenant):
- Portal: `https://<slug>.<dominio>/portal/comunicados`
- Painel: `https://<slug>.<dominio>/painel`
