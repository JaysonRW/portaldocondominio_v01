# Estrutura do Projeto — SaaS Condomínio Smart (2026)

Este documento descreve, de forma prática e completa, a estrutura do repositório, rotas, telas e funcionalidades do projeto **SaaS Condomínio Smart** (frontend React + Supabase).

> Objetivo: ser a “fonte única de verdade” para você consultar sempre que precisar entender o que existe, onde fica e como funciona.

---

## 1) Visão Geral

O projeto é um **SaaS multi-tenant** (multi-condomínios), onde cada condomínio (tenant) possui um portal com identidade visual (cores) e dados isolados via **RLS (Row Level Security)** no Supabase.

Há dois “mundos” principais:

- **Portal Público do Condomínio**: landing do condomínio, comunicados, clube, eventos, galeria, documentos, FAQ, e rota de adesão (join).
- **Dashboard (Rotas Privadas)**: painel administrativo do condomínio (síndico/subsíndico/zelador) e painel master (super admin).

---

## 2) Stack e Bibliotecas

- **Vite + React 19 + TypeScript**
- **React Router v7 (File-based routes via @react-router/dev)**  
- **TanStack Query** (cache, fetching, invalidação)
- **Zustand** (estado global simples: auth e tenant)
- **Supabase** (Auth, Database Postgres, Storage, Edge Functions)
- **Tailwind CSS v4** + componentes UI locais (padrão shadcn-like)
- **Sonner** (toasts)
- **Lucide** (ícones)

Referências:
- Rotas: `src/app/routes.ts`
- Supabase client: `src/lib/supabase.ts`
- Stores: `src/stores/*`

---

## 3) Estrutura de Pastas (Guia Rápido)

```
src/
  app/                        # módulos de rota (React Router v7)
    (public)/                 # páginas públicas do portal
    (auth)/                   # login/callback/master gateway
    (dashboard)/              # páginas privadas (painel do condomínio + master)
    layout.tsx                # AppShell: tenant resolver + auth bootstrap + providers
    root.tsx                  # HTML shell + ErrorBoundary + Outlet
    routes.ts                 # mapa explícito de rotas

  components/
    layout/                   # layouts e navegação (Sidebar, BottomNav, ProtectedRoute, etc)
    ui/                       # componentes base (Button, Card, Dialog, Input, etc)

  lib/
    supabase.ts               # cliente Supabase (anon)
    queryClient.ts            # TanStack Query client
    utils.ts                  # helpers (cn, withTenantPrefix, isLocalhostHost)

  stores/
    authStore.ts              # session/user/perfil (zustand)
    tenantStore.ts            # tenant atual (zustand)

supabase/
  schema_completo.sql         # referência principal do schema + RLS + triggers
  schema.sql                  # schema mínimo/legado (usar com cautela)
  functions/
    create-morador/           # Edge Function de convite de usuário (admin)
```

---

## 4) Multi-tenancy (Como o tenant é resolvido)

O tenant (condomínio) é identificado por:

- **Produção (subdomínio)**: `https://{slug}.seu-dominio.com/...`
- **Localhost (path prefix)**: `http://localhost:5173/{tenantSlug}/...`

A lógica mora em `src/app/layout.tsx`:

- Se o host é `localhost/127.0.0.1`, tenta pegar o slug do **primeiro segmento da URL** (exceto “slugs reservados” como `login`, `painel`, etc.).
- Se não é localhost e possui subdomínio, usa o **subdomínio** como slug.
- Busca o condomínio no Supabase: `condominios` por `slug`.
- Aplica as cores do tenant via CSS variables (`--primary`, `--secondary`).

### Exemplo de navegação correta (localhost)

Use `withTenantPrefix()` para montar URLs com prefixo `/{tenantSlug}`:

```ts
import { withTenantPrefix } from "@/lib/utils"

const href = withTenantPrefix("/login", tenant?.slug)
```

> Importante: em produção, `withTenantPrefix()` não adiciona prefixo, pois o tenant vem do subdomínio.

