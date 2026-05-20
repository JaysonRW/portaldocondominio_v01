# Plano de Aprimoramento da Landing Page — Condomínio Smart

## Objetivo do documento

Este documento reúne as melhorias recomendadas para a landing page atual do **Condomínio Smart**, com foco em conversão, clareza, usabilidade mobile-first e melhor coerência entre a proposta comercial da plataforma e a experiência visual apresentada ao visitante.

A proposta é melhorar a página pública de entrada sem alterar lógica de autenticação, banco de dados, rotas protegidas ou funcionalidades internas. O foco principal é **visual, copy, hierarquia de informação e experiência do usuário**.

---

## 1. Diagnóstico da landing page atual

A página atual possui uma base visual interessante, com bom contraste e identidade forte. Porém, ela ainda se comporta mais como uma seção hero institucional do que como uma landing page de conversão.

Hoje, a primeira dobra apresenta:

- Logo do condomínio/plataforma;
- Menu superior;
- Título principal: “Transforme a Gestão do seu Condomínio.”;
- Texto curto de apoio;
- Botão “Começar agora”;
- Um segundo botão visualmente quebrado ou sem texto aparente.

### Principais problemas identificados

1. **A proposta de valor ainda está genérica**  
   A frase atual comunica transformação, mas não deixa claro imediatamente qual dor real está sendo resolvida.

2. **A página não diferencia bem os públicos**  
   O visitante pode ser síndico, administradora ou morador. Hoje a página não orienta claramente cada perfil.

3. **No mobile falta um botão dedicado para login/acesso**  
   O morador que já pertence a um condomínio cadastrado precisa encontrar rapidamente onde entrar.

4. **A primeira dobra ocupa muito espaço no celular**  
   O título grande e o espaçamento fazem com que o visitante demore a visualizar os recursos reais da plataforma.

5. **O botão secundário está quebrado ou sem função visual clara**  
   Isso reduz confiança e prejudica a percepção profissional da plataforma.

6. **Os módulos reais da plataforma não aparecem cedo o suficiente**  
   A landing precisa mostrar rapidamente que o portal oferece comunicados, arquivos, guia do morador, clube de vantagens, eventos, galeria e FAQ.

---

## 2. Novo posicionamento recomendado

A landing precisa vender a plataforma como uma central simples, moderna e organizada para comunicação e informações do condomínio.

### Posicionamento sugerido

> **Condomínio Smart — o portal simples para comunicação e informações do seu condomínio.**

### Mensagem central

A plataforma deve ser percebida como uma solução que reduz a dependência de grupos de WhatsApp, mensagens perdidas, arquivos reenviados e dúvidas repetidas.

---

## 3. Nova copy principal da hero section

### Versão recomendada

```text
Seu condomínio ainda depende de grupos de WhatsApp para informar os moradores?

Organize comunicados, documentos, guia do morador, clube de vantagens e informações importantes em um portal simples, moderno e acessível pelo celular.
```

### Botões recomendados

```text
[Solicitar demonstração]
[Acessar meu condomínio]
```

### Por que essa copy é melhor?

A frase atual “Transforme a Gestão do seu Condomínio” é correta, mas genérica. A nova abordagem começa por uma dor concreta e reconhecível:

- comunicação espalhada;
- excesso de grupos;
- informações perdidas;
- dúvidas repetidas;
- dificuldade do morador em encontrar o que precisa.

Essa abertura cria identificação imediata tanto para síndicos quanto para moradores.

---

## 4. Estrutura ideal da nova landing page

A nova LP deve ser organizada em blocos de conversão, seguindo uma jornada simples:

1. Identificação da dor;
2. Apresentação da solução;
3. Explicação dos benefícios;
4. Demonstração dos recursos;
5. Segmentação por público;
6. Reforço de confiança;
7. Chamada para ação.

---

# Estrutura completa recomendada

---

## Seção 1 — Header mobile-first

