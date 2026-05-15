# Plano do Módulo de Vantagens — Morador Empreendedor e Parceiro Oficial

## SaaS Condomínio Smart

Este documento consolida a proposta para evoluir o módulo **Vantagens / Clube de Vantagens** do SaaS Condomínio Smart, com foco em promover:

- ofertas de parceiros oficiais;
- produtos e serviços de moradores;
- comércio interno do condomínio;
- divulgação de negócios locais;
- credibilidade visual para quem anuncia;
- futura monetização do módulo.

A proposta **não é criar um marketplace completo neste momento**.  
A proposta é criar uma **vitrine interna de ofertas**, com cards bem identificados e fluxo simples de contato.

---

# 1. Conceito do módulo

O módulo deve continuar usando o nome principal:

```txt
Vantagens
```

Dentro da página, os anúncios devem ser organizados em dois grupos principais:

```txt
Parceiros Oficiais
Moradores Empreendedores
```

## 1.1 Posicionamento recomendado

```txt
Ofertas exclusivas, parceiros selecionados e negócios de moradores do condomínio.
```

## 1.2 O que este módulo é

```txt
Uma vitrine interna de produtos, serviços, benefícios e ofertas para moradores.
```

## 1.3 O que este módulo não é neste momento

```txt
Não é marketplace com pagamento online.
Não é carrinho de compras.
Não é sistema de intermediação financeira.
Não é sistema de garantia de serviço.
Não é sistema de entrega.
```

A contratação, pagamento e execução do serviço devem acontecer diretamente entre morador interessado e anunciante.

---

# 2. Selos oficiais dos cards

Serão usados apenas dois selos principais:

```txt
MORADOR EMPREENDEDOR
PARCEIRO OFICIAL
```

## 2.1 Selo: MORADOR EMPREENDEDOR

Usar quando o anúncio for publicado por um morador aprovado/verificado do condomínio.

Exemplo visual:

```txt
[MORADOR EMPREENDEDOR]
```

## 2.2 Selo: PARCEIRO OFICIAL

Usar quando o anúncio for de uma empresa/parceiro cadastrado como parceiro comercial do condomínio ou da plataforma.

Exemplo visual:

```txt
[PARCEIRO OFICIAL]
```

---

# 3. Texto abaixo do nome do anúncio

Quando o card tiver o selo:

```txt
MORADOR EMPREENDEDOR
```

exibir abaixo do nome do negócio:

```txt
Oferta publicada por morador verificado
```

## 3.1 Regra importante

Esse texto deve aparecer **somente** quando o anúncio for do tipo morador.

Exemplo:

```txt
Propagou Negócios
Oferta publicada por morador verificado
```

Para parceiros oficiais, não exibir esse texto.  
O selo `PARCEIRO OFICIAL` já será suficiente.

---

# 4. Botões dos cards

Todos os cards podem ter os seguintes botões:

```txt
Falar no WhatsApp
Ver oferta
```

## 4.1 Botão: Falar no WhatsApp

Deve abrir o WhatsApp do anunciante.

Texto:

```txt
Falar no WhatsApp
```

## 4.2 Botão: Ver oferta

Deve abrir uma página/modal de detalhes da oferta.

Texto:

```txt
Ver oferta
```

## 4.3 Comportamento recomendado

Se houver link externo/site cadastrado, o botão `Ver oferta` pode abrir:

```txt
link_site
```

Se não houver link externo, o botão pode abrir uma página interna ou modal com detalhes completos da oferta.

---

# 5. Filtros da página

Adicionar filtros no topo da página de vantagens.

Filtros recomendados:

```txt
Todos | Parceiros | Moradores | Serviços | Produtos
```

## 5.1 Regras dos filtros

### Todos

Mostra todos os anúncios ativos e aprovados.

### Parceiros

Mostra apenas anúncios com:

```txt
tipo_anunciante = parceiro_oficial
```

### Moradores

Mostra apenas anúncios com:

```txt
tipo_anunciante = morador
```

### Serviços

Mostra anúncios com:

```txt
tipo_oferta = servico
```

### Produtos

Mostra anúncios com:

