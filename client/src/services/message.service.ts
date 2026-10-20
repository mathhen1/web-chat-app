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
  'chat:message-deleted': (payload: { chatId: number; messageId: string }) => void
  'chat:members-updated': (payload: { chatId: number; members: number }) => void
  'chat:membership-removed': (payload: { chatId: number }) => void
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  const response = await fetch(`/api/chat/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const result = (await response.json()) as { error?: string }

  if (!response.ok) {
    throw new Error(result.error ?? 'Não foi possível apagar a mensagem.')
  }
}