---

## 5) Autenticação e Autorização

### 5.1 Fluxo de Login (Magic Link)

Tela: `src/app/(auth)/login.tsx`

- Login via `supabase.auth.signInWithOtp({ email, emailRedirectTo })`.
- Redireciona para `auth/callback` após autenticar.
- Regra especial para Master: quando `?master=true` ou email master.

### 5.2 Callback

Tela: `src/app/(auth)/callback.tsx`

- Lê erros na hash (ex.: OTP expirado) e redireciona para login.
- Se a sessão existe:
  - Busca `role` em `perfis`.
  - Redireciona conforme perfil:
    - `morador` → home pública do condomínio (`/`)
    - `super_admin` sem tenant → `/master`
    - demais → `/painel`

### 5.3 ProtectedRoute (Gate de Rotas Privadas)

Arquivo: `src/components/layout/ProtectedRoute.tsx`

Regras (alto nível):

- Sem sessão → redireciona para `/login`
- Perfil ainda carregando → aguarda
- `super_admin` (ou email master) → sempre entra (não força onboarding)
- `morador` e/ou não aprovado (`status_aprovacao=false`) → não acessa rotas internas (`/painel`, `/moradores`, `/painel-master`)
- `zelador` → acesso restrito (por enquanto fica no `/painel`)
- Perfil incompleto (ex.: sem `unidade`) → força `/onboarding`

---

## 6) Mapa de Rotas (Oficial)

O mapa está em `src/app/routes.ts`. O projeto suporta:

- **Rotas sem tenant** (produção via subdomínio ou home SaaS)
- **Rotas com `:tenantSlug`** (para localhost e/ou acesso direto por path)

### 6.1 Rotas públicas (sem tenant)

| Rota | Tela | Objetivo |
|------|------|----------|
| `/` | `(public)/landing.tsx` | landing do SaaS ou do condomínio (dependendo do tenant resolvido) |
| `/login` | `(auth)/login.tsx` | login (magic link) |
| `/auth/callback` | `(auth)/callback.tsx` | callback do Supabase |
| `/register` | `(public)/register.tsx` | cadastro de novo condomínio (self-service) |
| `/join` | `(public)/join.tsx` | solicitação de adesão do morador |
| `/comunicados` | `(public)/comunicados.tsx` | comunicados públicos (pode estar em evolução) |
| `/clube` | `(public)/clube.tsx` | vitrine pública do clube |
| `/eventos` | `(public)/eventos.tsx` | eventos públicos |
| `/galeria` | `(public)/galeria.tsx` | galeria pública |
| `/documentos` | `(public)/documentos.tsx` | documentos públicos (pode estar em evolução) |
| `/faq` | `(public)/faq.tsx` | FAQ público |
| `/master` | `(auth)/master-gateway.tsx` | gateway de acesso master |

### 6.2 Rotas privadas (sem tenant)

| Rota | Tela | Perfil esperado |
|------|------|-----------------|
| `/painel` | `(dashboard)/home.tsx` | síndico/zelador (e master em alguns cenários) |
| `/onboarding` | `(dashboard)/onboarding/index.tsx` | usuários com perfil incompleto |
| `/avisos` | `(dashboard)/avisos/index.tsx` | síndico/subsíndico/super_admin (publicação) |
| `/reservas` | `(dashboard)/reservas/index.tsx` | morador (reservar espaço) |
| `/documentos` | `(dashboard)/documentos/index.tsx` | síndico/subsíndico/super_admin (CRUD) + morador (leitura) |
| `/clube` | `(dashboard)/clube/index.tsx` | leitura para todos; CRUD apenas super_admin |
| `/eventos` | `(dashboard)/eventos/index.tsx` | síndico/subsíndico/super_admin |
| `/galeria` | `(dashboard)/galeria/index.tsx` | síndico/subsíndico/super_admin |
| `/moradores` | `(dashboard)/moradores/index.tsx` | síndico/super_admin |
| `/faq` | `(dashboard)/faq/index.tsx` | síndico/subsíndico/super_admin |
| `/painel-master` | `(dashboard)/master-dashboard.tsx` | super_admin |