```txt
tipo_oferta = produto
```

---

# 6. Ajustes recomendados no layout dos cards

## 6.1 Estrutura visual do card

Cada card deve exibir:

```txt
Imagem/banner
Selo do anúncio
Categoria ou desconto_info
Nome do negócio
Texto de verificação, se for morador
Descrição
Botão Falar no WhatsApp
Botão Ver oferta
```

## 6.2 Exemplo de card para morador

```txt
[MORADOR EMPREENDEDOR]

Propagou Negócios
Oferta publicada por morador verificado

Sites, landing pages e plataformas para moradores do condomínio com condição exclusiva.

[Falar no WhatsApp] [Ver oferta]
```

## 6.3 Exemplo de card para parceiro

```txt
[PARCEIRO OFICIAL]

Ottos Pet Store

Promoção especial para serviços de banho, tosa e produtos pet para moradores do condomínio.

[Falar no WhatsApp] [Ver oferta]
```

---

# 7. Campos atuais da tabela existente

Tabela atual:

```sql
create table public.clube_parceiros (
  id uuid not null default extensions.uuid_generate_v4 (),
  condominio_id uuid null,
  nome character varying(255) not null,
  descricao text not null,
  desconto_info character varying(255) not null,
  logo_url text null,
  link_site text null,
  ativo boolean null default true,
  criado_em timestamp with time zone null default now(),
  whatapp_parceiro text null,
  constraint clube_parceiros_pkey primary key (id),
  constraint clube_parceiros_condominio_id_fkey foreign KEY (condominio_id) references condominios (id) on delete CASCADE
) TABLESPACE pg_default;
```

---

# 8. Novos campos recomendados

Como a tabela `clube_parceiros` já existe, a recomendação é adicionar campos sem quebrar os dados atuais.

## 8.1 Campos novos

```txt
tipo_anunciante
tipo_oferta
categoria
titulo_oferta
imagem_banner_url
instagram_url
selo
destaque
status
visibilidade
data_inicio
data_fim
criado_por
atualizado_em
observacoes_admin
```

## 8.2 Explicação dos campos

### tipo_anunciante

Identifica se o anúncio é de parceiro ou morador.

Valores recomendados:

```txt
parceiro_oficial
morador
```

### tipo_oferta

Ajuda nos filtros de Serviços e Produtos.

Valores recomendados:

```txt
servico
produto
beneficio
outro
```

### categoria

Categoria comercial do anúncio.

Exemplos:

```txt
Pet Shop
Marketing Digital
Confeitaria
Beleza
Manutenção
Aulas
Consultoria
Alimentação
Saúde e Bem-estar
```

### titulo_oferta

Título curto da oferta.

Exemplo:

```txt
20% de desconto para moradores
```

### imagem_banner_url

Imagem principal/banner do anúncio.

Atualmente a tabela tem `logo_url`, mas na prática o layout usa imagens maiores.  
Esse campo deixa mais claro o uso visual do card.

### instagram_url

Link para Instagram do anunciante.

### selo

Define o selo exibido no card.

Valores recomendados:

```txt
morador_empreendedor
parceiro_oficial
```

### destaque

Define se o anúncio deve aparecer com prioridade.

```txt
true
false
```

### status

Controle de publicação e aprovação.

Valores recomendados:

```txt
rascunho
em_analise
aprovado
recusado
pausado
expirado
```

### visibilidade

Controle de exibição.

Valores recomendados:

```txt
publico
moradores
administrativo
```

### data_inicio

Data inicial de exibição da oferta.

### data_fim

Data final de exibição da oferta.

### criado_por

Usuário que criou o anúncio.

Útil para identificar o morador anunciante ou admin responsável.

### atualizado_em

Data da última atualização.

### observacoes_admin

Campo interno para análise, recusa ou observações administrativas.

---

# 9. Query SQL para adicionar os novos campos

Executar no SQL Editor do Supabase.

