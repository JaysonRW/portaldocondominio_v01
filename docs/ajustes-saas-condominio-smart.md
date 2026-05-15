# Documento de Ajustes e Soluções — SaaS Condomínio Smart

## Versão revisada com foco em portal informativo para condomínios

Este documento reúne os ajustes recomendados para o projeto **SaaS Condomínio Smart**, considerando a nova definição estratégica:

> O sistema não será um substituto completo do aplicativo oficial do condomínio.  
> O foco será ser um **portal informativo, institucional e de comunicação**, mantendo moradores atualizados sobre comunicados, assembleias, avisos, eventos, clube de vantagens, galeria, FAQ e links úteis.

---

# 1. Posicionamento correto do produto

## 1.1 Objetivo principal

O **SaaS Condomínio Smart** deve ser posicionado como um portal digital para condomínios, com foco em:

- comunicação clara com moradores;
- atualização rápida de avisos;
- divulgação de assembleias;
- publicação de comunicados;
- organização de informações úteis;
- fortalecimento da transparência;
- acesso facilitado a conteúdos do condomínio;
- direcionamento para o aplicativo oficial quando necessário.

## 1.2 O que o sistema não será neste momento

O projeto **não deve tentar substituir** sistemas nativos ou aplicativos oficiais do condomínio que já fazem operações internas mais sensíveis.

Portanto, neste momento, o SaaS não precisa incluir:

- reserva de salão de festas;
- reserva de churrasqueira;
- reserva de quadra ou espaços internos;
- boletos;
- prestação de contas;
- demonstrativos financeiros;
- documentos fiscais;
- documentos jurídicos sensíveis;
- gestão completa de inadimplência;
- controle operacional interno avançado.

## 1.3 Nova proposta de valor

A proposta deve ser:

> Um portal moderno, leve e personalizável para manter moradores informados, centralizar comunicados importantes e melhorar a comunicação digital do condomínio.

---

# 2. Ajuste estratégico importante

A partir desta nova visão, o sistema deve deixar claro para o usuário que algumas ações continuam sendo feitas no aplicativo oficial do condomínio.

Exemplo de mensagem:

> Para reservas de espaços, boletos, documentos oficiais ou solicitações internas, acesse o aplicativo oficial do condomínio.

Essa orientação pode aparecer em cards estratégicos dentro do portal e da área do morador.

---

# 3. Estrutura recomendada de ambientes

A estrutura ideal passa a ser dividida em três áreas:

```txt
Portal público
Área informativa do morador
Painel administrativo
```

## 3.1 Portal público

Área acessível sem login, usada para apresentar informações institucionais e conteúdos públicos do condomínio.

Exemplos:

```txt
/
/portal/comunicados
/portal/assembleias
/portal/eventos
/portal/galeria
/portal/clube
/portal/faq
/portal/app-oficial
/join
/login
```

## 3.2 Área do morador

Área logada, mas ainda com foco informativo.

Exemplos:

```txt
/app
/app/comunicados
/app/assembleias
/app/avisos
/app/eventos
/app/galeria
/app/clube
/app/faq
/app/app-oficial
/app/perfil
```

## 3.3 Painel administrativo

Área para síndico, subsíndico, administradores e equipe autorizada gerenciarem o conteúdo do portal.

Exemplos:

```txt
/painel
/painel/comunicados
/painel/assembleias
/painel/avisos
/painel/eventos
/painel/galeria
/painel/clube
/painel/faq
/painel/moradores
/painel/configuracoes
```

## 3.4 Painel master

Área global da plataforma.

Exemplos:

```txt
/master
/painel-master
/painel-master/condominios
/painel-master/usuarios
/painel-master/planos
```

---

# 4. Correção das rotas conflitantes

## 4.1 Problema identificado

No documento original, algumas rotas públicas e privadas compartilhavam o mesmo caminho:

```txt
/documentos
/clube
/eventos
/galeria
/faq
```

Isso pode gerar conflito de navegação, confusão de permissão e dificuldade de manutenção.

## 4.2 Solução recomendada

Separar rotas públicas, rotas do morador e rotas administrativas.

### Rotas públicas

```txt
/portal/comunicados
/portal/assembleias
/portal/eventos
/portal/galeria
/portal/clube
/portal/faq
/portal/app-oficial
```

### Rotas do morador

```txt
/app/comunicados
/app/assembleias
/app/avisos
/app/eventos
/app/galeria
/app/clube
/app/faq
/app/app-oficial
```