### 6.3 Rotas com `:tenantSlug` (localhost)

Todos os endpoints acima possuem equivalentes com prefixo `/:tenantSlug/...` no `routes.ts`. Exemplo:

- `/flores/login`
- `/flores/join`
- `/flores/painel`

---

## 7) Telas e Funcionalidades (Por Módulo)

### 7.1 Portal Público do Condomínio (Tenant)

**Landing do condomínio** (`(public)/landing.tsx`)
- Mostra um “portal de transparência”.
- Exibe comunicados recentes (`comunicados`) e linka para módulos do portal.
- Formulário de contato abre WhatsApp do síndico (telefone vem de `perfis` com role `sindico`).

**Join / Adesão** (`(public)/join.tsx`)
- Cria solicitação em `solicitacoes_adesao` com status `pendente`.
- Upload obrigatório de foto em `storage` bucket `onboarding_fotos` (público).

**Register (criar condomínio)** (`(public)/register.tsx`)
- Cria um registro em `condominios`.
- Envia magic link para e-mail do síndico (fluxo inicial).

### 7.2 Dashboard do Condomínio (Privado)

**Home / Painel** (`(dashboard)/home.tsx`)
- Visões diferentes por role:
  - síndico/master: métricas e atalhos administrativos
  - zelador: painel (placeholder) de chamados
  - morador: experiência mais “portal” (dependendo do fluxo)

**Moradores & Pessoal** (`(dashboard)/moradores/index.tsx`)
- Lista `perfis` do condomínio.
- Pendências de `solicitacoes_adesao` com aprovação/recusa.
- Convite de morador via Edge Function `create-morador`.

**Comunicados / Avisos** (`(dashboard)/avisos/index.tsx`)
- CRUD na tabela `comunicados`.
- Suporta agendamento (`publicar_em`), fixar (`fixado`) e link externo (`link_documento`).

**Reservas** (`(dashboard)/reservas/index.tsx`)
- Lista `espacos` ativos do condomínio.
- Cria `reservas` (com trava de duplicidade por `UNIQUE(espaco_id, data_reserva)`).

**Documentos** (`(dashboard)/documentos/index.tsx`)
- Upload/remoção em bucket `documentos_condominio`.
- Metadados em `documentos`.
- Visão administrativa (CRUD) e visão morador (leitura).

**Eventos** (`(dashboard)/eventos/index.tsx`)
- CRUD da tabela `eventos` (calendário do condomínio).

**Galeria** (`(dashboard)/galeria/index.tsx`)
- CRUD de `galeria_albuns` e `galeria_fotos`.

**FAQ** (`(dashboard)/faq/index.tsx`)
- CRUD de `faqs`.

### 7.3 Painel Master (Privado)

**Gateway Master** (`(auth)/master-gateway.tsx`)
- Solicita acesso via magic link (restrito ao e-mail master).

**Master Dashboard** (`(dashboard)/master-dashboard.tsx`)
- Administração global:
  - Gerenciar `condominios` (criação, ativar/desativar, links de acesso)
  - Gerenciar usuários globais via `perfis` (vínculo de condomínio e role)
  - Aprovar solicitações globais (`solicitacoes_adesao`)
- Convite de síndico pode chamar a Edge Function `create-morador`.

---

## 8) Supabase (Banco, RLS, Triggers, Storage, Edge Functions)

### 8.1 Schema (referência)

Arquivo recomendado para consulta/execução: `supabase/schema_completo.sql`.

Principais tabelas:

