import { Types } from 'mongoose';
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
  constructor(message: string) {
    super(message);
    this.name = 'MessageServiceError';
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
