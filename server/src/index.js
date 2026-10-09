require('dotenv/config');

const http = require('node:http');
const express = require('express');
const { Server } = require('socket.io');
const routes = require('./routes');
const connectDatabase = require('./lib/database');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(routes);

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
