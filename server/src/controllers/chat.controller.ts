import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { deleteChat, createChat, getChatById, getPublicChats, ChatServiceError, type ChatSummary, type CreateChatPayload } from '../services/chat.service.js';
import type { ChatSocketServer } from '../socket/chat.types.js';
import { removeChatSockets } from '../socket/chat.socket.js';

interface ChatApiResponse {
  chat?: ChatSummary;
  error?: string;
}

interface ChatListApiResponse {
  chats?: ChatSummary[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  error?: string;
}

export const getPublicChatsHandler: RequestHandler<
  Record<string, never>,
  ChatListApiResponse,
  never,
  { page?: string }
> = async (request, response, next): Promise<void> => {
  try {
    const result = await getPublicChats(request.query.page);
    response.status(200).json(result);
  } catch (error: unknown) {
    handleChatError(error, response, next);
  }
};

interface DeleteChatPayload {
  id?: unknown;
}

const handleChatError = (
  error: unknown,
  response: Response<ChatApiResponse>,
  next: NextFunction,
): void => {
  if (error instanceof ChatServiceError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  next(error);
};

export const createChatHandler: RequestHandler<Record<string, never>, ChatApiResponse, CreateChatPayload> = async (
  request,
  response,
  next,
): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const chat = await createChat(request.auth.userId, request.body);
    response.status(201).json({ chat });
  } catch (error: unknown) {
    handleChatError(error, response, next);
  }
};

export const getChatHandler: RequestHandler<{ id: string }, ChatApiResponse> = async (
  request,
  response,
  next,
): Promise<void> => {
  const passwordHeader = request.headers['x-chat-password'];
  const password = typeof passwordHeader === 'string' ? passwordHeader : undefined;

  try {
    const chat = await getChatById(request.params.id, password);
    response.status(200).json({ chat });
  } catch (error: unknown) {
    handleChatError(error, response, next);
  }
};

export const deleteChatHandler = (io: ChatSocketServer): RequestHandler<
  Record<string, never>,
  ChatApiResponse,
  DeleteChatPayload
> => async (
  request: Request<Record<string, never>, ChatApiResponse, DeleteChatPayload>,
  response: Response<ChatApiResponse>,
  next: NextFunction,
): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const chat = await deleteChat(request.body.id, request.auth.userId);
    await removeChatSockets(io, chat);
    response.status(200).json({ chat });
  } catch (error: unknown) {
    handleChatError(error, response, next);
  }
};
