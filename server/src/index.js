import 'dotenv/config';

import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import routes from './routes/index.js';
import { connectDatabase } from './lib/database.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(routes);
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Socket desconectado: ${socket.id} (${reason})`);
  });
});

const port = Number(process.env.PORT) || 1414;

async function startServer() {
  await connectDatabase();

  httpServer.listen(port, () => {
    console.log(`Servidor HTTP e Socket.IO escutando na porta ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Não foi possível iniciar o servidor:', error.message);
  process.exitCode = 1;
});
