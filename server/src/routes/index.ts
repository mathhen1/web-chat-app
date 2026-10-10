import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getHealth } from '../controllers/health.controller.js';
import { getCurrentUser, login, register } from '../controllers/auth.controller.js';
import { createChatRoutes } from './chat.routes.js';
import type { ChatSocketServer } from '../socket/chat.types.js';

export const createRoutes = (io: ChatSocketServer): Router => {
  const routes = Router();

  routes.get('/', getHome);
  routes.get('/health', getHealth);
  routes.get('/auth/me', getCurrentUser);
  routes.post('/auth/register', register);
  routes.post('/auth/login', login);
  routes.use('/chat', createChatRoutes(io));

  return routes;
};
