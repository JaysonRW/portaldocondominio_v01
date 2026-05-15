# Módulo Ordens de Serviço — Controle de Serviços do Zelador

## SaaS Condomínio Smart

Este documento consolida a proposta para implementação do módulo de **solicitações internas e controle de serviços do zelador** dentro do SaaS Condomínio Smart.

O objetivo é criar uma área administrativa onde o **síndico** possa organizar, acompanhar e documentar os serviços executados pelo **zelador**, mantendo histórico, custos, materiais, tempo de execução e indicadores úteis para futuras assembleias.

---

# 1. Nome recomendado do módulo

opções principail:

Ordens de Serviço
```

## Recomendação

Usar:

```txt
Ordens de Serviço
```

Motivo:

- soa mais profissional;
- permite expansão futura;
- não limita o módulo apenas ao zelador;
- pode incluir manutenção, limpeza, pequenas reformas, inspeções e tarefas internas;
- facilita relatórios e indicadores administrativos.

---

# 2. Objetivo do módulo

O módulo deve permitir que o síndico tenha controle sobre:

```txt
O que está sendo feito pelo zelador
O que está agendado
O que está pendente
Quanto tempo cada serviço levou
Qual valor foi gasto
Quais materiais foram usados
Onde o serviço foi executado
Quais tipos de manutenção são mais recorrentes
Quais locais geram mais demandas
Quais reformas ou ações foram mais executadas
```

Esse histórico pode ser usado pelo síndico para:

```txt
prestar contas em assembleias;
justificar compras de materiais;
identificar problemas recorrentes;
organizar melhor a rotina do zelador;
reduzir perda de informação;
provar execução de tarefas;
melhorar a gestão interna do condomínio.
```

---

# 3. Escopo do módulo

Este módulo é um **módulo administrativo interno**.

Ele não deve ser tratado como módulo público nem como área de solicitação direta dos moradores.

## 3.1 Quem participa

```txt
Síndico
Zelador
Super Admin, se necessário
```

## 3.2 Quem não participa no MVP

```txt
Morador
Fornecedor externo
Visitante público
```

## 3.3 Decisão importante

O morador **não terá ação neste módulo** no MVP.

Isso evita:

```txt
excesso de solicitações;
cobrança direta ao zelador;
expectativa de SLA;
reclamações abertas sem filtro;
complexidade de central de chamados;
necessidade de moderação constante.
```

O fluxo correto no MVP será:

```txt
Síndico cria e controla.
Zelador executa e atualiza.
Morador não participa.
```

---

# 4. Visão estratégica

Este módulo adiciona valor operacional ao SaaS sem transformar o sistema em uma gestão condominial completa.

Ele faz sentido porque:

```txt
Não envolve boletos.
Não envolve documentos fiscais.
Não envolve dados financeiros sensíveis de moradores.
Não envolve reservas.
Não depende de interação dos moradores.
Gera controle interno para o síndico.
Produz histórico e indicadores para assembleias.
```

Frase de posicionamento:

```txt
Controle interno de ordens de serviço para organizar a rotina do zelador e gerar histórico de manutenção do condomínio.
```

---

# 5. Fluxo principal

```txt
Síndico cria ou agenda uma ordem de serviço
↓
Síndico designa um zelador responsável
↓
Zelador visualiza a ordem em seu painel
↓
Zelador inicia o serviço
↓
Zelador adiciona feedbacks durante a execução
↓
Zelador informa materiais usados, tempo e custos, quando aplicável
↓
Zelador conclui o serviço
↓
Síndico acompanha histórico e relatórios
```

---

# 6. Papéis e permissões

## 6.1 Síndico

O síndico tem controle total das ordens de serviço do seu condomínio.

Pode:

```txt
Cadastrar zelador
Criar ordem de serviço
Editar ordem de serviço
Cancelar ordem de serviço
Agendar serviço
Definir prioridade
Definir local
Designar responsável
Acompanhar status
Ver feedbacks do zelador
Registrar ou revisar custos
Registrar ou revisar materiais usados
Encerrar serviço
Visualizar indicadores
Gerar histórico para assembleias
```

## 6.2 Zelador

O zelador tem acesso apenas às ordens atribuídas a ele.

Pode:

```txt
Ver serviços atribuídos
Ver serviços do dia
Ver serviços agendados
Alterar status das próprias ordens
Adicionar feedback
Informar materiais usados
Informar tempo gasto
Informar custo, se permitido
Adicionar observações
Marcar serviço como concluído
```

## 6.3 Morador

O morador não acessa esse módulo no MVP.

Não pode:

```txt
Criar ordem de serviço
Comentar em ordem
Acompanhar fila interna
Cobrar execução
Avaliar zelador
Ver custos e materiais
```

## 6.4 Super Admin

O super admin pode visualizar tudo, se necessário, para suporte, auditoria ou manutenção da plataforma.

---

# 7. Estrutura do módulo

O módulo pode ser dividido em quatro áreas:

```txt
Dashboard
Ordens de Serviço
Agenda
Relatórios
```

---

# 8. Dashboard do síndico

Tela inicial do módulo.

## 8.1 Cards recomendados

```txt
Serviços em aberto
Serviços em andamento
Serviços agendados
Serviços concluídos no mês
Valor gasto no mês
Materiais mais usados
Locais com mais ocorrências
Categorias mais recorrentes
```

## 8.2 Indicadores importantes

```txt
Tempo médio de conclusão
Quantidade de serviços por categoria
Serviços atrasados
Custo total por período
Locais mais problemáticos
Zelador com mais serviços executados
```

---

# 9. Ordens de Serviço

Essa é a tela principal do módulo.

## 9.1 Campos de uma ordem

```txt
Título
Descrição
Categoria
Prioridade
Local
Responsável
Status
Data prevista/agendada
Data de início
Data de conclusão
Tempo estimado
Tempo real
Custo estimado
Custo real
Materiais usados
Observações do síndico
Feedback do zelador
Fotos opcionais
```

## 9.2 Exemplo

```txt
Título: Troca de lâmpada no bloco B
Categoria: Elétrica
Prioridade: Média
Local: Bloco B - 2º andar
Responsável: João Zelador
Status: Em andamento
Material usado: 1 lâmpada LED 12W
Custo: R$ 18,90
Tempo gasto: 25 minutos
```

---

# 10. Agenda

A agenda permite ao síndico visualizar o que está programado.

## 10.1 Visualizações possíveis

```txt
Hoje
Semana
Mês
```

## 10.2 Itens exibidos

```txt
Serviços agendados
Serviços recorrentes
Serviços atrasados
Serviços em andamento
```

## 10.3 Exemplo

```txt
Segunda-feira
09:00 — Limpeza da caixa de gordura
14:00 — Verificação da iluminação da garagem

