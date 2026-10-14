import { Router } from 'express';
import { getHome } from '../controllers/home.controller.js';
import { getHealth } from '../controllers/health.controller.js';
import { getCurrentUser, login, logout, register } from '../controllers/auth.controller.js';
import {
  acceptFriendRequestHandler,
  getFriendsHandler,
  getPendingFriendRequestsHandler,
  refuseFriendRequestHandler,
  sendFriendRequestHandler,
} from '../controllers/friend.controller.js';
import { receiveFriendRequestEvent } from '../controllers/notification.controller.js';
import { createChatRoutes } from './chat.routes.js';
import {
  editUserProfileHandler,
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
  routes.post('/auth/logout', logout);
  routes.post('/users/:username/friend-requests', requireAuth, sendFriendRequestHandler);
  routes.get('/users/:username/pending-friend-requests', requireAuth,
    getPendingFriendRequestsHandler,
  );
  routes.get('/users/:username/friends', getFriendsHandler);
  routes.post('/users/:username/accept-friend', requireAuth, acceptFriendRequestHandler);
  routes.post('/users/:username/recuse-friend', requireAuth, refuseFriendRequestHandler);
  routes.post('/events/friend-request', receiveFriendRequestEvent(io));
  routes.post(
    '/users/:username/photo/upload',
    requireAuth,
    parseProfilePhotoUpload,
    uploadProfilePhotoHandler,
  );
  routes.patch(
    '/users/:username/edit',
    requireAuth,
    parseProfilePhotoUpload,
    editUserProfileHandler,
  );
  routes.get('/users/:username/photo', getUserProfilePhotoHandler);
  routes.get('/users/:username', getPublicUserHandler);
  routes.use('/chat', createChatRoutes(io));

  return routes;
};
