require('dotenv/config');

const http = require('node:http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());

app.get('/', (_request, response) => {
  response.json({ message: 'WebChat API is running' });
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`Socket desconectado: ${socket.id} (${reason})`);
  });
});

const port = Number(process.env.PORT) || 1414;

httpServer.listen(port, () => {
  console.log(`Servidor HTTP e Socket.IO escutando na porta ${port}`);
});