Terça-feira
10:00 — Pintura da parede do hall
```

---

# 11. Relatórios

Essa área é importante para gerar argumentos e resultados para assembleias.

## 11.1 Relatórios possíveis

```txt
Serviços executados no mês
Custos por categoria
Materiais utilizados
Locais com maior número de serviços
Serviços atrasados
Histórico por zelador
Histórico por local
Histórico por tipo de manutenção
```

## 11.2 Indicadores para assembleias

```txt
Total de serviços executados no período
Serviços por categoria
Serviços por local
Serviços por prioridade
Custo total por mês
Materiais mais usados
Tempo médio de execução
Serviços atrasados
Serviços recorrentes
Serviços por zelador
```

## 11.3 Exemplo de insight

```txt
Nos últimos 90 dias, 38% das ordens de serviço foram relacionadas à iluminação da garagem.
```

## 11.4 Exemplo de texto para assembleia

```txt
No último trimestre foram concluídas 42 ordens de serviço.
As principais causas foram elétrica, hidráulica e manutenção preventiva.
O local com maior recorrência foi a garagem do subsolo.
O custo total registrado foi de R$ 2.480,70.
```

---

# 12. Status recomendados

Usar os seguintes status:

```txt
rascunho
agendado
pendente
em_andamento
pausado
concluido
cancelado
```

## 12.1 Descrição dos status

### rascunho

Criado pelo síndico, mas ainda não designado ou publicado.

### agendado

Serviço com data marcada.

### pendente

Está na fila, mas sem execução iniciada.

### em_andamento

Zelador começou o serviço.

### pausado

Aguardando material, autorização, orçamento ou outro motivo.

### concluido

Serviço finalizado.

### cancelado

Serviço cancelado pelo síndico.

---

# 13. Prioridades recomendadas

```txt
baixa
media
alta
urgente
```

## 13.1 Exemplos

```txt
Urgente: vazamento, risco elétrico, portão travado
Alta: iluminação de área comum, infiltração, porta danificada
Média: pintura, pequenos reparos
Baixa: organização, ajuste estético, manutenção preventiva
```

---

# 14. Categorias recomendadas

```txt
Elétrica
Hidráulica
Limpeza
Pintura
Jardinagem
Segurança
Portões e acessos
Elevadores
Garagem
Áreas comuns
Manutenção preventiva
Reforma
Outros
```

Essas categorias serão importantes para os indicadores.

---

# 15. Local do serviço

No MVP, o campo local pode começar como texto livre:

```txt
local_descricao
```

## 15.1 Exemplos

```txt
Bloco A - Hall de entrada
Garagem subsolo 1
Salão de festas
Portaria
Jardim externo
Corredor 3º andar
Casa de máquinas
```

## 15.2 Evolução futura

Futuramente, pode existir uma tabela:

```txt
locais_condominio
```

Para padronizar os locais e gerar relatórios mais precisos.

---

# 16. Fluxo do síndico

```txt
1. Síndico acessa /painel/servicos
2. Clica em “Nova ordem de serviço”
3. Preenche título, descrição, local, categoria e prioridade
4. Define se é pendente ou agendada
5. Escolhe zelador responsável
6. Salva a ordem
7. Zelador recebe no painel dele
8. Síndico acompanha mudanças de status
9. Ao concluir, síndico visualiza custo, tempo e materiais
10. Serviço entra nos relatórios
```

---

# 17. Fluxo do zelador

Tela simples, objetiva e preferencialmente mobile-first.

```txt
1. Zelador acessa /zelador ou /painel-zelador
2. Vê lista de serviços atribuídos
3. Abre uma ordem
4. Clica em “Iniciar serviço”
5. Adiciona feedback durante execução
6. Informa material usado, se houver
7. Informa custo, se houver autorização
8. Clica em “Concluir serviço”
```

## 17.1 Botões úteis

```txt
Iniciar
Pausar
Adicionar feedback
Concluir
```

---

# 18. Feedbacks do zelador

É importante criar um histórico de atualizações, não apenas um campo de texto único.

## 18.1 Exemplo de histórico

```txt
10:15 — Serviço iniciado.
10:40 — Foi identificado que será necessário comprar uma nova peça.
11:20 — Material comprado: torneira nova R$ 39,90.
12:00 — Serviço concluído.
```

## 18.2 Tabela recomendada

```txt
ordem_servico_atualizacoes
```

Campos principais:

```txt
ordem_id
autor_id
tipo
mensagem
status_anterior
status_novo
criado_em
```

---

# 19. Materiais usados

Materiais devem ficar em tabela separada para permitir relatórios.

## 19.1 Tabela recomendada

```txt
ordem_servico_materiais
```

Campos principais:

```txt
ordem_id
nome_material
quantidade
unidade
valor_unitario
valor_total
observacao
```

## 19.2 Exemplo

```txt
Lâmpada LED 12W
Quantidade: 2
Valor unitário: R$ 18,90
Total: R$ 37,80
```

---

# 20. Decisão sobre role do zelador

No plano anterior, os perfis estavam consolidados como:

```txt
super_admin
sindico
morador
fornecedor
```

Para este módulo, é recomendado adicionar um novo perfil:

```txt
zelador
```

## 20.1 Roles finais recomendadas

```txt
super_admin
sindico
morador
zelador
fornecedor
```

## 20.2 Motivo

Zelador não é fornecedor.

Ele precisa:

```txt
painel próprio;
permissões próprias;
ordens atribuídas;
histórico de execução;
ações específicas de status e feedback.
```

Usar `fornecedor` para zelador pode gerar confusão de regra e permissão.

---

# 21. Rotas recomendadas

## 21.1 Para síndico

```txt
/painel/servicos
/painel/servicos/nova
/painel/servicos/:id
/painel/servicos/agenda
/painel/servicos/relatorios
/painel/zeladores
```

## 21.2 Para zelador

Recomendação:

```txt
/zelador
```

Rotas:

```txt
/zelador
/zelador/servicos
/zelador/servicos/:id
```

## 21.3 Motivo

O painel do zelador deve ser simples e separado do painel administrativo.

---

# 22. Tela do síndico

## 22.1 `/painel/servicos`

Componentes:

```txt
Cards de resumo
Filtros
Tabela/lista de ordens
Botão Nova Ordem
```

## 22.2 Filtros

```txt
Todos
Pendentes
Agendados
Em andamento
Pausados
Concluídos
Atrasados
Por zelador
Por categoria
Por prioridade
```

## 22.3 Cards

```txt
Abertos
Em andamento
Agendados
Concluídos no mês
Custo do mês
Tempo médio
```

---

# 23. Tela do zelador

## 23.1 `/zelador`

Deve ser simples e mobile-first.

Cards:

```txt
Serviços de hoje
Pendentes
Em andamento
Concluídos
```

Lista:

```txt
Prioridade
Título
Local
Status
Data agendada
Botão Ver detalhes
```

## 23.2 Detalhe da ordem

Exibir:

```txt
Descrição
Local
Prioridade
Materiais necessários, se houver
Observações do síndico
Histórico
Botões de ação
```

Botões:

```txt
Iniciar serviço
Pausar
Adicionar feedback
Adicionar material
Concluir serviço
```

---

# 24. Schema Supabase recomendado

## 24.1 Tabela principal: `ordens_servico`

```sql
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,

  categoria TEXT,
  prioridade TEXT DEFAULT 'media',

  local_descricao TEXT,

  status TEXT DEFAULT 'pendente',

  criado_por UUID REFERENCES auth.users(id),
  responsavel_id UUID REFERENCES auth.users(id),

  data_agendada TIMESTAMPTZ,
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,

  tempo_estimado_minutos INTEGER,
  tempo_real_minutos INTEGER,

  custo_estimado NUMERIC(10,2),
  custo_real NUMERIC(10,2),

  observacoes_sindico TEXT,
  feedback_final TEXT,

  ativo BOOLEAN DEFAULT true,

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);
```

---

## 24.2 Tabela de atualizações: `ordem_servico_atualizacoes`

```sql
CREATE TABLE public.ordem_servico_atualizacoes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  autor_id UUID REFERENCES auth.users(id),

  tipo TEXT DEFAULT 'comentario',
  mensagem TEXT NOT NULL,

  status_anterior TEXT,
  status_novo TEXT,

  criado_em TIMESTAMPTZ DEFAULT now()
);
```

Tipos possíveis:

```txt
comentario
mudanca_status
material
pausa
conclusao
observacao
```

---

## 24.3 Tabela de materiais: `ordem_servico_materiais`

```sql
CREATE TABLE public.ordem_servico_materiais (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  nome_material VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) DEFAULT 1,
  unidade VARCHAR(50),
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  observacao TEXT,

  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);