### Rotas administrativas

```txt
/painel/comunicados
/painel/assembleias
/painel/avisos
/painel/eventos
/painel/galeria
/painel/clube
/painel/faq
/painel/moradores
/painel/configuracoes
```

## 4.3 Benefício

Essa separação deixa o projeto mais limpo, mais seguro e mais fácil de evoluir.

---

# 5. Ajuste no módulo de documentos

## 5.1 Nova definição

O módulo de documentos não será usado para documentos sensíveis, boletos, prestação de contas ou arquivos fiscais.

O foco deve ser apenas em conteúdos informativos, como:

- avisos em PDF;
- chamadas para assembleias;
- circulares;
- comunicados em anexo;
- regulamentos públicos ou informativos;
- materiais de orientação;
- comunicados gerais para moradores.

## 5.2 Renomear “Documentos”

Para evitar interpretação errada, recomenda-se não usar o nome genérico **Documentos** como módulo principal.

Sugestões melhores:

```txt
Comunicados em PDF
Arquivos Informativos
Avisos e Circulares
Materiais Informativos
Anexos de Comunicados
```

Minha recomendação:

```txt
Arquivos Informativos
```

Porque deixa claro que não se trata de documentos oficiais sensíveis.

## 5.3 Nova rota recomendada

Em vez de:

```txt
/documentos
/painel/documentos
```

Usar:

```txt
/portal/arquivos
/app/arquivos
/painel/arquivos
```

Ou, se quiser manter o termo mais próximo do usuário:

```txt
/portal/avisos-e-circulares
/app/avisos-e-circulares
/painel/avisos-e-circulares
```

## 5.4 Campos sugeridos para a tabela

Tabela sugerida:

```sql
arquivos_informativos (
  id UUID PRIMARY KEY,
  condominio_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  arquivo_url TEXT,
  storage_path TEXT,
  visibilidade TEXT DEFAULT 'moradores',
  publicado BOOLEAN DEFAULT true,
  criado_por UUID,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
)
```

## 5.5 Visibilidade

Mesmo não sendo documentos sensíveis, ainda é útil ter controle de visibilidade:

```txt
publico
moradores
administrativo
```

Exemplo:

- chamada pública de assembleia: `publico` ou `moradores`;
- aviso interno: `moradores`;
- rascunho administrativo: `administrativo`.

---

# 6. Remoção da melhoria de reservas internas

## 6.1 Ajuste solicitado

Como o sistema não terá reserva de espaços internos, a melhoria de agendamento/reservas deve ser retirada do escopo principal.

Portanto, não é necessário implementar agora:

- horários por espaço;
- bloqueio de sobreposição;
- regras de reserva;
- aprovação de reserva;
- limite por unidade;
- calendário de espaços internos.

## 6.2 O que fazer no lugar

Criar um card fixo informativo direcionando o usuário para o aplicativo oficial do condomínio.

Exemplo:

```txt
Reservas de espaços

Para reservar salão de festas, churrasqueira, quadra ou outros espaços internos,
acesse o aplicativo oficial do condomínio.

[ Acessar aplicativo oficial ]
```

## 6.3 Onde esse card deve aparecer

Recomendado exibir em:

```txt
/app
/app/app-oficial
/portal/app-oficial
```

Opcionalmente, pode aparecer também na landing do condomínio.

---

# 7. Card “Acesse o aplicativo oficial”

## 7.1 Objetivo

Esse card deve evitar que o morador tente fazer no portal ações que pertencem ao app oficial do condomínio.

## 7.2 Texto recomendado do card

```txt
Acesse o aplicativo oficial do condomínio

Para reservas de espaços, boletos, documentos oficiais, solicitações internas
ou serviços administrativos, utilize o aplicativo oficial do condomínio.

Este portal é destinado à comunicação, avisos, assembleias, eventos e informações úteis.

[ Acessar aplicativo oficial ]
```

## 7.3 Versão curta

```txt
Precisa acessar reservas, boletos ou documentos oficiais?

Use o aplicativo oficial do condomínio para serviços internos e solicitações administrativas.

[ Acessar aplicativo oficial ]
```

## 7.4 Configuração no painel

No painel administrativo, criar campos em configurações do condomínio:

```txt
Nome do aplicativo oficial
URL do aplicativo oficial
Texto personalizado do card
Exibir card na home pública
Exibir card na área do morador
Exibir card no menu
```

