import { verifyAuthToken } from '../auth/token.js';
import UserModel from '../models/user.model.js';
import {
  addChatMember,
  ChatServiceError,
  getChatById,
} from '../services/chat.service.js';
import {
  getChatRoomName,
  getUserRoomName,
  type ChatSocketResult,
  type ChatSocketServer,
} from './chat.types.js';
import {
  createChatMessage,
  getRecentChatMessages,
  MessageServiceError,
} from '../services/message.service.js';

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
      await socket.join(getUserRoomName(socket.data.userId));
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
        const chatAccess = await getChatById(id, password, socket.data.userId);
        const roomName = getChatRoomName(chatAccess);
        const chat = await addChatMember(chatAccess.id, socket.data.userId);

        if (!socket.data.joinedChats.has(chat.id)) {
          await socket.join(roomName);
          socket.data.joinedChats.set(chat.id, roomName);
        }

        io.to(roomName).emit('chat:members-updated', {
          chatId: chat.id,
          members: chat.members,
        });

        const messages = await getRecentChatMessages(chat.id);
        acknowledge?.({ ok: true, chat, messages });
      } catch (error: unknown) {
        logSocketError(error);
        acknowledge?.(socketError(error));
      }
    });

    socket.on('message:send', async ({ chatId, content }, acknowledge) => {
      const roomName = socket.data.joinedChats.get(chatId);
      if (!roomName) {
        acknowledge?.({ ok: false, message: 'Entre na sala antes de enviar mensagens.' });
        return;
      }

      try {
        const chatMessage = await createChatMessage(chatId, socket.data.userId, content);
        io.to(roomName).emit('chat:message', chatMessage);
        acknowledge?.({ ok: true, chatMessage });
      } catch (error: unknown) {
        if (!(error instanceof MessageServiceError)) console.error(error);
        acknowledge?.({
          ok: false,
          message:
            error instanceof MessageServiceError
              ? error.message
              : 'Não foi possível enviar a mensagem.',
        });
      }
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

export const removeChatMemberSockets = async (
  io: ChatSocketServer,
  chat: { id: number; name: string; members: number },
  userId: string,
): Promise<void> => {
  const roomName = getChatRoomName(chat);
  const userRoomName = getUserRoomName(userId);
  const userSockets = await io.in(userRoomName).fetchSockets();
  const chatSockets = userSockets.filter((socket) => socket.data.joinedChats.has(chat.id));

  for (const socket of chatSockets) {
    socket.data.joinedChats.delete(chat.id);
    await socket.leave(roomName);
  }

  io.to(userRoomName).emit('chat:membership-removed', { chatId: chat.id });
  io.to(roomName).emit('chat:members-updated', {
    chatId: chat.id,
    members: chat.members,
  });
};
