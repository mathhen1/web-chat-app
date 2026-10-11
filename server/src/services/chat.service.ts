import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import ChatModel, { type ChatDocument } from '../models/chat.model.js';
import ChatCounterModel from '../models/chat-counter.model.js';
import UserModel from '../models/user.model.js';

const SALT_ROUNDS = 12;

export interface CreateChatPayload {
  name?: unknown;
  description?: unknown;
  desc?: unknown;
  visible?: unknown;
  password?: unknown;
}

export interface ChatSummary {
  id: number;
  name: string;
  members: number;
  description: string;
  visible: boolean;
  author: string;
}

export interface JoinedChatList {
  chats: ChatSummary[];
}

export interface PublicChatPage {
  chats: ChatSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class ChatServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ChatServiceError';
    this.statusCode = statusCode;
  }
}

const toChatSummary = (chat: ChatDocument): ChatSummary => ({
  id: chat.id,
  name: chat.name,
  members: chat.members.length,
  description: chat.description,
  visible: chat.visible,
  author: String(chat.author),
});

const parseChatId = (id: unknown): number => {
  const parsedId = typeof id === 'number' ? id : Number(id);
  if (!Number.isSafeInteger(parsedId) || parsedId < 1) {
    throw new ChatServiceError('O id do chat deve ser um número inteiro positivo.', 400);
  }
  return parsedId;
};

export const createChat = async (
  authorId: string,
  payload: CreateChatPayload = {},
): Promise<ChatSummary> => {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name) {
    throw new ChatServiceError('Informe um nome para o chat.', 400);
  }

  const descriptionInput = payload.description ?? payload.desc ?? '';
  if (typeof descriptionInput !== 'string') {
    throw new ChatServiceError('A descrição do chat deve ser um texto.', 400);
  }

  const visible = payload.visible === undefined ? true : payload.visible;
  if (typeof visible !== 'boolean') {
    throw new ChatServiceError('O campo visible deve ser booleano.', 400);
  }

  if (!Types.ObjectId.isValid(authorId)) {
    throw new ChatServiceError('Usuário autenticado inválido.', 401);
  }

  const authorExists = await UserModel.exists({ _id: authorId });
  if (!authorExists) {
    throw new ChatServiceError('Usuário autenticado não encontrado.', 401);
  }

  let hashedPassword: string | undefined;
  if (!visible) {
    if (typeof payload.password !== 'string' || payload.password.length === 0) {
      throw new ChatServiceError('Informe uma senha para o chat privado.', 400);
    }
    hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS);
  }

  const counter = await ChatCounterModel.findOneAndUpdate(
    { _id: 'chat' },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!counter) {
    throw new Error('Não foi possível gerar o id do chat.');
  }

  const chat = await ChatModel.create({
    id: counter.sequence,
    name,
    members: [],
    description: descriptionInput.trim(),
    visible,
    author: new Types.ObjectId(authorId),
    ...(hashedPassword ? { password: hashedPassword } : {}),
  });

  return toChatSummary(chat);
};

export const getChatById = async (
  id: unknown,
  password?: string,
  userId?: string,
): Promise<ChatSummary> => {
  const chatId = parseChatId(id);
  const chat = await ChatModel.findOne({ id: chatId }).select('+password');

  if (!chat) {
    throw new ChatServiceError('Chat não encontrado.', 404);
  }

  if (!chat.visible) {
    const isMember = userId
      ? chat.members.some((memberId) => memberId.toString() === userId)
      : false;
    if (!isMember) {
      const hasValidPassword =
        password !== undefined &&
        chat.password !== undefined &&
        (await bcrypt.compare(password, chat.password));

      if (!hasValidPassword) {
        throw new ChatServiceError('Senha do chat inválida.', 401);
      }
    }
  }

  return toChatSummary(chat);
};

export const getPublicChats = async (pageInput: unknown): Promise<PublicChatPage> => {
  const page = pageInput === undefined ? 1 : Number(pageInput);
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ChatServiceError('A página deve ser um número inteiro positivo.', 400);
  }

  const pageSize = 6;
  const filter = { visible: true };
  const [chats, total] = await Promise.all([
    ChatModel.find(filter).sort({ id: 1 }).skip((page - 1) * pageSize).limit(pageSize),
    ChatModel.countDocuments(filter),
  ]);

  return {
    chats: chats.map(toChatSummary),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getJoinedChats = async (userId: string): Promise<JoinedChatList> => {
  const chats = await ChatModel.find({ members: new Types.ObjectId(userId) }).sort({ id: 1 });

  return { chats: chats.map(toChatSummary) };
};

export const addChatMember = async (
  id: number,
  userId: string,
): Promise<ChatSummary> => {
  const chat = await ChatModel.findOneAndUpdate(
    { id },
    { $addToSet: { members: new Types.ObjectId(userId) } },
    { new: true },
  );

  if (!chat) {
    throw new ChatServiceError('Chat não encontrado.', 404);
  }

  return toChatSummary(chat);
};

export const removeChatMember = async (
  id: unknown,
  userId: string,
): Promise<ChatSummary> => {
  const chatId = parseChatId(id);
  const chat = await ChatModel.findOneAndUpdate(
    { id: chatId, members: new Types.ObjectId(userId) },
    { $pull: { members: new Types.ObjectId(userId) } },
    { new: true },
  );

  if (chat) {
    return toChatSummary(chat);
  }

  const chatExists = await ChatModel.exists({ id: chatId });
  if (!chatExists) {
    throw new ChatServiceError('Chat não encontrado.', 404);
  }

  throw new ChatServiceError('Você não está inscrito neste chat.', 409);
};

export const migrateLegacyChatMembers = async (): Promise<void> => {
  await ChatModel.updateMany(
    { members: { $not: { $type: 'array' } } },
    [{ $set: { members: [] } }],
    { updatePipeline: true }
  );
};

export const deleteChat = async (id: unknown, authorId: string): Promise<ChatSummary> => {
  const chatId = parseChatId(id);
  const chat = await ChatModel.findOneAndDelete({ id: chatId, author: authorId });

  if (chat) {
    return toChatSummary(chat);
  }

  const chatExists = await ChatModel.exists({ id: chatId });
  if (!chatExists) {
    throw new ChatServiceError('Chat não encontrado.', 404);
  }

  throw new ChatServiceError('Somente o autor pode remover este chat.', 403);
};

