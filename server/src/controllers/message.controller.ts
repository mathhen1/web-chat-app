import type { NextFunction, RequestHandler, Response } from 'express';
import {
  deleteChatMessage,
  MessageServiceError,
} from '../services/message.service.js';
import { getChatRoomName, type ChatSocketServer } from '../socket/chat.types.js';

type DeleteMessageResponse = {
  message?: string;
  error?: string;
};

const handleMessageError = (
  error: unknown,
  response: Response<DeleteMessageResponse>,
  next: NextFunction,
): void => {
  if (error instanceof MessageServiceError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  next(error);
};

export const deleteChatMessageHandler = (
  io: ChatSocketServer,
): RequestHandler<{ messageId: string }, DeleteMessageResponse> => async (
  request,
  response,
  next,
): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const deletedMessage = await deleteChatMessage(
      request.params.messageId,
      request.auth.userId,
    );

    io.to(getChatRoomName(deletedMessage.chat)).emit('chat:message-deleted', {
      chatId: deletedMessage.chat.id,
      messageId: deletedMessage.messageId,
    });

    response.status(200).json({ message: 'Mensagem removida.' });
  } catch (error: unknown) {
    handleMessageError(error, response, next);
  }
};
