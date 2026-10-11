import type { ChatSummary } from './chat.service'

export type ChatMessage = {
  id: string
  author: { id: string; username: string }
  content: string
  timestamp: string
  date: string
}

export type ChatSocketResult = {
  ok: boolean
  message?: string
  chat?: ChatSummary
  messages?: ChatMessage[]
}

export type SendMessageResult = {
  ok: boolean
  message?: string
  chatMessage?: ChatMessage
}

export type ChatClientToServerEvents = {
  'chat:join': (
    payload: { id: number; password?: string },
    acknowledge: (result: ChatSocketResult) => void,
  ) => void
  'message:send': (
    payload: { chatId: number; content: string },
    acknowledge: (result: SendMessageResult) => void,
  ) => void
}

export type ChatServerToClientEvents = {
  'chat:deleted': (payload: { id: number }) => void
  'chat:message': (payload: ChatMessage) => void
  'chat:members-updated': (payload: { chatId: number; members: number }) => void
  'chat:membership-removed': (payload: { chatId: number }) => void
}
