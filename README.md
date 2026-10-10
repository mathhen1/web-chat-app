# WebChatApp

Aplicação de chat em desenvolvimento, organizada em dois projetos independentes: `client/` para a interface e `server/` para a API, autenticação, persistência e comunicação em tempo real.

## Frontend

O frontend utiliza Vite, React 19, TypeScript, React Router e Tailwind CSS 4. As chamadas HTTP usam a Fetch API nativa. O `AuthProvider` consulta `/api/auth/me` para restaurar a sessão usando o cookie de autenticação.

### Páginas e rotas atuais

- `/`: página inicial pública.
- `/login` e `/register`: páginas públicas de autenticação.
- `/home`, `/chats`, `/chat/:id_sala` e `/:username`: páginas protegidas por sessão.

O projeto ainda está em construção; as telas e rotas de chat não representam, por si só, uma experiência de mensagens completa.

### Executar

```bash
cd client
npm install
npm run dev
```

O servidor de desenvolvimento do Vite usa a porta padrão `5173`. A configuração encaminha requisições iniciadas por `/api` para `http://localhost:1414` e remove o prefixo `/api` antes de enviá-las ao backend. Por exemplo, `fetch('/api/auth/me')` chega ao servidor como `GET /auth/me`.

Outros comandos:

```bash
npm run build    # verifica os tipos e gera a versão de produção em dist/
npm run preview  # serve localmente a versão compilada
npm run lint     # executa o Oxlint
```

O Vite usa o plugin React com o React Compiler nativo baseado em OXC. Essa configuração substitui a opção `babel` inline, removida no `@vitejs/plugin-react` 6. O suporte nativo do compiler ainda é experimental.

## Backend

O backend usa Node.js com ES Modules e TypeScript estrito. Express fornece a API HTTP, Socket.IO gerencia conexões e salas, Mongoose conecta ao MongoDB Atlas, bcrypt armazena hashes de senha e jose assina e verifica JWTs.

### Configuração e execução

Crie `server/.env` a partir de `server/.env.example` e configure:

- `PORT`: porta HTTP e Socket.IO; o padrão é `1414`.
- `MONGODB_URI`: URI de conexão do MongoDB Atlas.
- `JWT_SECRET`: segredo aleatório com pelo menos 32 bytes.

No PowerShell:

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

No macOS/Linux, use `cp .env.example .env` no lugar de `Copy-Item`.

Comandos adicionais:

```bash
npm run typecheck  # verifica os tipos sem gerar arquivos
npm run build      # compila src/ para dist/
npm start          # inicia a versão compilada
```

O servidor aguarda a conexão com o MongoDB antes de começar a escutar. `dist/` é gerada pelo build e não deve ser editada manualmente.

### API disponível

As respostas e os corpos de requisição usam JSON, salvo os headers indicados.

| Método | Endpoint | Acesso | Descrição |
| --- | --- | --- | --- |
| `GET` | `/` | Público | Mensagem de estado da API. |
| `GET` | `/health` | Público | Estado básico do servidor. |
| `POST` | `/auth/register` | Público | Cria usuário e inicia sessão. |
| `POST` | `/auth/login` | Público | Valida credenciais e inicia sessão. |
| `GET` | `/auth/me` | Cookie JWT | Retorna o usuário da sessão atual. |
| `POST` | `/chat` | Cookie JWT | Cria uma sala e define o autor pela sessão. |
| `GET` | `/chat/:id` | Público ou senha da sala | Consulta sala pública ou privada. |
| `DELETE` | `/chat` | Cookie JWT, somente autor | Remove a sala indicada no corpo. |

Exemplo de registro e login:

```json
{
  "username": "ana",
  "password": "UmaSenhaSegura!"
}
```

O username é convertido para minúsculas e precisa ser único. A senha deve ter pelo menos 12 caracteres, uma letra maiúscula e um símbolo especial. As senhas são armazenadas como hashes bcrypt com 12 salt rounds.

Registro e login definem um cookie `token` `HttpOnly`, válido por uma hora. Em chamadas feitas diretamente pelo navegador, use `credentials: 'include'` no Fetch API. No frontend, as chamadas `/api/...` passam pelo proxy do Vite.

Exemplo de criação de sala pública:

```json
{
  "name": "Conversa geral",
  "description": "Uma sala aberta",
  "visible": true
}
```

Para uma sala privada, envie `visible: false` e uma `password`. O campo `desc` também é aceito como alias de `description`. O ID numérico é gerado no servidor por um contador atômico; `members` começa em zero e acompanha sockets conectados. Somente o autor pode remover a sala, enviando `{"id": 1}` no corpo do `DELETE /chat`.

Para consultar uma sala privada, envie a senha no header `X-Chat-Password`. O campo `author` do modelo referencia um documento `User`; hashes de senha de usuários e salas não são incluídos nas respostas.

### Socket.IO

As conexões Socket.IO autenticam pelo cookie JWT. Os eventos implementados são:

- `chat:join`, com `{ "id": 1 }` para salas públicas ou `{ "id": 1, "password": "..." }` para salas privadas. Use o callback de confirmação para receber o resultado da entrada.
- `chat:leave`, com `{ "id": 1 }`, para sair de uma sala.
- `chat:deleted`, evento enviado pelo servidor aos sockets da sala quando ela é removida.

As rooms usam o ID e o nome da sala; a senha é usada somente para autorizar a entrada e nunca faz parte do nome da room. O transporte de mensagens ainda não está implementado. O modelo `Message` já existe, mas ainda não há rotas ou eventos para criar e recuperar mensagens.

### Modelos principais

- `User`: username único e minúsculo, senha em hash.
- `Chat`: ID numérico, nome, descrição, visibilidade, contador de membros, referência ao autor e senha opcional para salas privadas.
- `Message`: conteúdo, hora, data e referência ao usuário autor.