```sql
ALTER TABLE public.clube_parceiros
ADD COLUMN IF NOT EXISTS tipo_anunciante TEXT DEFAULT 'parceiro_oficial',
ADD COLUMN IF NOT EXISTS tipo_oferta TEXT DEFAULT 'servico',
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS titulo_oferta TEXT,
ADD COLUMN IF NOT EXISTS imagem_banner_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS selo TEXT DEFAULT 'parceiro_oficial',
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aprovado',
ADD COLUMN IF NOT EXISTS visibilidade TEXT DEFAULT 'moradores',
ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS observacoes_admin TEXT;
```

---

# 10. Constraints recomendadas

Após validar que os dados existentes estão corretos, adicionar constraints para evitar valores inválidos.

```sql
ALTER TABLE public.clube_parceiros
ADD CONSTRAINT clube_parceiros_tipo_anunciante_check
CHECK (
  tipo_anunciante IN ('parceiro_oficial', 'morador')
);

ALTER TABLE public.clube_parceiros
ADD CONSTRAINT clube_parceiros_tipo_oferta_check
CHECK (
  tipo_oferta IN ('servico', 'produto', 'beneficio', 'outro')
);

ALTER TABLE public.clube_parceiros
ADD CONSTRAINT clube_parceiros_selo_check
CHECK (
  selo IN ('morador_empreendedor', 'parceiro_oficial')
);

ALTER TABLE public.clube_parceiros
ADD CONSTRAINT clube_parceiros_status_check
CHECK (
  status IN ('rascunho', 'em_analise', 'aprovado', 'recusado', 'pausado', 'expirado')
);

ALTER TABLE public.clube_parceiros
ADD CONSTRAINT clube_parceiros_visibilidade_check
CHECK (
  visibilidade IN ('publico', 'moradores', 'administrativo')
);
```

## 10.1 Observação importante

Se já existirem dados inconsistentes, as constraints podem falhar.

Nesse caso, antes de aplicar as constraints, rode:

```sql
UPDATE public.clube_parceiros
SET tipo_anunciante = 'parceiro_oficial'
WHERE tipo_anunciante IS NULL
   OR tipo_anunciante NOT IN ('parceiro_oficial', 'morador');

UPDATE public.clube_parceiros
SET tipo_oferta = 'servico'
WHERE tipo_oferta IS NULL
   OR tipo_oferta NOT IN ('servico', 'produto', 'beneficio', 'outro');

UPDATE public.clube_parceiros
SET selo = 'parceiro_oficial'
WHERE selo IS NULL
   OR selo NOT IN ('morador_empreendedor', 'parceiro_oficial');

UPDATE public.clube_parceiros
SET status = 'aprovado'
WHERE status IS NULL
   OR status NOT IN ('rascunho', 'em_analise', 'aprovado', 'recusado', 'pausado', 'expirado');

UPDATE public.clube_parceiros
SET visibilidade = 'moradores'
WHERE visibilidade IS NULL
   OR visibilidade NOT IN ('publico', 'moradores', 'administrativo');
```

---

# 11. Trigger para atualizado_em

Criar função genérica, caso ainda não exista no projeto:

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

Criar trigger:

```sql
DROP TRIGGER IF EXISTS set_clube_parceiros_updated_at
ON public.clube_parceiros;

CREATE TRIGGER set_clube_parceiros_updated_at
BEFORE UPDATE ON public.clube_parceiros
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
```

---

# 12. Índices recomendados

Para melhorar filtros e listagens:

```sql
CREATE INDEX IF NOT EXISTS idx_clube_parceiros_condominio
ON public.clube_parceiros (condominio_id);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_tipo_anunciante
ON public.clube_parceiros (tipo_anunciante);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_tipo_oferta
ON public.clube_parceiros (tipo_oferta);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_status
ON public.clube_parceiros (status);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_ativo_status
ON public.clube_parceiros (ativo, status);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_destaque
ON public.clube_parceiros (destaque);
```

---

# 13. Query completa recomendada

Se quiser aplicar tudo em sequência, use este bloco no Supabase.

