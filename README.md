# WebChatApp

Aplicação de chat em desenvolvimento, organizada em dois projetos independentes:

- `client/`: interface web em React.
- `server/`: API HTTP, autenticação, persistência e comunicação em tempo real.

O backend usa MongoDB para armazenar usuários, salas, mensagens e amizades. Socket.IO mantém o chat em tempo real. Notificações de pedido de amizade são enfileiradas pelo QStash e entregues pelo Upstash Realtime ao frontend por Server-Sent Events (SSE).

## Funcionalidades

- Cadastro, login, restauração de sessão e logout usando cookie JWT `HttpOnly`.
- Salas públicas e privadas; salas privadas podem exigir senha.
- Inscrição persistente em salas: entrar no chat adiciona o usuário à lista de membros no MongoDB. Fechar a página ou desconectar não remove a inscrição; para sair, use a ação de sair da sala.
- Listagem paginada de salas públicas e listagem das salas em que o usuário está inscrito.
- Envio e leitura de mensagens em tempo real com Socket.IO. Mensagens são persistidas no MongoDB.
- Exclusão de mensagens pelo autor da mensagem ou pelo autor da sala. A remoção é propagada aos participantes conectados.
- Perfis públicos com username, status e foto. O próprio usuário pode editar username, status e foto.
- Busca de perfil por username, gerenciamento de pedidos de amizade, lista de amigos e remoção de amizade.
- Notificação em tempo real de pedido de amizade recebido, exibida como toast no frontend.

## Tecnologias e dependências

### Client

- React 19 e React DOM para a interface.
- TypeScript e Vite para desenvolvimento e build.
- React Router para navegação.
- Tailwind CSS 4 para estilos.
- `socket.io-client` para conexão aos eventos do chat.
- Fetch API nativa para chamadas HTTP e `EventSource` nativo para SSE.
- Oxlint para lint.

### Server

- Node.js, TypeScript e Express 5 para a API HTTP.
- Mongoose e MongoDB para modelos e persistência.
- Socket.IO para mensagens, presença/conexão aos chats e atualização de membros.
- `jose` para JWT e `bcrypt` para armazenar senhas com hash.
- Multer em memória para receber fotos de perfil como `multipart/form-data`.
- `@upstash/qstash` para publicar entregas assíncronas de notificações e validar a assinatura dos webhooks recebidos.
- `@upstash/redis` como conexão ao Redis REST do Upstash.
- `@upstash/realtime` para publicar eventos e mantê-los disponíveis ao fluxo SSE.
- Zod para validar o esquema de eventos do Realtime.
- `tsx` para desenvolvimento com recarga automática.

Os projetos têm `package.json` e dependências separados. Instale cada um no diretório correspondente.

## Pré-requisitos

- Node.js e npm.
- Uma instância MongoDB acessível pelo servidor (por exemplo, MongoDB Atlas).
- Para notificações de amizade: credenciais do QStash e do Upstash Redis REST.
- Para receber webhooks QStash durante desenvolvimento local: LocalTunnel, executado via `npx`.

## Executar localmente

### 1. Configurar e iniciar o servidor

Crie `server/.env` a partir de `server/.env.example` e configure os valores:

| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP e Socket.IO; padrão `1414`. |
| `MONGODB_URI` | URI de conexão com o MongoDB. |
| `JWT_SECRET` | Segredo usado para assinar tokens JWT; use um valor aleatório forte. |
| `QSTASH_URL` | URL do serviço QStash; o exemplo aponta para `https://qstash.upstash.io`. |
| `QSTASH_TOKEN` | Token de publicação do QStash. |
| `QSTASH_CURRENT_SIGNING_KEY` | Chave atual para verificar assinaturas dos webhooks QStash. |
| `QSTASH_NEXT_SIGNING_KEY` | Próxima chave de assinatura fornecida pelo QStash, aceita durante rotação. |
| `PUBLIC_API_URL` | URL pública base do backend, usada pelo QStash para chamar `/events/friend-request`. |
| `UPSTASH_REDIS_REST_URL` | URL REST da instância Redis no Upstash. |
| `UPSTASH_REDIS_REST_TOKEN` | Token de acesso REST da instância Redis. |

No PowerShell:

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

No macOS/Linux, substitua `Copy-Item .env.example .env` por `cp .env.example .env`.

O servidor conecta ao MongoDB e executa a migração compatível dos membros antigos das salas antes de começar a escutar na porta configurada.

### 2. Iniciar o client

Em outro terminal:

```bash
cd client
npm install
npm run dev
```

Abra o endereço local apresentado pelo Vite, normalmente `http://localhost:5173`. Em desenvolvimento, o proxy do Vite encaminha `/api/*` para `http://localhost:1414`, removendo o prefixo `/api`. Também encaminha `/socket.io` e habilita WebSocket.