## 7.5 Campos sugeridos em `condominios`

```sql
app_oficial_nome TEXT,
app_oficial_url TEXT,
app_oficial_descricao TEXT,
exibir_card_app_oficial BOOLEAN DEFAULT true
```

---

# 8. Ajuste no fluxo do morador

## 8.1 Problema original

O documento original indicava que o morador poderia cair na home pública depois do login.

Isso pode parecer que o login não funcionou.

## 8.2 Solução recomendada

Após o login, o morador aprovado deve ir para:

```txt
/app
```

E não para:

```txt
/
```

## 8.3 Redirecionamento recomendado por perfil

```txt
super_admin        → /painel-master
sindico            → /painel
subsindico         → /painel
zelador            → /painel
morador aprovado   → /app
morador pendente   → /aguardando-aprovacao
perfil incompleto  → /onboarding
```

## 8.4 Tela de aguardando aprovação

Criar rota:

```txt
/aguardando-aprovacao
```

Texto sugerido:

```txt
Sua solicitação está em análise

Recebemos seu pedido de acesso ao portal do condomínio.
Assim que a administração aprovar seu cadastro, você poderá acessar os comunicados,
avisos, assembleias e informações internas.

Em caso de urgência, entre em contato diretamente com a administração do condomínio.
```

---

# 9. Área do morador com foco informativo

## 9.1 Home do morador

A home `/app` deve ser simples, objetiva e informativa.

Cards recomendados:

```txt
Últimos comunicados
Próximas assembleias
Avisos importantes
Eventos do condomínio
Clube de vantagens
Galeria
FAQ
Acesse o aplicativo oficial
```

## 9.2 O que não colocar na home do morador

Evitar elementos que deem a entender que o sistema faz gestão operacional completa:

```txt
Reservar salão
Gerar boleto
Abrir chamado oficial
Consultar prestação de contas
Documentos fiscais
```

Se algum desses assuntos aparecer, direcionar para o app oficial.

---

# 10. Painel administrativo revisado

## 10.1 Módulos principais

O painel administrativo deve focar na gestão de conteúdo.

Módulos recomendados:

```txt
Dashboard
Comunicados
Assembleias
Avisos e Circulares
Eventos
Galeria
Clube de Vantagens
FAQ
Moradores
Configurações
```

## 10.2 Dashboard administrativo

Cards úteis:

```txt
Comunicados publicados
Assembleias agendadas
Avisos ativos
Moradores cadastrados
Solicitações pendentes
Eventos próximos
Arquivos informativos publicados
```

## 10.3 Remover do painel neste momento

Não priorizar:

```txt
Reservas de espaços
Boletos
Prestação de contas
Documentos fiscais
Ocorrências complexas
Financeiro
```

---

# 11. Módulo de assembleias

## 11.1 Por que criar um módulo próprio

Como você mencionou chamadas para assembleias, vale a pena tratar isso como módulo específico, e não apenas como comunicado comum.

Assembleias são um tipo de comunicação mais importante e formal.

## 11.2 Funcionalidades recomendadas

```txt
Criar chamada de assembleia
Título
Data
Horário
Local
Tipo: ordinária | extraordinária
Descrição
Arquivo anexo opcional
Link externo opcional
Status: rascunho | publicado | encerrado
Destaque na home
```

## 11.3 Rotas sugeridas

```txt
/portal/assembleias
/app/assembleias
/painel/assembleias
```

## 11.4 Tabela sugerida

```sql
assembleias (
  id UUID PRIMARY KEY,
  condominio_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  data_assembleia DATE,
  horario TIME,
  local TEXT,
  link_externo TEXT,
  arquivo_url TEXT,
  storage_path TEXT,
  status TEXT DEFAULT 'rascunho',
  destaque BOOLEAN DEFAULT false,
  visibilidade TEXT DEFAULT 'moradores',
  criado_por UUID,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
)
```

---

# 12. Comunicados e avisos

## 12.1 Padronização de nomenclatura

No documento original, aparecem os termos:

```txt
comunicados
avisos
mural
feed
```

Recomenda-se padronizar.

Minha sugestão:

- **Comunicados**: notícias e informações gerais.
- **Avisos e Circulares**: mensagens mais objetivas, operacionais ou com anexo.
- **Assembleias**: chamadas e registros informativos de reuniões.

## 12.2 Rotas recomendadas

