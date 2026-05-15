O síndico ou administrador do condomínio gera um link de adesão exclusivo do condomínio.

Quando o morador acessa, ele preenche:

Nome
E-mail
Telefone / WhatsApp
Unidade: bloco, torre, apartamento/casa
Senha
Confirmação de senha
Aceite dos termos

Depois disso, você pode ter dois modos configuráveis por condomínio:

Opção 1 — Entrada automática com validação por unidade
O morador informa a unidade, cria a senha e já entra no portal.
Funciona bem quando o condomínio não exige controle rígido.
Mas eu colocaria algumas proteções:

Link com expiração
Limite de cadastros por unidade
Confirmação de e-mail
Registro de quem entrou e quando
Possibilidade de o síndico remover/bloquear depois

Exemplo:

Morador do Apto 304 se cadastra pelo link, confirma o e-mail, cria a senha e já acessa o portal.
Esse fluxo é mais fluido e reduz trabalho do síndico.
Opção 2 — Entrada automática, mas com status “pendente de vínculo”
Esse é o que eu mais gosto.

O morador cria a conta e senha, mas entra com acesso limitado até ser validado.

Por exemplo, ele pode ver:
Página inicial
Regras gerais
FAQ público do condomínio
Solicitar vínculo com unidade

Mas não pode ver:

Comunicados internos
Documentos
Dados sensíveis
Área de moradores
Classificados internos

Depois o síndico ou administrador confirma que aquela pessoa pertence à unidade.
Esse modelo evita travar totalmente a experiência, mas protege o portal.
Opção 3 — Aprovação obrigatória pelo síndico

É o fluxo que você usa hoje.
Eu manteria como opção, mas não como único modelo.
Funciona melhor para condomínios menores, mais rígidos ou com dados mais sensíveis. O problema é que cria atrito: o morador se cadastra e fica esperando alguém aprovar.

Minha sugestão final para seu SaaS

Eu criaria uma configuração no painel do condomínio:
Forma de entrada de moradores:

[ ] Aprovação automática por link de adesão
[ ] Aprovação automática com confirmação de e-mail
[ ] Aprovação manual pelo síndico
[ ] Aprovação automática apenas se a unidade estiver pré-cadastrada

E eu deixaria o padrão como:

Aprovação automática apenas se a unidade estiver pré-cadastrada
+ confirmação de e-mail
+ possibilidade de bloqueio pelo síndico

Esse é um bom equilíbrio entre segurança e praticidade.

Fluxo ideal na prática

O síndico cadastra previamente as unidades:

Bloco A - Apto 101
Bloco A - Apto 102
Bloco B - Apto 201
Casa 15

Depois gera o link de adesão do condomínio.

O morador acessa:

portal.com/adesao/condominio-x

Escolhe ou digita a unidade:

Bloco A - Apto 101

Cria a conta:

Nome
E-mail
Senha
Telefone

Confirma o e-mail.

A conta entra como:

Morador ativo
Unidade: Bloco A - Apto 101

O síndico recebe uma notificação:

Novo morador cadastrado na unidade Bloco A - Apto 101.

E pode bloquear/remover se houver problema.

Cuidado importante

Eu evitaria um link único aberto e permanente, tipo:

portal.com/cadastro/condominio-tal

Porque esse link pode vazar. Alguém de fora poderia se cadastrar como morador.

Melhor usar:

Link com token
Expiração opcional
Controle por domínio, unidade ou código
Limite de uso

Exemplo mais seguro:

portal.com/adesao/condominio-x?token=abc123

Ou ainda melhor: um código de adesão por condomínio ou por unidade.

Exemplo:

Código do condomínio: VILA2026
Unidade: Apto 302
Para o espaço de serviços/produtos

Como o morador poderá cadastrar serviços/produtos para outros moradores, eu colocaria moderação separada.

Mesmo que o morador tenha acesso automático ao portal, os anúncios poderiam ficar assim:

Anúncio criado → aguardando aprovação → publicado

Porque isso evita spam, golpe, conteúdo indevido ou propaganda abusiva.

Minha recomendação de arquitetura de permissões

Você pode trabalhar com status assim:

pending_email_verification
pending_admin_approval
active
blocked
removed

E papéis assim:

master_admin
condo_admin / sindico
resident
visitor

E permissões por módulo:

view_announcements
view_documents
create_marketplace_listing
approve_marketplace_listing
manage_residents
manage_condo_settings
Resumo da minha sugestão

Eu não removeria totalmente a aprovação. Eu transformaria isso em configuração do condomínio.

Para o padrão do sistema, eu usaria:

Link de adesão + criação de senha + confirmação de e-mail + vínculo com unidade pré-cadastrada

E deixaria o síndico apenas com poder de auditoria:

Aprovar quando necessário
Bloquear
Remover
Editar vínculo com unidade
Ver histórico de cadastros

Assim você reduz atrito para o morador, facilita a vida do síndico e ainda mantém um nível bom de segurança.