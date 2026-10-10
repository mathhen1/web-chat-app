import UserModel from '../models/user.model.js';
import { verifyAuthToken } from '../auth/token.js';
import { changeChatMemberCount, getChatById, ChatServiceError } from '../services/chat.service.js';
import {
  getChatRoomName,
  type ChatSocketResult,
  type ChatSocketServer,
} from './chat.types.js';

const getCookieToken = (cookieHeader?: string): string | undefined =>
  cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.slice('token='.length);

const socketError = (error: unknown): ChatSocketResult => ({
  ok: false,
  message: error instanceof ChatServiceError ? error.message : 'Não foi possível processar o chat.',
});

const logSocketError = (error: unknown): void => {
  if (!(error instanceof ChatServiceError)) {
    console.error(error);
  }
};

const registerSocketAuthentication = (io: ChatSocketServer): void => {
  io.use(async (socket, next) => {
    const token = getCookieToken(socket.handshake.headers.cookie);
    if (!token) {
      next(new Error('Autenticação necessária.'));
      return;
    }

    try {
      const { payload } = await verifyAuthToken(token);
      if (!payload.sub || typeof payload.username !== 'string') {
        next(new Error('Sessão inválida ou expirada.'));
        return;
      }

      const user = await UserModel.findById(payload.sub).select('_id username');
      if (!user) {
        next(new Error('Sessão inválida ou expirada.'));
        return;
      }

      socket.data.userId = user._id.toString();
      socket.data.username = user.username;
      socket.data.joinedChats = new Map<number, string>();
      next();
    } catch {
      next(new Error('Sessão inválida ou expirada.'));
    }
  });
};

const registerChatEvents = (io: ChatSocketServer): void => {
  io.on('connection', (socket) => {
    socket.on('chat:join', async ({ id, password }, acknowledge) => {
      try {
        const chat = await getChatById(id, password);
        const roomName = getChatRoomName(chat);

        if (!socket.data.joinedChats.has(chat.id)) {
          await socket.join(roomName);
          socket.data.joinedChats.set(chat.id, roomName);
          await changeChatMemberCount(chat.id, 1);
          chat.members += 1;
        }

        acknowledge?.({ ok: true, chat });
      } catch (error: unknown) {
        logSocketError(error);
        acknowledge?.(socketError(error));
      }
    });

    socket.on('chat:leave', async ({ id }, acknowledge) => {
      const roomName = socket.data.joinedChats.get(id);
      if (!roomName) {
        acknowledge?.({ ok: false, message: 'Você não está neste chat.' });
        return;
      }

      try {
        await socket.leave(roomName);
        socket.data.joinedChats.delete(id);
        await changeChatMemberCount(id, -1);
        acknowledge?.({ ok: true });
      } catch (error: unknown) {
        logSocketError(error);
        acknowledge?.(socketError(error));
      }
    });

    socket.on('disconnect', () => {
      const joinedChatIds = [...socket.data.joinedChats.keys()];
      socket.data.joinedChats.clear();

      void Promise.all(joinedChatIds.map((id) => changeChatMemberCount(id, -1))).catch((error: unknown) => {
        logSocketError(error);
      });
    });
  });
};

export const configureChatSocket = (io: ChatSocketServer): void => {
  registerSocketAuthentication(io);
  registerChatEvents(io);
};

export const removeChatSockets = async (
  io: ChatSocketServer,
  chat: { id: number; name: string },
): Promise<void> => {
  const roomName = getChatRoomName(chat);
  const sockets = await io.in(roomName).fetchSockets();
  sockets.forEach((socket) => socket.data.joinedChats.delete(chat.id));
  io.to(roomName).emit('chat:deleted', { id: chat.id });
  await io.in(roomName).socketsLeave(roomName);
};