```txt
/app/comunicados
/app/avisos
/app/assembleias

/painel/comunicados
/painel/avisos
/painel/assembleias
```

## 12.3 Campos úteis para comunicados

```sql
comunicados (
  id UUID PRIMARY KEY,
  condominio_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  imagem_url TEXT,
  link_externo TEXT,
  fixado BOOLEAN DEFAULT false,
  publicar_em TIMESTAMP,
  status TEXT DEFAULT 'publicado',
  visibilidade TEXT DEFAULT 'moradores',
  criado_por UUID,
  criado_em TIMESTAMP DEFAULT now(),
  atualizado_em TIMESTAMP DEFAULT now()
)
```

---

# 13. Clube de vantagens

## 13.1 Manter como diferencial

O módulo de clube pode ser um diferencial interessante, porque gera valor para moradores sem entrar em processos sensíveis do condomínio.

## 13.2 Sugestões de conteúdo

```txt
Comércios parceiros
Descontos locais
Serviços próximos
Benefícios para moradores
Cupom ou instrução de uso
WhatsApp do parceiro
Endereço
Categoria
Imagem/logo
```

## 13.3 Importante

Deixar claro que o condomínio ou a plataforma apenas divulga o parceiro, se necessário.

Texto opcional:

```txt
Benefícios divulgados pelo condomínio. Consulte diretamente o parceiro para confirmar condições, validade e disponibilidade.
```

---

# 14. Galeria

## 14.1 Manter com cuidado de privacidade

A galeria pode ser útil para registrar eventos, melhorias e ações do condomínio.

Mas recomenda-se controle de visibilidade.

## 14.2 Visibilidades recomendadas

```txt
publico
moradores
administrativo
```

## 14.3 Sugestão de uso

```txt
Eventos internos
Melhorias no condomínio
Obras concluídas
Campanhas comunitárias
Fotos institucionais
```

Evitar publicar imagens de moradores sem autorização.

---

# 15. FAQ

## 15.1 Módulo importante para reduzir dúvidas

O FAQ deve ser mantido e bem explorado.

Categorias sugeridas:

```txt
Acesso ao portal
Comunicados
Assembleias
Aplicativo oficial
Regras gerais
Contatos úteis
Clube de vantagens
```

## 15.2 Perguntas recomendadas

```txt
Como acesso o aplicativo oficial do condomínio?
Onde vejo reservas de espaços?
Onde encontro boletos?
Como atualizo meus dados?
Como recebo comunicados?
Quem pode acessar a área do morador?
Como solicitar acesso ao portal?
```

Essas perguntas ajudam a educar o morador sobre o papel do portal.

---

# 16. Configurações do condomínio

## 16.1 Campos recomendados

Além dos campos atuais, adicionar:

```txt
Nome do aplicativo oficial
URL do aplicativo oficial
Texto do card do aplicativo oficial
WhatsApp da administração
E-mail de contato
Horário de atendimento
Endereço
Cor primária
Cor secundária
Logo
Imagem de capa
Exibir portal público
Exibir área do morador
```

## 16.2 Configurações de módulos

Permitir ativar/desativar módulos por condomínio:

```txt
Comunicados
Assembleias
Avisos e Circulares
Eventos
Galeria
Clube de Vantagens
FAQ
Card do App Oficial
```

Isso permite vender planos diferentes no futuro.

---

# 17. Revisão de permissões

## 17.1 Perfis principais

```txt
super_admin
sindico
subsindico
zelador
morador
```

## 17.2 Permissões recomendadas

| Módulo | Morador | Zelador | Subsíndico | Síndico | Super Admin |
|---|---:|---:|---:|---:|---:|
| Ver comunicados | Sim | Sim | Sim | Sim | Sim |
| Criar comunicados | Não | Talvez | Sim | Sim | Sim |
| Ver assembleias | Sim | Sim | Sim | Sim | Sim |
| Criar assembleias | Não | Não | Sim | Sim | Sim |
| Ver avisos/circulares | Sim | Sim | Sim | Sim | Sim |
| Criar avisos/circulares | Não | Talvez | Sim | Sim | Sim |
| Ver eventos | Sim | Sim | Sim | Sim | Sim |
| Criar eventos | Não | Talvez | Sim | Sim | Sim |
| Ver galeria | Sim | Sim | Sim | Sim | Sim |
| Gerenciar galeria | Não | Talvez | Sim | Sim | Sim |
| Ver clube | Sim | Sim | Sim | Sim | Sim |
| Gerenciar clube | Não | Não | Sim | Sim | Sim |
| Ver FAQ | Sim | Sim | Sim | Sim | Sim |
| Gerenciar FAQ | Não | Não | Sim | Sim | Sim |
| Aprovar moradores | Não | Não | Talvez | Sim | Sim |
| Configurar condomínio | Não | Não | Não | Sim | Sim |
| Gerenciar tenants | Não | Não | Não | Não | Sim |