### Objetivo

Permitir que síndicos, administradoras e moradores entendam onde estão e acessem rapidamente as ações principais.

### Desktop

Itens recomendados:

```text
Logo + Condomínio Smart
Início
Como funciona
Para síndicos
Para moradores
Contato
Entrar
Solicitar demonstração
```

### Mobile

O mobile precisa ter acesso rápido ao login.

Estrutura recomendada:

```text
[Logo]                         [Entrar] [Menu]
```

### Recomendações de UX

- O botão **Entrar** deve estar sempre visível no mobile.
- O menu hambúrguer deve abrir as demais opções.
- O botão “Entrar” deve levar para a rota de login respeitando o tenant atual.
- O header pode ser fixo ou semi-fixo no topo.
- Evitar excesso de links no mobile.

---

## Seção 2 — Hero section

### Objetivo

Explicar rapidamente a dor, a solução e a ação principal.

### Copy recomendada

```text
Seu condomínio ainda depende de grupos de WhatsApp para informar os moradores?

Organize comunicados, documentos, guia do morador, clube de vantagens e informações importantes em um portal simples, moderno e acessível pelo celular.
```

### CTAs recomendados

```text
[Solicitar demonstração]
[Acessar meu condomínio]
```

### Variação mais institucional

```text
O portal do condomínio que aproxima síndico e moradores.

Comunicados, documentos, guia do morador, clube de vantagens e informações importantes em um só lugar — sem depender de mensagens perdidas no WhatsApp.
```

### Ajustes visuais recomendados

- Reduzir o tamanho do título no mobile.
- Evitar que o hero ocupe a tela inteira no celular.
- Permitir que o início dos cards apareça parcialmente abaixo da dobra.
- Botões com altura mínima de 52px no mobile.
- Botões empilhados no mobile.
- Botões lado a lado no desktop.
- Corrigir ou remover o botão secundário quebrado.

### Layout mobile ideal

```text
[Logo]                         [Entrar] [☰]

Seu condomínio ainda depende de grupos de WhatsApp?

Organize comunicados, documentos e informações importantes em um portal simples para moradores.

[Solicitar demonstração]
[Acessar meu condomínio]

↓ início dos cards:
Comunicados | Arquivos | Guia
```

---

## Seção 3 — Cards rápidos de recursos

### Objetivo

Mostrar nos primeiros segundos o que existe dentro da plataforma.

### Título sugerido

```text
Tudo que o morador precisa encontrar, em poucos toques.
```

### Subtítulo sugerido

```text
Uma central simples para acessar informações importantes do condomínio sem procurar em conversas antigas.
```

### Cards recomendados

#### 1. Comunicados importantes

```text
Avisos oficiais do condomínio organizados em um só lugar.
```

#### 2. Arquivos e documentos

```text
Regimentos, atas, comunicados em PDF e documentos úteis sempre acessíveis.
```

#### 3. Guia do morador

```text
Informações práticas sobre o condomínio, contatos úteis e orientações essenciais.
```

#### 4. Clube de vantagens

```text
Benefícios, parceiros e promoções exclusivas para moradores.
```

#### 5. Eventos do condomínio

```text
Agenda de atividades, reuniões, campanhas e eventos internos.
```

#### 6. Dúvidas frequentes

```text
Respostas rápidas para perguntas comuns, reduzindo mensagens repetidas para o síndico.
```

### Recomendação visual

- Usar cards com fundo branco ou superfície clara.
- Aplicar ícones simples.
- Usar grid de 3 colunas no desktop.
- Usar 1 coluna ou carrossel horizontal no mobile.
- Manter bordas arredondadas e sombra leve.

---

## Seção 4 — Bloco de dor

### Objetivo

Fazer o visitante se identificar com o problema antes de apresentar mais recursos.

### Título sugerido

```text
Chega de informação espalhada.
```

### Texto sugerido

