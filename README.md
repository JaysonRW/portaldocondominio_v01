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

1) Instalar dependências:

```bash
npm install
```

2) Criar `.env.local` (frontend):

```bash
VITE_SUPABASE_URL="https://<seu-projeto>.supabase.co"
VITE_SUPABASE_ANON_KEY="<sua-anon-key>"
```

3) Subir o servidor:

```bash
npm run dev
```

## URLs úteis (dev)

- SaaS (sem tenant): `http://localhost:5173/`
- Tenant por path: `http://localhost:5173/<slug>/`
- Master gateway: `http://localhost:5173/master`