---

# 18. Super admin e contexto de tenant

## 18.1 Problema

O super admin pode acessar tudo, mas precisa saber claramente qual condomínio está administrando.

## 18.2 Solução

Criar modo explícito de gerenciamento de tenant.

Fluxo:

```txt
/painel-master
↓
Seleciona condomínio
↓
Clica em "Gerenciar portal"
↓
Entra no /painel daquele condomínio
```

## 18.3 Indicador visual

Exibir uma faixa no topo:

```txt
Modo Super Admin — Gerenciando: Condomínio Flores
```

Botão:

```txt
Sair do modo de gerenciamento
```

---

# 19. Cadastro de condomínio

## 19.1 Problema possível

O fluxo atual cria condomínio e envia magic link, mas precisa garantir que o síndico fique corretamente vinculado ao tenant.

## 19.2 Fluxo recomendado

```txt
Usuário cadastra condomínio
↓
Sistema cria condomínio com status pending_setup
↓
Envia magic link ao síndico
↓
Síndico acessa callback
↓
Sistema cria perfil com role sindico
↓
Síndico completa onboarding
↓
Condomínio muda para active
```

## 19.3 Campos úteis em condominios

```sql
status TEXT DEFAULT 'pending_setup',
owner_user_id UUID,
setup_completed BOOLEAN DEFAULT false
```

Status possíveis:

```txt
pending_setup
active
suspended
cancelled
```

---

# 20. Solicitação de adesão do morador

## 20.1 Manter fluxo de join

O fluxo de adesão continua importante.

## 20.2 Campos recomendados

```txt
nome
email
telefone
bloco
unidade
tipo_vinculo
foto opcional
observacao
status
motivo_recusa
aprovado_por
aprovado_em
```

## 20.3 Tipo de vínculo

```txt
proprietario
inquilino
familiar
funcionario
outro
```

## 20.4 Fluxo ideal

```txt
Morador solicita acesso
↓
Síndico vê pendência no painel
↓
Síndico aprova ou recusa
↓
Se aprovado, morador recebe acesso à área /app
↓
Se recusado, fica registrado o motivo
```

---

# 21. Storage e segurança revisados

## 21.1 Documentos não serão sensíveis, mas ainda precisam de controle

Mesmo que o sistema não armazene boletos ou documentos fiscais, recomenda-se evitar exposição desnecessária.

## 21.2 Recomendação prática

Para simplificar o MVP:

- arquivos públicos podem usar bucket público;
- arquivos internos para moradores devem usar bucket privado ou URL protegida;
- evitar upload de documentos com dados pessoais ou fiscais;
- exibir aviso no painel: “não envie documentos sensíveis”.

## 21.3 Aviso no upload

Texto recomendado no painel:

```txt
Envie apenas arquivos informativos, como avisos, circulares, chamadas para assembleias e comunicados gerais.

Não envie boletos, documentos fiscais, dados financeiros, documentos jurídicos sensíveis ou arquivos com informações pessoais dos moradores.
```

---

# 22. Tela ou página “Aplicativo Oficial”

## 22.1 Criar uma página dedicada

Além do card, criar uma página:

```txt
/portal/app-oficial
/app/app-oficial
```

## 22.2 Conteúdo da página

```txt
Aplicativo oficial do condomínio

Alguns serviços continuam disponíveis exclusivamente pelo aplicativo oficial do condomínio.

Use o aplicativo oficial para:
- reservas de espaços internos;
- boletos e cobranças;
- documentos oficiais;
- solicitações administrativas;
- serviços internos;
- abertura de chamados, se disponível.

Este portal é usado para:
- comunicados;
- avisos;
- chamadas para assembleias;
- eventos;
- galeria;
- clube de vantagens;
- FAQ e informações úteis.

[ Acessar aplicativo oficial ]
```

---

# 23. Ajuste no menu

## 23.1 Menu público

