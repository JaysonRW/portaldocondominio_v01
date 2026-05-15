# Plano de Refatoração: Autenticação e Multi-Tenancy Segura

Este documento contém os prompts organizados para refatorar o sistema de autenticação (de Magic Link para E-mail/Senha), consolidar os 4 perfis de usuário (`super_admin`, `sindico`, `morador`, `fornecedor`) e otimizar a segurança/performance do banco de dados no Supabase.

**Instruções de uso com a IA da IDE:**
Copie o conteúdo de cada bloco `Prompt` (um passo de cada vez), cole no chat da sua IDE (Cursor, Trae, Lovable, etc.) com a tag `@workspace` e aguarde a conclusão e revisão antes de passar para o próximo.

***

## Passo 1: Refatoração da Autenticação (Frontend)

**Prompt para a IDE:**

```text
@workspace
Atue como um Engenheiro de Software Sênior especialista em React, Vite e Supabase.
Objetivo: Migrar o sistema de autenticação de "Magic Link" para "E-mail e Senha".

Tarefas necessárias:
1. Em `src/app/(auth)/login.tsx`:
   - Adicione um campo de input para "Senha".
   - Altere a chamada `supabase.auth.signInWithOtp` para `supabase.auth.signInWithPassword({ email, password })`.
   - Adicione um link e fluxo para "Esqueci minha senha" (chamando `supabase.auth.resetPasswordForEmail`).

2. Em `src/app/(public)/register.tsx` e `src/app/(public)/join.tsx`:
   - Adicione o campo obrigatório de "Senha" e "Confirmar Senha" nos formulários.
   - Altere o fluxo de criação para usar `supabase.auth.signUp({ email, password })`.

3. Nova Tela: Crie a rota e tela `src/app/(auth)/reset-password.tsx` (e adicione no `routes.ts`):
   - Esta tela deve ser chamada quando o usuário clica no link de recuperação de e-mail.
   - Deve conter um formulário para digitar a nova senha e chamar `supabase.auth.updateUser({ password: newPassword })`.

Regras:
- Mantenha o design system atual (Tailwind/shadcn).
- Trate os erros comuns do Supabase (senha fraca, e-mail já cadastrado, credenciais inválidas) com toasts descritivos usando a biblioteca Sonner.
```

Passo 2: Estruturação de Perfis e Permissões (Frontend Routing)

@workspace
Objetivo: Atualizar o gerenciamento de perfis e a proteção de rotas privadas (RBAC).
Temos agora 4 perfis estritos mapeados no sistema:

- 'super\_admin' (Master, dono do SaaS)
- 'sindico' (Administrador do tenant/condomínio)
- 'morador' (Usuário final do tenant)
- 'fornecedor' (Perfil futuro para parceiros comerciais)

Tarefas:

1. Em `src/stores/authStore.ts`:
   - Atualize a tipagem de `role` para um união de strings: `'super_admin' | 'sindico' | 'morador' | 'fornecedor'`.
2. Em `src/components/layout/ProtectedRoute.tsx`:
   - Refatore a lógica de redirecionamento para acomodar as 4 roles.
   - Regra: `super_admin` tem passe livre para `/master` e qualquer `/painel`.
   - Regra: `sindico` é redirecionado para `/painel` (painel administrativo do condomínio).
   - Regra: `morador` é redirecionado para a home pública do condomínio (`/`) e NÃO pode acessar `/painel`.
   - Regra: `fornecedor` (placeholder) deve ser redirecionado para uma futura rota `/painel-fornecedor` (crie o redirecionamento provisório e uma tela simples de placeholder).
3. Em `src/app/(auth)/callback.tsx`:
   - Ajuste o roteamento pós-login para respeitar a mesma árvore de decisão das roles acima após a validação da sessão.

<br />

## Passo 3: Segurança e Performance no Banco de Dados (Supabase Custom Claims)

*Nota: Os scripts SQL gerados por este passo deverão ser executados diretamente no SQL Editor do painel web do Supabase.*

<br />

@workspace
Objetivo: Implementar Supabase Custom Claims via Auth Hooks para injetar 'role' e 'condominio\_id' diretamente no JWT do usuário. Isso substituirá as consultas N+1 nas tabelas de perfis durante a validação de RLS e resolverá problemas de gargalo de performance.

Tarefas:

1. Crie um script SQL em `supabase/migrations/` (ex: `add_custom_claims_hook.sql`) com as seguintes instruções:
   - Crie uma função plpgsql que atue como um "Custom Access Token (JWT) hook".
   - A função deve fazer um SELECT na tabela `public.perfis` usando o `user_id` do evento de autenticação.
   - Se o perfil existir, injete `role` e `condominio_id` dentro do objeto `claims` do JWT (em `app_metadata`).
   - Conceda os grants necessários (`GRANT USAGE ON SCHEMA public TO supabase_auth_admin;`).
   - Forneça instruções em comentários de como vincular essa função aos triggers do Supabase Auth no painel.
2. Crie um segundo script SQL (`update_rls_policies.sql`) para atualizar as Row Level Security (RLS) Policies existentes (ex: na tabela de `comunicados` e `documentos`):
   - Substitua o uso da função `public.get_condominio_id()` pela leitura direta do JWT:
     `auth.jwt() -> 'app_metadata' ->> 'condominio_id' = condominio_id::text`
   - Adicione a regra para o Master visualizar tudo: `auth.jwt() -> 'app_metadata' ->> 'role' = '"super_admin"'`.

Escreva o código SQL completo e bem comentado para estas implementações. Certifique-se de tratar o caso onde o perfil pode ainda não existir no momento do cadastro inicial.

Passo 4: Ajuste na Edge Function de Convites

@workspace
Objetivo: Atualizar a Edge Function `supabase/functions/create-morador/index.ts`.
Como o sistema agora usa E-mail e Senha (e não mais Magic Link), o fluxo de convite pelo síndico deve mudar.

Tarefas:

1. Na chamada `supabase.auth.admin.inviteUserByEmail()`, certifique-se de que estamos passando um objeto `data` dentro de `user_metadata` contendo a role desejada e o `condominio_id`.
2. Garanta que o fluxo de `upsert` na tabela `perfis` continue funcionando, associando o usuário ao `condominio_id` do tenant.
3. Adicione comentários no código explicando que o e-mail enviado pelo Supabase (template de invite configurado no painel) deverá conter um link que redirecionará o usuário recém-convidado para a tela `/reset-password` (ou `/set-password`), para que ele cadastre sua primeira senha e ative a conta definitivamente.

