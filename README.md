# SaaS Condomínio Smart

Plataforma **multi-tenant** para gestão condominial, com portal público do condomínio e dashboard administrativo (síndico/zelador) + painel master.

## Documentação principal

- Estrutura do projeto (telas, funcionalidades e rotas): `docs/ESTRUTURA-DO-PROJETO.md`

## Stack

- Vite + React + TypeScript
- React Router v7 (file-based routes via `@react-router/dev`)
- TanStack Query + Zustand
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Tailwind CSS

## Como rodar localmente

Pré-requisitos:

- Node.js `22.15.0` (veja `.nvmrc`)
- npm `10.x`

1) Instalar exatamente as dependências do lockfile:

```bash
npm ci
```

2) Copiar `.env.example` para `.env.local` e preencher a chave pública do projeto:

```bash
VITE_SUPABASE_URL="https://aiagyzatiibqsziekqdh.supabase.co"
VITE_SUPABASE_ANON_KEY="<sua-publishable-ou-anon-key>"
```

3) Subir o servidor:

```bash
npm run dev
```

4) Validar antes de enviar alterações:

```bash
npm run check
```

## Banco de dados

- Projeto Supabase: `aiagyzatiibqsziekqdh`
- Alterações de schema devem entrar como migrations em `supabase/migrations`.
- Não execute `supabase db reset` ou `supabase db push` até a migration-base ser reconciliada com o schema remoto. O histórico atual começa por alterações sobre tabelas que já existiam.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em arquivos `.env` versionados.

## URLs úteis (dev)

- SaaS (sem tenant): `http://localhost:5173/`
- Tenant por path: `http://localhost:5173/<slug>/`
- Master gateway: `http://localhost:5173/master`
