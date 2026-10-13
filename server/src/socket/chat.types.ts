import type { Server } from 'socket.io';
import type { ChatSummary } from '../services/chat.service.js';
import type { ChatMessageSummary } from '../services/message.service.js';

export interface JoinChatPayload {
  id: number;
  password?: string;
}

export interface ChatSocketResult {
  ok: boolean;
  message?: string;
  chat?: ChatSummary;
  messages?: ChatMessageSummary[];
}

export interface SendMessagePayload {
  chatId: number;
  content: string;
}

export interface SendMessageResult {
  ok: boolean;
  message?: string;
  chatMessage?: ChatMessageSummary;
}

export interface ClientToServerEvents {
  'chat:join': (payload: JoinChatPayload, acknowledge: (result: ChatSocketResult) => void) => void;
  'message:send': (payload: SendMessagePayload, acknowledge: (result: SendMessageResult) => void) => void;
}

export interface ServerToClientEvents {
  'friend:request': (payload: { sender: { id: string; username: string } }) => void;
  'chat:deleted': (payload: { id: number }) => void;
  'chat:message': (payload: ChatMessageSummary) => void;
  'chat:members-updated': (payload: { chatId: number; members: number }) => void;
  'chat:membership-removed': (payload: { chatId: number }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  username: string;
  joinedChats: Map<number, string>;
}

export type ChatSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const getChatRoomName = (chat: Pick<ChatSummary, 'id' | 'name'>): string =>
  `chat:${chat.id}:${encodeURIComponent(chat.name.trim().toLowerCase())}`;

export const getUserRoomName = (userId: string): string => `user:${userId}`;