```sql
-- ============================================================
-- Clube de Vantagens: Morador Empreendedor e Parceiro Oficial
-- Supabase/PostgreSQL
-- ============================================================

ALTER TABLE public.clube_parceiros
ADD COLUMN IF NOT EXISTS tipo_anunciante TEXT DEFAULT 'parceiro_oficial',
ADD COLUMN IF NOT EXISTS tipo_oferta TEXT DEFAULT 'servico',
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS titulo_oferta TEXT,
ADD COLUMN IF NOT EXISTS imagem_banner_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS selo TEXT DEFAULT 'parceiro_oficial',
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aprovado',
ADD COLUMN IF NOT EXISTS visibilidade TEXT DEFAULT 'moradores',
ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS criado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS observacoes_admin TEXT;

UPDATE public.clube_parceiros
SET tipo_anunciante = 'parceiro_oficial'
WHERE tipo_anunciante IS NULL
   OR tipo_anunciante NOT IN ('parceiro_oficial', 'morador');

UPDATE public.clube_parceiros
SET tipo_oferta = 'servico'
WHERE tipo_oferta IS NULL
   OR tipo_oferta NOT IN ('servico', 'produto', 'beneficio', 'outro');

UPDATE public.clube_parceiros
SET selo = 'parceiro_oficial'
WHERE selo IS NULL
   OR selo NOT IN ('morador_empreendedor', 'parceiro_oficial');

UPDATE public.clube_parceiros
SET status = 'aprovado'
WHERE status IS NULL
   OR status NOT IN ('rascunho', 'em_analise', 'aprovado', 'recusado', 'pausado', 'expirado');

UPDATE public.clube_parceiros
SET visibilidade = 'moradores'
WHERE visibilidade IS NULL
   OR visibilidade NOT IN ('publico', 'moradores', 'administrativo');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clube_parceiros_tipo_anunciante_check'
  ) THEN
    ALTER TABLE public.clube_parceiros
    ADD CONSTRAINT clube_parceiros_tipo_anunciante_check
    CHECK (tipo_anunciante IN ('parceiro_oficial', 'morador'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clube_parceiros_tipo_oferta_check'
  ) THEN
    ALTER TABLE public.clube_parceiros
    ADD CONSTRAINT clube_parceiros_tipo_oferta_check
    CHECK (tipo_oferta IN ('servico', 'produto', 'beneficio', 'outro'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clube_parceiros_selo_check'
  ) THEN
    ALTER TABLE public.clube_parceiros
    ADD CONSTRAINT clube_parceiros_selo_check
    CHECK (selo IN ('morador_empreendedor', 'parceiro_oficial'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clube_parceiros_status_check'
  ) THEN
    ALTER TABLE public.clube_parceiros
    ADD CONSTRAINT clube_parceiros_status_check
    CHECK (status IN ('rascunho', 'em_analise', 'aprovado', 'recusado', 'pausado', 'expirado'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clube_parceiros_visibilidade_check'
  ) THEN
    ALTER TABLE public.clube_parceiros
    ADD CONSTRAINT clube_parceiros_visibilidade_check
    CHECK (visibilidade IN ('publico', 'moradores', 'administrativo'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_clube_parceiros_updated_at
ON public.clube_parceiros;

CREATE TRIGGER set_clube_parceiros_updated_at
BEFORE UPDATE ON public.clube_parceiros
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_condominio
ON public.clube_parceiros (condominio_id);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_tipo_anunciante
ON public.clube_parceiros (tipo_anunciante);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_tipo_oferta
ON public.clube_parceiros (tipo_oferta);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_status
ON public.clube_parceiros (status);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_ativo_status
ON public.clube_parceiros (ativo, status);

CREATE INDEX IF NOT EXISTS idx_clube_parceiros_destaque
ON public.clube_parceiros (destaque);
```

---

# 14. Consulta para listar anúncios ativos

Consulta base para carregar a página de vantagens:

```sql
SELECT *
FROM public.clube_parceiros
WHERE condominio_id = :condominio_id
  AND ativo = true
  AND status = 'aprovado'
  AND (
    data_inicio IS NULL OR data_inicio <= now()
  )
  AND (
    data_fim IS NULL OR data_fim >= now()
  )
ORDER BY destaque DESC, criado_em DESC;
```

---

# 15. Regra de exibição do card no frontend