```

---

## 24.4 Tabela opcional: `ordem_servico_fotos`

Não é prioridade absoluta para o MVP, mas é útil para evolução.

```sql
CREATE TABLE public.ordem_servico_fotos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  foto_url TEXT NOT NULL,
  storage_path TEXT,

  tipo TEXT DEFAULT 'execucao',

  enviado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);
```

Tipos:

```txt
antes
durante
depois
execucao
```

---

# 25. Constraints recomendadas

```sql
ALTER TABLE public.ordens_servico
ADD CONSTRAINT ordens_servico_status_check
CHECK (
  status IN ('rascunho', 'agendado', 'pendente', 'em_andamento', 'pausado', 'concluido', 'cancelado')
);

ALTER TABLE public.ordens_servico
ADD CONSTRAINT ordens_servico_prioridade_check
CHECK (
  prioridade IN ('baixa', 'media', 'alta', 'urgente')
);

ALTER TABLE public.ordem_servico_atualizacoes
ADD CONSTRAINT ordem_servico_atualizacoes_tipo_check
CHECK (
  tipo IN ('comentario', 'mudanca_status', 'material', 'pausa', 'conclusao', 'observacao')
);

ALTER TABLE public.ordem_servico_fotos
ADD CONSTRAINT ordem_servico_fotos_tipo_check
CHECK (
  tipo IN ('antes', 'durante', 'depois', 'execucao')
);
```

---

# 26. Índices recomendados

```sql
CREATE INDEX IF NOT EXISTS idx_ordens_servico_condominio
ON public.ordens_servico (condominio_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_responsavel
ON public.ordens_servico (responsavel_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_status
ON public.ordens_servico (status);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_prioridade
ON public.ordens_servico (prioridade);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_categoria
ON public.ordens_servico (categoria);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_agendada
ON public.ordens_servico (data_agendada);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_atualizacoes_ordem
ON public.ordem_servico_atualizacoes (ordem_id);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_materiais_ordem
ON public.ordem_servico_materiais (ordem_id);
```

---

# 27. Trigger para `atualizado_em`

Caso ainda não exista uma função genérica:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;
```

Trigger:

```sql
DROP TRIGGER IF EXISTS set_ordens_servico_updated_at
ON public.ordens_servico;

CREATE TRIGGER set_ordens_servico_updated_at
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
```

---

# 28. Query SQL completa para Supabase

```sql
-- ============================================================
-- Módulo: Ordens de Serviço / Serviços do Zelador
-- SaaS Condomínio Smart
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,

  categoria TEXT,
  prioridade TEXT DEFAULT 'media',

  local_descricao TEXT,

  status TEXT DEFAULT 'pendente',

  criado_por UUID REFERENCES auth.users(id),
  responsavel_id UUID REFERENCES auth.users(id),

  data_agendada TIMESTAMPTZ,
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,

  tempo_estimado_minutos INTEGER,
  tempo_real_minutos INTEGER,

  custo_estimado NUMERIC(10,2),
  custo_real NUMERIC(10,2),

  observacoes_sindico TEXT,
  feedback_final TEXT,

  ativo BOOLEAN DEFAULT true,

  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Histórico de atualizações
CREATE TABLE IF NOT EXISTS public.ordem_servico_atualizacoes (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  autor_id UUID REFERENCES auth.users(id),

  tipo TEXT DEFAULT 'comentario',
  mensagem TEXT NOT NULL,

  status_anterior TEXT,
  status_novo TEXT,

  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Materiais usados
CREATE TABLE IF NOT EXISTS public.ordem_servico_materiais (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  nome_material VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10,2) DEFAULT 1,
  unidade VARCHAR(50),
  valor_unitario NUMERIC(10,2),
  valor_total NUMERIC(10,2),
  observacao TEXT,

  criado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Fotos opcionais
CREATE TABLE IF NOT EXISTS public.ordem_servico_fotos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  ordem_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,

  foto_url TEXT NOT NULL,
  storage_path TEXT,

  tipo TEXT DEFAULT 'execucao',

  enviado_por UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 5. Constraints seguras com DO para evitar duplicidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordens_servico_status_check'
  ) THEN
    ALTER TABLE public.ordens_servico
    ADD CONSTRAINT ordens_servico_status_check
    CHECK (
      status IN ('rascunho', 'agendado', 'pendente', 'em_andamento', 'pausado', 'concluido', 'cancelado')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordens_servico_prioridade_check'
  ) THEN
    ALTER TABLE public.ordens_servico
    ADD CONSTRAINT ordens_servico_prioridade_check
    CHECK (
      prioridade IN ('baixa', 'media', 'alta', 'urgente')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_servico_atualizacoes_tipo_check'
  ) THEN
    ALTER TABLE public.ordem_servico_atualizacoes
    ADD CONSTRAINT ordem_servico_atualizacoes_tipo_check
    CHECK (
      tipo IN ('comentario', 'mudanca_status', 'material', 'pausa', 'conclusao', 'observacao')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_servico_fotos_tipo_check'
  ) THEN
    ALTER TABLE public.ordem_servico_fotos
    ADD CONSTRAINT ordem_servico_fotos_tipo_check
    CHECK (
      tipo IN ('antes', 'durante', 'depois', 'execucao')
    );
  END IF;
END $$;

-- 6. Trigger de atualização
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ordens_servico_updated_at
ON public.ordens_servico;

CREATE TRIGGER set_ordens_servico_updated_at
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 7. Índices
CREATE INDEX IF NOT EXISTS idx_ordens_servico_condominio
ON public.ordens_servico (condominio_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_responsavel
ON public.ordens_servico (responsavel_id);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_status
ON public.ordens_servico (status);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_prioridade
ON public.ordens_servico (prioridade);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_categoria
ON public.ordens_servico (categoria);

CREATE INDEX IF NOT EXISTS idx_ordens_servico_data_agendada
ON public.ordens_servico (data_agendada);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_atualizacoes_ordem
ON public.ordem_servico_atualizacoes (ordem_id);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_materiais_ordem
ON public.ordem_servico_materiais (ordem_id);
```

---

# 29. RLS — Regras recomendadas

## 29.1 Regras gerais

```txt
super_admin vê tudo.
sindico vê e gerencia ordens do próprio condomínio.
zelador vê apenas ordens atribuídas a ele.
zelador atualiza apenas ordens atribuídas a ele.
morador não acessa.
```

## 29.2 Observação

Se o projeto já usa claims no JWT, considerar:

```sql
public.jwt_role()
public.jwt_condominio_id()
public.same_tenant(condominio_id)
public.is_super_admin()
```

Ou leitura direta:

```sql
auth.jwt() -> 'app_metadata' ->> 'role'
auth.jwt() -> 'app_metadata' ->> 'condominio_id'
```

---

# 30. RLS exemplo para `ordens_servico`

```sql
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sindico can manage tenant service orders"
ON public.ordens_servico
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

CREATE POLICY "Zelador can view assigned service orders"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR (
    public.jwt_role() = 'zelador'
    AND responsavel_id = auth.uid()
    AND public.same_tenant(condominio_id)
    AND public.jwt_ativo()
  )
);

CREATE POLICY "Zelador can update assigned service orders"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (
  public.jwt_role() = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
  AND public.jwt_ativo()
)
WITH CHECK (
  public.jwt_role() = 'zelador'
  AND responsavel_id = auth.uid()
  AND public.same_tenant(condominio_id)
  AND public.jwt_ativo()
);
```

---

# 31. Atualização necessária em roles

Adicionar `zelador` nos pontos do sistema que usam enum/check/tipagem de role.

## 31.1 Tipagem frontend

```ts
type UserRole =
  | "super_admin"
  | "sindico"
  | "morador"
  | "zelador"
  | "fornecedor";
```

## 31.2 Check constraint em `perfis.role`

Se existir constraint no banco, atualizar para aceitar:

```txt
zelador
```

Exemplo:

```sql
ALTER TABLE public.perfis
DROP CONSTRAINT IF EXISTS perfis_role_check;

ALTER TABLE public.perfis
ADD CONSTRAINT perfis_role_check
CHECK (
  role IN ('super_admin', 'sindico', 'morador', 'zelador', 'fornecedor')
);
```

---

# 32. Redirecionamento por role

Atualizar fluxo de login/callback:

```txt
super_admin → /painel-master
sindico     → /painel
morador     → /app
zelador     → /zelador
fornecedor  → /painel-fornecedor
```

## 32.1 Importante

O zelador não deve ser redirecionado para `/painel` principal do síndico.

O destino ideal é:

```txt
/zelador
```

---

# 33. Prompt para IDE

```text
@workspace
Atue como um Engenheiro de Software Sênior especialista em React, TypeScript, Supabase, RLS e SaaS multi-tenant.

Contexto:
O SaaS Condomínio Smart possui estrutura com:
- /portal para área pública
- /app para área do morador
- /painel para área administrativa do síndico
- /painel-master para super_admin

Agora vamos criar o módulo administrativo interno de Ordens de Serviço / Serviços do Zelador.

Objetivo:
Permitir que o síndico controle o que está sendo feito pelo zelador, acompanhe serviços agendados, registre materiais usados, custo, tempo de execução, local, status e gere indicadores para futuras assembleias.

Escopo:
- Síndico cria e gerencia ordens de serviço.
- Síndico designa ordens para zelador.
- Zelador acessa painel próprio e atualiza suas ordens.
- Morador não participa deste módulo no MVP.

Adicionar nova role:
- zelador

Roles finais:
- super_admin
- sindico
- morador
- zelador
- fornecedor

Rotas:
Para síndico:
- /painel/servicos
- /painel/servicos/nova
- /painel/servicos/:id
- /painel/servicos/agenda
- /painel/servicos/relatorios
- /painel/zeladores

Para zelador:
- /zelador
- /zelador/servicos
- /zelador/servicos/:id

Tarefas backend:
1. Criar migrations Supabase para:
   - ordens_servico
   - ordem_servico_atualizacoes
   - ordem_servico_materiais
   - ordem_servico_fotos, opcional
2. Adicionar constraints para:
   - status
   - prioridade
   - tipos de atualização
   - tipos de foto
3. Criar índices de performance.
4. Criar trigger de atualizado_em.
5. Atualizar perfis.role para aceitar zelador.
6. Atualizar custom claims/JWT para aceitar role zelador.
7. Criar ou ajustar RLS:
   - super_admin vê tudo;
   - sindico gerencia ordens do próprio condomínio;
   - zelador vê e atualiza apenas ordens atribuídas a ele;
   - morador não acessa.

Tarefas frontend:
1. Atualizar tipagem de roles incluindo zelador.
2. Atualizar ProtectedRoute e callback:
   - super_admin → /painel-master
   - sindico → /painel
   - morador → /app
   - zelador → /zelador
   - fornecedor → /painel-fornecedor
3. Criar telas do síndico:
   - listagem de ordens;
   - criação/edição;
   - detalhe;
   - agenda;
   - relatórios básicos;
   - gestão de zeladores.
4. Criar telas do zelador:
   - dashboard simples;
   - lista de serviços atribuídos;
   - detalhe da ordem;
   - botões Iniciar, Pausar, Adicionar feedback, Adicionar material, Concluir.
5. Não permitir acesso de morador a esse módulo.
6. Manter interface do zelador simples e mobile-first.

Indicadores:
- total de serviços;
- serviços por status;
- serviços por categoria;
- serviços por local;
- custo total por período;
- tempo médio de conclusão;
- materiais mais usados;
- serviços por zelador.

Não transformar este módulo em central de chamados aberta ao morador neste momento.
```

---

# 34. MVP recomendado

Para primeira versão, implementar:

```txt
Cadastro de zelador
Criação de ordem de serviço pelo síndico
Designação para zelador
Painel simples do zelador
Mudança de status
Feedback textual
Materiais usados
Custo real
Tempo real
Relatório básico
```

Deixar para depois:

```txt
Fotos
Recorrência automática
PDF de relatório
Calendário avançado
Notificações push
Aprovação em múltiplas etapas
Controle de estoque
```

---

# 35. Resumo final

O módulo de **Ordens de Serviço** é uma evolução importante para o SaaS Condomínio Smart porque entrega valor direto para o síndico.

Ele permite:

```txt
controle da rotina do zelador;
histórico dos serviços executados;
gestão de materiais;
controle de custos;
visibilidade sobre tarefas pendentes;
indicadores para assembleias;
prova de execução das manutenções;
organização operacional do condomínio.
```

A decisão mais importante do MVP é manter o fluxo fechado:

```txt
Síndico cria e controla.
Zelador executa e atualiza.
Morador não participa.
```

Isso mantém o módulo útil, simples, seguro e viável para implementação.
