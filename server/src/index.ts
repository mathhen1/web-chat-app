import 'dotenv/config';

import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { createRoutes } from './routes/index.js';
import { connectDatabase } from './lib/database.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { configureChatSocket } from './socket/chat.socket.js';
import type { ChatSocketServer } from './socket/chat.types.js';
import { migrateLegacyChatMembers } from './services/chat.service.js';

const app = express();
const httpServer = createServer(app);
const io: ChatSocketServer = new Server(httpServer);
configureChatSocket(io);

app.use(
  express.json({
    verify: (request, _response, body) => {
      request.rawBody = body.toString('utf8');
    },
  }),
);
app.use(createRoutes(io));
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Socket desconectado: ${socket.id} (${reason})`);
  });
});

const port = Number(process.env.PORT ?? 1414);

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await migrateLegacyChatMembers();

  httpServer.listen(port, () => {
    console.log(`Servidor HTTP e Socket.IO escutando na porta ${port}`);
  });
};

void startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Não foi possível iniciar o servidor:', message);
  process.exitCode = 1;
});