```text
Em muitos condomínios, comunicados ficam perdidos em grupos, documentos são enviados várias vezes, moradores perguntam sempre as mesmas coisas e o síndico perde tempo respondendo dúvidas repetidas.

Com o Condomínio Smart, cada condomínio ganha um portal próprio, organizado e fácil de acessar.
```

### Pontos de dor que podem aparecer em bullets

```text
- Comunicados perdidos em conversas antigas;
- Documentos enviados repetidamente;
- Moradores sem saber onde encontrar informações;
- Síndico sobrecarregado com perguntas recorrentes;
- Falta de uma central oficial de comunicação;
- Dificuldade para apresentar benefícios e parceiros aos moradores.
```

---

## Seção 5 — Para quem é a plataforma

### Objetivo

Separar claramente os públicos da landing.

### Título sugerido

```text
Uma plataforma pensada para quem administra e para quem mora.
```

### Card 1 — Para síndicos

```text
Publique comunicados, documentos, arquivos, parceiros e informações importantes em poucos cliques.

Ideal para reduzir dúvidas repetidas e melhorar a comunicação com os moradores.
```

### Card 2 — Para administradoras

```text
Ofereça uma experiência digital moderna para diferentes condomínios, com uma estrutura preparada para gestão multi-condomínio.

Mais organização, padronização e percepção de valor para os clientes atendidos.
```

### Card 3 — Para moradores

```text
Acesse avisos, documentos, guia do morador, benefícios, eventos e dúvidas frequentes direto pelo celular.

Informação simples, organizada e disponível quando precisar.
```

---

## Seção 6 — Demonstração visual do portal

### Objetivo

Dar percepção de produto real e facilitar entendimento do funcionamento.

### Título sugerido

```text
Uma experiência simples para o morador.
```

### Texto sugerido

```text
O morador acessa o portal do condomínio e encontra rapidamente as principais informações, sem precisar procurar mensagens antigas ou solicitar o mesmo arquivo várias vezes.
```

### Sugestão de mockup

Criar um mockup de celular com cards simulando:

```text
Último comunicado
Guia rápido
Arquivos importantes
Clube de vantagens
FAQ
```

### Observação

Não é necessário que esse mockup seja funcional nesta etapa. Pode ser um bloco visual estático, usando componentes já existentes.

---

## Seção 7 — Como funciona

### Objetivo

Explicar a jornada de adoção da plataforma em poucos passos.

### Título sugerido

```text
Como funciona na prática
```

### Passo 1

```text
1. O condomínio é cadastrado

Criamos o ambiente do condomínio com identidade visual, dados principais e módulos disponíveis.
```

### Passo 2

```text
2. O síndico publica os conteúdos

Comunicados, arquivos, guia do morador, parceiros, eventos e informações úteis são organizados no painel.
```

### Passo 3

```text
3. O morador acessa quando precisar

Tudo fica centralizado em um portal simples, seguro e pensado para uso no celular.
```

---

## Seção 8 — Recursos do painel do síndico

### Objetivo

Mostrar que a plataforma não é apenas uma página pública, mas possui gestão administrativa.

### Título sugerido

```text
Controle simples para o síndico manter tudo atualizado.
```

### Texto sugerido

```text
O painel administrativo permite que o síndico ou responsável pelo condomínio atualize os principais conteúdos do portal sem depender de alterações técnicas.
```

### Recursos que podem ser citados

```text
- Publicação de comunicados;
- Gestão de documentos e arquivos;
- Cadastro de itens do guia do morador;
- Cadastro de parceiros do clube de vantagens;
- Eventos e agenda do condomínio;
- Galeria de fotos;
- Perguntas frequentes;
- Gestão visual básica do condomínio.
```

### Cuidado de comunicação

Não destacar recursos sensíveis ou que possam gerar expectativa excessiva relacionada à LGPD. A landing deve focar na centralização de informações, comunicação e organização.

---

