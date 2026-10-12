import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getHealth } from '../controllers/health.controller.js';
import { getCurrentUser, login, register } from '../controllers/auth.controller.js';
import { createChatRoutes } from './chat.routes.js';
import {
  getPublicUserHandler,
  getUserProfilePhotoHandler,
  uploadProfilePhotoHandler,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { parseProfilePhotoUpload } from '../middlewares/profile-photo-upload.middleware.js';
import type { ChatSocketServer } from '../socket/chat.types.js';

export const createRoutes = (io: ChatSocketServer): Router => {
  const routes = Router();

  routes.get('/', getHome);
  routes.get('/health', getHealth);
  routes.get('/auth/me', getCurrentUser);
  routes.post('/auth/register', register);
  routes.post('/auth/login', login);
  routes.post(
    '/users/:username/photo/upload',
    requireAuth,
    parseProfilePhotoUpload,
    uploadProfilePhotoHandler,
  );
  routes.get('/users/:username/photo', getUserProfilePhotoHandler);
  routes.get('/users/:username', getPublicUserHandler);
  routes.use('/chat', createChatRoutes(io));

  return routes;
};
