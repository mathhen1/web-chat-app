import { Router } from 'express';
import {
  createChatHandler,
  deleteChatHandler,
  getChatHandler,
  getJoinedChatsHandler,
  getPublicChatsHandler,
  leaveChatHandler,
} from '../controllers/chat.controller.js';
import { deleteChatMessageHandler } from '../controllers/message.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import type { ChatSocketServer } from '../socket/chat.types.js';

export const createChatRoutes = (io: ChatSocketServer): Router => {
  const chatRoutes = Router();

  chatRoutes.post('/', requireAuth, createChatHandler);
  chatRoutes.delete('/', requireAuth, deleteChatHandler(io));
  chatRoutes.get('/', requireAuth, getPublicChatsHandler);
  chatRoutes.get('/joined', requireAuth, getJoinedChatsHandler);
  chatRoutes.delete('/messages/:messageId', requireAuth, deleteChatMessageHandler(io));
  chatRoutes.delete('/:id/members/me', requireAuth, leaveChatHandler(io));
  chatRoutes.get('/:id', requireAuth, getChatHandler);

  return chatRoutes;
};