### Comandos úteis

No diretório `client/`:

```bash
npm run dev      # servidor Vite de desenvolvimento
npm run build    # verificação TypeScript e build em dist/
npm run preview  # servir localmente o build
npm run lint     # Oxlint
```

No diretório `server/`:

```bash
npm run dev        # servidor com recarga via tsx
npm run typecheck  # verificação TypeScript sem gerar arquivos
npm run build      # compila src/ para dist/
npm start          # inicia a versão compilada
```

## LocalTunnel e webhooks públicos do QStash

O navegador usa a API local pelo proxy Vite. O LocalTunnel é necessário quando um serviço externo, como o QStash, precisa iniciar uma requisição para o servidor que está rodando na sua máquina. O túnel cria um endereço público temporário que encaminha requisições para a porta local do backend.

Não é necessário instalar LocalTunnel globalmente. Com o backend ativo na porta `1414`, abra um terminal separado e execute:

```bash
npx localtunnel --port 1414
```

Na primeira execução, o `npx` pode pedir confirmação para baixar/executar o pacote. Copie a URL HTTPS exibida, por exemplo `https://nome-aleatorio.loca.lt`, e configure-a em `server/.env`:

```env
PUBLIC_API_URL=https://nome-aleatorio.loca.lt
```

Use somente a URL base, sem `/events/friend-request` no final. O backend acrescenta esse caminho ao publicar o evento no QStash. Depois de alterar `.env`, reinicie o backend para carregar o novo valor. Mantenha o processo do LocalTunnel ativo enquanto o QStash precisar entregar notificações. Ao iniciar um novo túnel, a URL normalmente muda; atualize `PUBLIC_API_URL` e reinicie o servidor com a URL nova.

O endpoint `/health` pode ser acessado pela URL pública para conferir a conectividade básica do túnel. A entrega de notificações também depende das credenciais do QStash e do Upstash Redis e das chaves de assinatura corretas. O caminho do webhook é `POST /events/friend-request`; ele verifica a assinatura QStash antes de publicar o evento no Realtime.

Não compartilhe URLs de túnel ou credenciais de serviços em repositórios públicos. O arquivo `.env` contém segredos locais e deve permanecer fora do controle de versão.

## Sessão e autenticação

Cadastro e login recebem JSON com `username` e `password`, e definem o cookie `token` como `HttpOnly`. O cookie expira após uma hora. Rotas protegidas validam o JWT pelo middleware de autenticação. O frontend usa `credentials: 'include'` nas chamadas HTTP autenticadas; o Socket.IO também lê o cookie durante o handshake.

Username é normalizado para minúsculas e precisa ser único. A senha deve ter no mínimo 12 caracteres, conter uma letra maiúscula e um símbolo especial, e não pode exceder 72 bytes. A senha é armazenada com bcrypt usando 12 salt rounds.

## API HTTP

As rotas abaixo são montadas na raiz do servidor. No client de desenvolvimento, acesse-as com o prefixo `/api` por causa do proxy do Vite. Salvo quando indicado, respostas e corpos usam JSON.

### Saúde e autenticação

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | Público | Mensagem inicial da API. |
| `GET` | `/health` | Público | Verificação básica do servidor. |
| `POST` | `/auth/register` | Público | Cria conta e inicia sessão. |
| `POST` | `/auth/login` | Público | Autentica e inicia sessão. |
| `GET` | `/auth/me` | Cookie JWT | Retorna o usuário da sessão. |
| `POST` | `/auth/logout` | Público | Limpa o cookie de sessão. |

Exemplo para cadastro e login:

```json
{
  "username": "ana",
  "password": "UmaSenhaSegura!"
}
```

