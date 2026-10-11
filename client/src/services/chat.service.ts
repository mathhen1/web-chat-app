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

type JoinedChatsResponse = {
  chats?: ChatSummary[]
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
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ChatApiError'
    this.status = status
  }
}

export async function getChatById(id: string, password?: string): Promise<ChatSummary> {
  const headers = new Headers()
  if (password !== undefined) {
    headers.set('x-chat-password', password)
  }

  const response = await fetch(`/api/chat/${encodeURIComponent(id)}`, {
    headers,
    credentials: 'include',
  })
  const result = (await response.json()) as ChatResponse

  if (!response.ok || !result.chat) {
    throw new ChatApiError(
      result.error ?? 'Não foi possível encontrar esta sala.',
      response.status,
    )
  }

  return result.chat
}

export async function deleteChat(id: number): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id }),
  })
  const result = (await response.json()) as { error?: string }

  if (!response.ok) {
    throw new ChatApiError(
      result.error ?? 'Não foi possível deletar a sala.',
      response.status,
    )
  }
}

export async function getPublicChats(page: number): Promise<PublicChatPage> {
  const response = await fetch(`/api/chat?page=${page}`, { credentials: 'include' })
  const result = (await response.json()) as PublicChatPage & { error?: string }

  if (!response.ok || !Array.isArray(result.chats)) {
    throw new ChatApiError(
      result.error ?? 'Não foi possível carregar as salas públicas.',
      response.status,
    )
  }

  return result
}

export async function getJoinedChats(): Promise<ChatSummary[]> {
  const response = await fetch('/api/chat/joined', { credentials: 'include' })
  const result = (await response.json()) as JoinedChatsResponse

  if (!response.ok || !Array.isArray(result.chats)) {
    throw new ChatApiError(
      result.error ?? 'Não foi possível carregar suas salas.',
      response.status,
    )
  }

  return result.chats
}

export async function leaveChat(id: number): Promise<void> {
  const response = await fetch(`/api/chat/${id}/members/me`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const result = (await response.json()) as { error?: string }

  if (!response.ok) {
    throw new ChatApiError(
      result.error ?? 'Não foi possível sair desta sala.',
      response.status,
    )
  }
}