## 15.1 Selo

```ts
const seloLabel = parceiro.selo === "morador_empreendedor"
  ? "MORADOR EMPREENDEDOR"
  : "PARCEIRO OFICIAL";
```

## 15.2 Texto abaixo do nome

```tsx
{parceiro.selo === "morador_empreendedor" && (
  <p>Oferta publicada por morador verificado</p>
)}
```

## 15.3 Botões

```txt
Falar no WhatsApp
Ver oferta
```

## 15.4 Filtros

```txt
Todos
Parceiros
Moradores
Serviços
Produtos
```

Mapeamento:

```ts
Todos     -> sem filtro extra
Parceiros -> tipo_anunciante === "parceiro_oficial"
Moradores -> tipo_anunciante === "morador"
Serviços  -> tipo_oferta === "servico"
Produtos  -> tipo_oferta === "produto"
```

---

# 16. Texto de proteção recomendado

Adicionar no rodapé da página ou dentro da página de detalhes da oferta:

```txt
As ofertas são divulgadas por parceiros e moradores cadastrados. A contratação, pagamento e execução dos serviços são de responsabilidade direta entre anunciante e interessado.
```

Para morador empreendedor:

```txt
Morador verificado significa que o anunciante possui cadastro aprovado no condomínio. Isso não representa garantia comercial, técnica ou financeira sobre o produto ou serviço anunciado.
```

---

# 17. Prompt para IDE

```text
@workspace
Atue como um Engenheiro de Software Sênior especialista em React, TypeScript, Supabase e SaaS multi-tenant.

Contexto:
O módulo atual de Vantagens usa a tabela public.clube_parceiros.
Queremos evoluir esse módulo para diferenciar anúncios de:
- moradores empreendedores;
- parceiros oficiais.

Não criar marketplace completo.
Não implementar pagamento, carrinho, checkout ou comissão neste momento.
O objetivo é criar uma vitrine interna de ofertas.

Regras visuais:
- Usar somente os selos:
  MORADOR EMPREENDEDOR
  PARCEIRO OFICIAL
- Abaixo do nome do anúncio, exibir:
  "Oferta publicada por morador verificado"
  somente quando o selo/tipo for de morador.
- Botões dos cards:
  "Falar no WhatsApp"
  "Ver oferta"
- Filtros no topo:
  Todos | Parceiros | Moradores | Serviços | Produtos

Banco:
A tabela existente é public.clube_parceiros.
Adicionar suporte aos novos campos:
- tipo_anunciante
- tipo_oferta
- categoria
- titulo_oferta
- imagem_banner_url
- instagram_url
- selo
- destaque
- status
- visibilidade
- data_inicio
- data_fim
- criado_por
- atualizado_em
- observacoes_admin

Tarefas:
1. Atualizar types/interfaces do frontend para refletir os novos campos.
2. Atualizar a consulta Supabase para buscar apenas:
   ativo = true
   status = aprovado
   ofertas dentro do período data_inicio/data_fim, quando preenchidos.
3. Implementar filtros:
   Todos
   Parceiros
   Moradores
   Serviços
   Produtos
4. Atualizar o card visual:
   - selo no topo da imagem/card;
   - nome;
   - texto "Oferta publicada por morador verificado" apenas para morador;
   - descrição;
   - botões "Falar no WhatsApp" e "Ver oferta".
5. Criar ou ajustar página/modal de detalhes para "Ver oferta".
6. Não alterar o posicionamento do produto para marketplace.
7. Manter o módulo como Vitrine Interna / Clube de Vantagens.
```

---

# 18. Resumo final

A evolução recomendada é transformar o módulo atual em uma **vitrine interna de ofertas**, separando claramente:

```txt
Parceiro Oficial
Morador Empreendedor
```

Com isso, o SaaS ganha um módulo com potencial comercial, mas sem assumir a complexidade e os riscos de um marketplace completo.

A primeira versão deve focar em:

```txt
cards bem identificados;
filtros simples;
botões diretos;
credibilidade para morador anunciante;
controle de status;
possibilidade futura de destaque e monetização.
```