### Salas e mensagens

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/chat` | Cookie JWT | Cria sala; o usuário autenticado vira autor. |
| `GET` | `/chat?page=1` | Cookie JWT | Lista salas públicas paginadas. |
| `GET` | `/chat/joined` | Cookie JWT | Lista salas em que o usuário está inscrito. |
| `GET` | `/chat/:id` | Sessão opcional | Consulta sala; para sala privada, exige ser membro ou enviar senha em `X-Chat-Password`. |
| `DELETE` | `/chat` | Cookie JWT, autor | Remove uma sala usando `{ "id": 1 }` no corpo. |
| `DELETE` | `/chat/:id/members/me` | Cookie JWT | Sai explicitamente da sala e remove a inscrição persistente. |
| `DELETE` | `/chat/messages/:messageId` | Cookie JWT | Remove mensagem se o usuário for seu autor ou autor da sala. |

Exemplo de criação de sala:

```json
{
  "name": "Conversa geral",
  "description": "Uma sala aberta",
  "visible": true
}
```

Para sala privada, use `"visible": false` e inclua `"password": "..."`. O campo `desc` também é aceito como alias de `description`. Os IDs numéricos são gerados pelo servidor. O campo `members` é composto pelos usuários inscritos, não pelo total de sockets conectados.

As mensagens são criadas pelo evento Socket.IO `message:send`, não por uma rota HTTP. A exclusão de mensagem usa a rota HTTP acima; o servidor emite um evento Socket.IO para sincronizar a remoção nos participantes conectados.

### Usuários, fotos e perfis

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/users/:username` | Público | Retorna informações públicas: ID, username, status e URL da foto se houver. |
| `GET` | `/users/:username/photo` | Público | Retorna os bytes da foto com o tipo de conteúdo da imagem. |
| `POST` | `/users/:username/photo/upload` | Dono do perfil, cookie JWT | Envia uma foto no campo multipart `photo`. |
| `PATCH` | `/users/:username/edit` | Dono do perfil, cookie JWT | Atualiza opcionalmente username, status e/ou foto. |

Fotos são recebidas em memória pelo Multer e armazenadas como `Buffer` no documento `User`. Tipos aceitos: JPEG, PNG, GIF e WebP; tamanho máximo: 5 MB. Para editar perfil, a requisição `PATCH` usa `multipart/form-data`; os campos textuais são opcionais e a foto usa o campo `photo`.

### Amizades e notificações

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `POST` | `/users/:username/friend-requests` | Cookie JWT | Envia pedido de amizade ao usuário indicado. |
| `GET` | `/users/:username/pending-friend-requests` | Cookie JWT, somente o próprio usuário | Lista pedidos recebidos pendentes. |
| `GET` | `/users/:username/friends` | Público | Lista amigos do perfil. |
| `POST` | `/users/:username/accept-friend` | Cookie JWT | Aceita pedido enviado pelo usuário indicado. |
| `POST` | `/users/:username/recuse-friend` | Cookie JWT | Recusa pedido enviado pelo usuário indicado. |
| `DELETE` | `/users/:username/friend` | Cookie JWT | Remove o usuário indicado da lista de amigos dos dois perfis. |
| `GET` | `/notifications/events` | Cookie JWT | Abre um fluxo SSE autenticado para notificações em tempo real. |
| `POST` | `/events/friend-request` | Assinatura QStash | Endpoint de entrega chamado pelo QStash; valida `Upstash-Signature`. |

Os pedidos são persistidos no perfil destinatário. Ao aceitar, os dois perfis passam a referenciar um ao outro como amigos. O endpoint de eventos é uma integração de serviço e deve receber eventos assinados do QStash.

## Comunicação em tempo real

### Socket.IO

O Socket.IO autentica pelo cookie JWT. O frontend entra na sala com `chat:join`, informando `{ "id": 1 }` ou `{ "id": 1, "password": "..." }`. O callback de confirmação retorna o resultado da entrada e as mensagens recentes. A inscrição fica persistida até o usuário sair pela rota HTTP de saída.

Eventos usados pelo chat:

- Cliente → servidor: `chat:join`, `message:send`.
- Servidor → cliente: `chat:message`, `chat:message-deleted`, `chat:members-updated`, `chat:membership-removed`, `chat:deleted`.

`chat:message-deleted` informa o ID da sala e da mensagem removida. Quando o usuário sai explicitamente, o servidor também o remove das salas Socket.IO ativas daquele chat e atualiza o contador de membros.

### Notificações QStash, Upstash Realtime e SSE

O fluxo de pedido de amizade recebido funciona assim:

1. A API persiste o pedido pendente no usuário destinatário.
2. O backend publica no QStash um evento `friend.request.created`, endereçado ao webhook público configurado em `PUBLIC_API_URL`.
3. O webhook valida a assinatura do QStash e emite o evento no canal privado do usuário usando Upstash Realtime e Redis REST.
4. O frontend mantém `/notifications/events` aberto via `EventSource`, autenticado pelo cookie, e mostra um toast quando recebe o evento.

O QStash faz a entrega assíncrona e pode repetir a chamada quando o endpoint não responder com sucesso. O SSE é unidirecional: o servidor envia eventos ao navegador. Socket.IO continua sendo usado para as conversas em tempo real.

## Modelos principais

- `User`: username, senha em hash, status, amigos, pedidos pendentes e bytes/tipo da foto de perfil.
- `Chat`: ID numérico, nome, descrição, visibilidade, senha opcional com hash, autor e membros inscritos (`User[]`).
- `Message`: sala, autor, conteúdo, horário e data.
- `ChatCounter`: contador para geração de IDs numéricos das salas.