## Seção 9 — Clube de vantagens

### Objetivo

Mostrar um diferencial atrativo para moradores e síndicos.

### Título sugerido

```text
Mais valor percebido para os moradores.
```

### Texto sugerido

```text
Além de organizar informações, o condomínio pode divulgar parceiros, benefícios e promoções exclusivas para moradores, fortalecendo o relacionamento com empresas locais.
```

### Possíveis exemplos

```text
- Pet shops;
- Mercados;
- Academias;
- Restaurantes;
- Serviços domésticos;
- Assistências técnicas;
- Profissionais locais.
```

---

## Seção 10 — CTA final

### Objetivo

Encerrar a página com uma chamada forte para conversão.

### Título sugerido

```text
Pronto para modernizar a comunicação do seu condomínio?
```

### Texto sugerido

```text
Ofereça aos moradores uma central simples, organizada e acessível pelo celular.
```

### Botões

```text
[Quero uma demonstração]
[Já sou morador / acessar portal]
```

---

# Melhorias específicas para mobile

A landing precisa ser pensada primeiro para celular, pois muitos moradores acessarão por WhatsApp, QR Code, grupos internos ou links enviados pelo síndico.

## Ajustes recomendados

1. **Botão Entrar sempre visível no topo**  
   O morador não deve depender do menu para encontrar o acesso.

2. **Hero mais compacto**  
   Reduzir tamanho da headline e espaçamento vertical.

3. **CTAs empilhados**  
   Botões em largura total, com altura confortável.

4. **Cards com leitura rápida**  
   Títulos curtos, ícones e textos de no máximo duas linhas.

5. **Próxima seção aparecendo na primeira dobra**  
   O visitante precisa perceber que existe mais conteúdo abaixo.

6. **Evitar textos longos no topo**  
   Explicações maiores devem ficar nas seções seguintes.

7. **Menu simples**  
   Evitar excesso de links no menu mobile.

---

# Melhorias específicas para desktop

## Ajustes recomendados

1. **Hero com mais equilíbrio visual**  
   O título pode continuar forte, mas com apoio de mockup ou cards laterais.

2. **Mais uso de grid**  
   Cards e seções em 2 ou 3 colunas ajudam a transmitir maturidade SaaS.

3. **CTA destacado no header**  
   “Solicitar demonstração” deve estar sempre visível.

4. **Seções com respiro**  
   Usar alternância entre fundo escuro e fundo claro para organizar a leitura.

5. **Mockup do produto**  
   Uma visualização do portal aumenta muito a percepção de valor.

---

# Sugestão de hierarquia visual

## Cores

Não é necessário alterar a lógica de cores, já que o condomínio pode personalizar o tema. Porém, a estrutura visual deve funcionar bem com qualquer cor primária.

### Recomendações

- Usar a cor primária para CTAs principais.
- Usar branco ou tons claros para cards.
- Usar textos escuros em fundos claros.
- Usar textos brancos em fundos escuros.
- Evitar contraste insuficiente em botões secundários.

## Tipografia

### Recomendação

- Headline forte, mas menor no mobile.
- Subtítulo com boa leitura e largura controlada.
- Cards com títulos objetivos.
- Evitar textos extensos em caixas pequenas.

## Botões

### Botão principal

```text
Solicitar demonstração
```

Uso:

- Hero;
- Header desktop;
- CTA final.

### Botão secundário

```text
Acessar meu condomínio
```

Uso:

- Hero;
- Header mobile;
- CTA final.

### Estados visuais

- Hover no desktop;
- Active no mobile;
- Foco visível para acessibilidade;
- Altura mínima de 48px a 52px;
- Bordas arredondadas coerentes com o layout atual.

---

# Rotas e comportamento dos botões

A landing precisa respeitar se o usuário está em uma URL global ou em uma URL de tenant.

## Contexto global

Exemplo:

```text
/
```

### Botões recomendados

