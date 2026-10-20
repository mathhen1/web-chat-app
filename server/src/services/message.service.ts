import { Types } from 'mongoose';
import ChatModel from '../models/chat.model.js';
import MessageModel from '../models/message.model.js';

export interface ChatMessageSummary {
  id: string;
  author: { id: string; username: string };
  content: string;
  timestamp: string;
  date: string;
}

type PopulatedAuthor = { _id: Types.ObjectId; username: string };

export class MessageServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'MessageServiceError';
    this.statusCode = statusCode;
  }
}

const serializeMessage = (message: {
  _id: Types.ObjectId;
  author: unknown;
  content: string;
  timestamp: string;
  date: string;
}): ChatMessageSummary => {
  const author = message.author as PopulatedAuthor;
  return {
    id: message._id.toString(),
    author: { id: author._id.toString(), username: author.username },
    content: message.content,
    timestamp: message.timestamp,
    date: message.date,
  };
};

export const getRecentChatMessages = async (chatId: number): Promise<ChatMessageSummary[]> => {
  const messages = await MessageModel.find({ chatId })
    .sort({ _id: -1 })
    .limit(100)
    .populate<{ author: PopulatedAuthor }>({ path: 'author', select: '_id username' });

  return messages.reverse().map(serializeMessage);
};

export const createChatMessage = async (
  chatId: number,
  authorId: string,
  contentInput: unknown,
): Promise<ChatMessageSummary> => {
  const content = typeof contentInput === 'string' ? contentInput.trim() : '';
  if (!content) {
    throw new MessageServiceError('A mensagem não pode estar vazia.');
  }

  if (content.length > 2000) {
    throw new MessageServiceError('A mensagem deve ter no máximo 2000 caracteres.');
  }

  const message = await MessageModel.create({
    chatId,
    author: new Types.ObjectId(authorId),
    content,
  });
  await message.populate<{ author: PopulatedAuthor }>({ path: 'author', select: '_id username' });
  return serializeMessage(message);
};

export interface DeletedChatMessage {
  messageId: string;
  chat: { id: number; name: string };
}

export const deleteChatMessage = async (
  messageIdInput: unknown,
  userId: string,
): Promise<DeletedChatMessage> => {
  if (typeof messageIdInput !== 'string' || !/^[a-f\d]{24}$/i.test(messageIdInput)) {
    throw new MessageServiceError('O id da mensagem é inválido.', 400);
  }

  const message = await MessageModel.findById(messageIdInput).select('_id author chatId');
  if (!message) {
    throw new MessageServiceError('Mensagem não encontrada.', 404);
  }

  const chat = await ChatModel.findOne({ id: message.chatId }).select('id name author');
  if (!chat) {
    throw new MessageServiceError('Chat não encontrado.', 404);
  }

  const isMessageAuthor = message.author.toString() === userId;
  const isChatAuthor = chat.author.toString() === userId;
  if (!isMessageAuthor && !isChatAuthor) {
    throw new MessageServiceError('Você não tem permissão para apagar esta mensagem.', 403);
  }

  const deletion = await MessageModel.deleteOne({ _id: message._id });
  if (deletion.deletedCount === 0) {
    throw new MessageServiceError('Mensagem não encontrada.', 404);
  }

  return {
    messageId: message._id.toString(),
    chat: { id: chat.id, name: chat.name },
  };
};