- `condominios`: tenants (slug, nome, cores, plano, ativo)
- `perfis`: extensão do `auth.users` (role, condominio_id, dados do morador)
- `solicitacoes_adesao`: pedidos de entrada (pendente/aprovado/recusado)
- `comunicados`: mural / feed
- `espacos` + `reservas`: áreas comuns e agendamento
- `documentos`: metadados de arquivos do condomínio
- `clube_parceiros`: vitrine de vantagens
- `eventos`: calendário
- `galeria_albuns` + `galeria_fotos`: galeria
- `faqs`: perguntas frequentes
- `categorias_condominio`: categorias customizadas por módulo
- `notificacoes`: notificações para usuário ou globais do condomínio

### 8.2 RLS (Row Level Security)

O isolamento de tenant é feito principalmente por:

- `public.get_condominio_id()` (lê `condominio_id` do perfil do usuário)
- policies que permitem:
  - `super_admin` ver tudo
  - usuários verem dados do próprio condomínio
  - usuários verem/atualizarem seu próprio perfil (quando aplicável)

### 8.3 Triggers importantes

**Criação automática de perfil ao criar usuário**  
Trigger: `on_auth_user_created` → `public.handle_new_user()`

- Quando alguém cria conta em `auth.users`, a trigger:
  - tenta encontrar uma `solicitacoes_adesao` para o mesmo e-mail
  - cria `perfis` com dados da solicitação e `status_aprovacao` coerente
  - caso não exista solicitação, cria perfil básico

**Aprovação de solicitação sincroniza o perfil**  
Trigger: `tr_solicitacoes_aprovacao` → `public.handle_solicitacao_aprovada()`

- Quando a solicitação muda para `aprovado`, busca `auth.users` pelo e-mail
- Atualiza `perfis` do usuário, vinculando condomínio e campos relevantes

### 8.4 Storage (Buckets)

- `onboarding_fotos` (público): upload da foto no fluxo de join
- `documentos_condominio` (recomendado público para leitura via link): documentos PDF/arquivos do condomínio

### 8.5 Edge Function: `create-morador`

Local: `supabase/functions/create-morador/index.ts`

Responsabilidade:
- Convida usuário por e-mail via Admin API (`inviteUserByEmail`)
- Cria/atualiza `perfis` via `upsert` com `status_aprovacao=true`
- Opcionalmente registra `solicitacoes_adesao` como `aprovado` para moradores

Variáveis de ambiente no ambiente da Edge Function:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sensível)

---

## 9) Variáveis de Ambiente (Frontend)

Arquivo local: `.env.local` (não versionar chaves sensíveis).

Obrigatórias no frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Exemplo:

```bash
VITE_SUPABASE_URL="https://<seu-projeto>.supabase.co"
VITE_SUPABASE_ANON_KEY="<sua-anon-key>"
```

---

## 10) Como rodar localmente

1) Instalar dependências:

```bash
npm install
```

2) Subir o frontend:

```bash
npm run dev
```

3) Abrir:
- SaaS (sem tenant): `http://localhost:5173/`
- Tenant por path: `http://localhost:5173/<slug>/`

---

## 11) Pontos de Atenção / Pendências Conhecidas

Este bloco existe para reduzir “surpresas” ao evoluir o sistema:

- A tela de Documentos usa o campo `descricao` em `documentos`, mas o schema completo atual não cria essa coluna. Se for requisito, deve existir uma migração `ALTER TABLE documentos ADD COLUMN descricao TEXT`.
- Alguns módulos públicos ainda estão em modo placeholder/mocks (ex.: `(public)/documentos.tsx`).
- Existem `console.log()` em layout de dashboard; para produção, recomenda-se remover ou condicionar a `import.meta.env.DEV`.

---

## 12) Onde alterar o quê (FAQ rápido)

- “Quero mudar as rotas”: `src/app/routes.ts`
- “Quero mudar regra de permissão”: `src/components/layout/ProtectedRoute.tsx`
- “Quero mudar como identifica o condomínio”: `src/app/layout.tsx`
- “Quero mudar consultas/caches”: useQuery/useMutation nos módulos e `src/lib/queryClient.ts`
- “Quero alterar schema/RLS/triggers”: `supabase/schema_completo.sql`
- “Quero alterar convite de usuários”: `supabase/functions/create-morador/index.ts`