```text
Solicitar demonstração → formulário, WhatsApp ou seção de contato
Acessar meu condomínio → tela de busca/login ou /login
```

## Contexto com tenant

Exemplo:

```text
/:tenantSlug
```

### Botões recomendados

```text
Solicitar demonstração → contato comercial
Acessar meu condomínio → /:tenantSlug/login
```

ou, se o portal público for aberto:

```text
Acessar portal → /:tenantSlug/portal/comunicados
```

## Atenção

No ambiente Vercel, o tenant costuma ser usado via path. Portanto, os links precisam preservar o `tenantSlug` quando ele existir.

---

# O que evitar na landing

## Evitar prometer funcionalidades sensíveis

Como a proposta atual não é transformar a plataforma em um sistema completo de serviços sensíveis para moradores, evitar dar destaque para funcionalidades que possam gerar preocupação com LGPD ou expectativa operacional excessiva.

Evitar destaque excessivo para:

```text
- Dados sensíveis de moradores;
- Solicitações complexas com dados pessoais;
- Serviços que exijam gestão avançada de ocorrências;
- Informações privadas não necessárias para o portal;
- Promessas de controle total da vida condominial.
```

## Focar em

```text
- Comunicação;
- Organização;
- Centralização de informações;
- Documentos;
- Guia do morador;
- Benefícios;
- FAQ;
- Acesso mobile;
- Facilidade para o síndico atualizar conteúdos.
```

---

# Sugestão de conteúdo completo para a nova LP

Abaixo está uma versão completa de copy que pode ser usada como base na implementação.

---

## Hero

```text
Seu condomínio ainda depende de grupos de WhatsApp para informar os moradores?

Organize comunicados, documentos, guia do morador, clube de vantagens e informações importantes em um portal simples, moderno e acessível pelo celular.

[Solicitar demonstração]
[Acessar meu condomínio]
```

---

## Recursos principais

```text
Tudo que o morador precisa encontrar, em poucos toques.

Uma central simples para acessar informações importantes do condomínio sem procurar em conversas antigas.
```

### Cards

```text
Comunicados importantes
Avisos oficiais do condomínio organizados em um só lugar.

Arquivos e documentos
Regimentos, atas, comunicados em PDF e documentos úteis sempre acessíveis.

Guia do morador
Informações práticas sobre o condomínio, contatos úteis e orientações essenciais.

Clube de vantagens
Benefícios, parceiros e promoções exclusivas para moradores.

Eventos do condomínio
Agenda de atividades, reuniões, campanhas e eventos internos.

Dúvidas frequentes
Respostas rápidas para perguntas comuns, reduzindo mensagens repetidas para o síndico.
```

---

## Dor

```text
Chega de informação espalhada.

Em muitos condomínios, comunicados ficam perdidos em grupos, documentos são enviados várias vezes, moradores perguntam sempre as mesmas coisas e o síndico perde tempo respondendo dúvidas repetidas.

Com o Condomínio Smart, cada condomínio ganha um portal próprio, organizado e fácil de acessar.
```

---

## Para quem é

```text
Uma plataforma pensada para quem administra e para quem mora.
```

### Síndicos

```text
Publique comunicados, documentos, arquivos, parceiros e informações importantes em poucos cliques.

Ideal para reduzir dúvidas repetidas e melhorar a comunicação com os moradores.
```

### Administradoras

```text
Ofereça uma experiência digital moderna para diferentes condomínios, com uma estrutura preparada para gestão multi-condomínio.

Mais organização, padronização e percepção de valor para os clientes atendidos.
```

### Moradores

```text
Acesse avisos, documentos, guia do morador, benefícios, eventos e dúvidas frequentes direto pelo celular.

Informação simples, organizada e disponível quando precisar.
```

---

## Como funciona

```text
Como funciona na prática
```

### Passo 1

```text
O condomínio é cadastrado
Criamos o ambiente do condomínio com identidade visual, dados principais e módulos disponíveis.
```

