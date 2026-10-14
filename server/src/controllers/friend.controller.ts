import type { RequestHandler } from 'express';
import {
  acceptFriendRequest,
  createFriendRequest,
  FriendshipServiceError,
  getFriends,
  getPendingFriendRequests,
  removeFriend,
  refuseFriendRequest,
} from '../services/friend.service.js';
import { publishFriendRequestNotification } from '../services/notification.service.js';

type FriendRequestResponse = {
  message?: string;
  requests?: Awaited<ReturnType<typeof getPendingFriendRequests>>;
  friends?: Awaited<ReturnType<typeof getFriends>>;
  error?: string;
};

const respondWithServiceError = (error: unknown, response: Parameters<RequestHandler>[1]): boolean => {
  if (!(error instanceof FriendshipServiceError)) return false;
  response.status(error.statusCode).json({ error: error.message });
  return true;
};

export const sendFriendRequestHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const requestInfo = await createFriendRequest(request.params.username, request.auth.userId);

    try {
      const wasPublished = await publishFriendRequestNotification({
        type: 'friend.request.created',
        ...requestInfo,
      });
      if (!wasPublished) {
        console.warn('PUBLIC_API_URL não definido; evento de amizade não foi enfileirado.');
      }
    } catch {
      console.error('Não foi possível enfileirar o evento de pedido de amizade.');
    }

    response.status(201).json({ message: 'Pedido de amizade enviado.' });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};

export const getPendingFriendRequestsHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const requests = await getPendingFriendRequests(
      request.params.username,
      request.auth.userId,
    );
    response.status(200).json({ requests });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};

export const getFriendsHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  try {
    const friends = await getFriends(request.params.username);
    response.status(200).json({ friends });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};

export const acceptFriendRequestHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    await acceptFriendRequest(request.params.username, request.auth.userId);
    response.status(200).json({ message: 'Pedido de amizade aceito.' });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};

export const refuseFriendRequestHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    await refuseFriendRequest(request.params.username, request.auth.userId);
    response.status(200).json({ message: 'Pedido de amizade recusado.' });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};

export const removeFriendHandler: RequestHandler<
  { username: string },
  FriendRequestResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    await removeFriend(request.params.username, request.auth.userId);
    response.status(200).json({ message: 'Amizade removida.' });
  } catch (error: unknown) {
    if (respondWithServiceError(error, response)) return;
    next(error);
  }
};