```txt
Início
Comunicados
Assembleias
Eventos
Galeria
Clube
FAQ
App Oficial
Entrar
```

## 23.2 Menu do morador

```txt
Início
Comunicados
Assembleias
Avisos
Eventos
Galeria
Clube
FAQ
App Oficial
Perfil
```

## 23.3 Menu administrativo

```txt
Dashboard
Comunicados
Assembleias
Avisos e Circulares
Eventos
Galeria
Clube de Vantagens
FAQ
Moradores
Configurações
```

---

# 24. Melhorias de copy para o produto

## 24.1 Título institucional

```txt
Portal digital do seu condomínio
```

## 24.2 Subtítulo

```txt
Comunicados, avisos, assembleias e informações úteis em um só lugar.
```

## 24.3 Texto explicativo

```txt
Este portal foi criado para facilitar a comunicação entre administração e moradores,
mantendo todos informados sobre novidades, eventos, assembleias e avisos importantes.
```

## 24.4 Aviso sobre app oficial

```txt
Para serviços internos, reservas, boletos ou documentos oficiais, utilize o aplicativo oficial do condomínio.
```

---

# 25. MVP revisado

## 25.1 Módulos essenciais para primeira versão

```txt
Multi-tenant
Login magic link
Portal público
Área do morador
Painel administrativo
Painel master
Comunicados
Assembleias
Avisos e Circulares
Eventos
Galeria
Clube de Vantagens
FAQ
Moradores e solicitações de acesso
Card/Página do App Oficial
Configurações do condomínio
```

## 25.2 Módulos fora do MVP

```txt
Reservas de espaços
Boletos
Prestação de contas
Documentos fiscais
Gestão financeira
Chamados complexos
Controle de inadimplência
Documentos jurídicos sensíveis
```

---

# 26. Ordem recomendada de implementação

## Fase 1 — Organização estrutural

```txt
Separar rotas em /portal, /app e /painel
Ajustar ProtectedRoute
Ajustar callback pós-login
Criar tela /aguardando-aprovacao
Padronizar nomenclaturas
```

## Fase 2 — Conteúdo principal

```txt
Comunicados
Assembleias
Avisos e Circulares
Eventos
FAQ
```

## Fase 3 — Experiência do morador

```txt
Home /app
Cards de conteúdo
Card App Oficial
Página App Oficial
Perfil básico do morador
```

## Fase 4 — Administração

```txt
Dashboard administrativo
Gestão de moradores
Solicitações pendentes
Configurações do condomínio
Controle de módulos ativos
```

## Fase 5 — Master

```txt
Listagem de condomínios
Ativar/desativar condomínio
Gerenciar tenant como super admin
Status do condomínio
Planos
```

---

# 27. Resumo das decisões finais

## Manter

```txt
Portal público
Área logada do morador
Painel administrativo
Painel master
Comunicados
Avisos
Assembleias
Eventos
Galeria
Clube
FAQ
Solicitação de adesão
Personalização por condomínio
```

## Ajustar

```txt
Separar rotas públicas, morador e painel
Renomear documentos para arquivos informativos ou avisos/circulares
Criar card de acesso ao app oficial
Redirecionar morador para /app após login
Criar página explicativa do app oficial
Criar módulo específico para assembleias
Melhorar permissões por perfil
```

## Remover do escopo atual

```txt
Reservas internas
Boletos
Documentos oficiais sensíveis
Documentos fiscais
Prestação de contas
Financeiro
Gestão operacional completa
```

---

# 28. Conclusão

Com os ajustes acima, o **SaaS Condomínio Smart** fica mais coerente, mais simples de vender e mais seguro de implementar.

A melhor direção é posicioná-lo como:

> Portal informativo e comunicacional para condomínios, complementar ao aplicativo oficial.

Essa decisão evita competir diretamente com sistemas completos de administração condominial e permite entregar valor rapidamente com uma solução mais leve, visual, acessível e fácil de manter.

A estrutura recomendada é:

```txt
/portal  → informações públicas
/app     → área informativa do morador
/painel  → gestão de conteúdo pelo condomínio
/master  → gestão global da plataforma
```

O ponto central da nova experiência será deixar claro:

```txt
Este portal informa.
O app oficial opera.
```

Essa separação torna o produto mais objetivo, reduz riscos jurídicos e técnicos, e ajuda o morador a entender exatamente onde acessar cada tipo de serviço.