### Passo 2

```text
O síndico publica os conteúdos
Comunicados, arquivos, guia do morador, parceiros, eventos e informações úteis são organizados no painel.
```

### Passo 3

```text
O morador acessa quando precisar
Tudo fica centralizado em um portal simples, seguro e pensado para uso no celular.
```

---

## Painel do síndico

```text
Controle simples para o síndico manter tudo atualizado.

O painel administrativo permite que o síndico ou responsável pelo condomínio atualize os principais conteúdos do portal sem depender de alterações técnicas.
```

### Recursos

```text
- Comunicados;
- Arquivos e documentos;
- Guia do morador;
- Clube de vantagens;
- Eventos;
- Galeria;
- FAQ;
- Configurações visuais do condomínio.
```

---

## CTA final

```text
Pronto para modernizar a comunicação do seu condomínio?

Ofereça aos moradores uma central simples, organizada e acessível pelo celular.

[Quero uma demonstração]
[Já sou morador / acessar portal]
```

---

# Checklist de implementação visual

## Prioridade alta

```text
[ ] Corrigir botão secundário quebrado na hero.
[ ] Adicionar botão “Entrar” visível no mobile.
[ ] Trocar headline principal por uma mensagem orientada à dor.
[ ] Adicionar CTA “Solicitar demonstração”.
[ ] Adicionar CTA “Acessar meu condomínio”.
[ ] Reduzir altura da hero no mobile.
[ ] Criar seção de cards com recursos reais da plataforma.
[ ] Criar seção “Para síndicos, administradoras e moradores”.
[ ] Criar CTA final.
```

## Prioridade média

```text
[ ] Adicionar mockup visual do portal do morador.
[ ] Criar seção “Como funciona”.
[ ] Criar seção destacando o painel do síndico.
[ ] Melhorar grid desktop.
[ ] Melhorar espaçamentos e contraste entre seções.
[ ] Adicionar microinterações simples nos cards e botões.
```

## Prioridade baixa

```text
[ ] Adicionar depoimentos no futuro.
[ ] Adicionar prints reais do painel após estabilizar o visual.
[ ] Adicionar seção de planos apenas quando o modelo comercial estiver definido.
[ ] Adicionar FAQ comercial da solução.
```

---

# Componentes sugeridos para a landing

A implementação pode ser organizada em componentes para facilitar manutenção.

```text
LandingHeader
HeroSection
FeatureCardsSection
PainPointSection
AudienceSection
ProductPreviewSection
HowItWorksSection
AdminPanelSection
FinalCTASection
LandingFooter
```

---

# Sugestão de ordem no arquivo landing.tsx

```tsx
export default function LandingPage() {
  return (
    <main>
      <LandingHeader />
      <HeroSection />
      <FeatureCardsSection />
      <PainPointSection />
      <AudienceSection />
      <ProductPreviewSection />
      <HowItWorksSection />
      <AdminPanelSection />
      <FinalCTASection />
      <LandingFooter />
    </main>
  )
}
```

---

# Recomendações finais

A nova landing deve deixar de parecer apenas uma página bonita e passar a funcionar como uma página de venda clara, objetiva e orientada à dor real dos condomínios.

A principal mudança não é visual, mas estratégica: a página precisa fazer o visitante pensar:

```text
“É exatamente isso que meu condomínio precisa.”
```

Para isso, a LP deve comunicar rapidamente:

```text
- O problema: informações espalhadas e comunicação confusa;
- A solução: portal simples e organizado;
- Os recursos: comunicados, arquivos, guia, clube, eventos e FAQ;
- Os públicos: síndicos, administradoras e moradores;
- A ação: solicitar demonstração ou acessar o condomínio.
```

Com essas mudanças, a landing tende a ficar mais clara, mais forte para conversão e mais coerente com a proposta real do Condomínio Smart.
