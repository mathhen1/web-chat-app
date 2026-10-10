import { Router } from 'express';
import { createChatHandler, deleteChatHandler, getChatHandler } from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import type { ChatSocketServer } from '../socket/chat.types.js';

export const createChatRoutes = (io: ChatSocketServer): Router => {
  const chatRoutes = Router();

  chatRoutes.post('/', requireAuth, createChatHandler);
  chatRoutes.delete('/', requireAuth, deleteChatHandler(io));
  chatRoutes.get('/:id', getChatHandler);

  return chatRoutes;
};
