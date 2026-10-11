export type ChatSummary = {
  id: number
  name: string
  members: number
  description: string
  visible: boolean
  author: string
}

type ChatResponse = {
  chat?: ChatSummary
  error?: string
}

export type PublicChatPage = {
  chats: ChatSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

export async function getChatById(id: string, password?: string): Promise<ChatSummary> {
  const headers = new Headers()
  if (password !== undefined) headers.set('x-chat-password', password)

  const response = await fetch(`/api/chat/${encodeURIComponent(id)}`, {
    headers,
    credentials: 'include',
  })
  const result = (await response.json()) as ChatResponse

  if (!response.ok || !result.chat) {
    throw new ChatApiError(result.error ?? 'Não foi possível encontrar esta sala.', response.status)
  }

  return result.chat
}

export async function getPublicChats(page: number): Promise<PublicChatPage> {
  const response = await fetch(`/api/chat?page=${page}`, { credentials: 'include' })
  const result = (await response.json()) as PublicChatPage & { error?: string }

  if (!response.ok || !Array.isArray(result.chats)) {
    throw new ChatApiError(result.error ?? 'Não foi possível carregar as salas públicas.', response.status)
  }

  return result
}
