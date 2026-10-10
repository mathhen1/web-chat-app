import type { Server } from 'socket.io';
import type { ChatSummary } from '../services/chat.service.js';

export interface JoinChatPayload {
  id: number;
  password?: string;
}

export interface LeaveChatPayload {
  id: number;
}

export interface ChatSocketResult {
  ok: boolean;
  message?: string;
  chat?: ChatSummary;
}

export interface ClientToServerEvents {
  'chat:join': (payload: JoinChatPayload, acknowledge: (result: ChatSocketResult) => void) => void;
  'chat:leave': (payload: LeaveChatPayload, acknowledge: (result: ChatSocketResult) => void) => void;
}

export interface ServerToClientEvents {
  'chat:deleted': (payload: { id: number }) => void;
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
