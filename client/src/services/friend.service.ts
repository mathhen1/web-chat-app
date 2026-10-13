export type FriendProfile = {
  id: string
  username: string
  status: string
  profilePhoto: string | null
}

type FriendResponse = {
  friends?: FriendProfile[]
  requests?: FriendProfile[]
  message?: string
  error?: string
}

export class FriendApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FriendApiError'
    this.status = status
  }
}

async function sendFriendRequestAction(
  username: string,
  action: 'GET' | 'POST',
  endpoint: string,
): Promise<FriendResponse> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(username)}/${endpoint}`,
    { method: action, credentials: 'include' },
  )
  const result = (await response.json()) as FriendResponse

  if (!response.ok) {
    throw new FriendApiError(result.error ?? 'Não foi possível atualizar suas amizades.', response.status)
  }

  return result
}

export async function getFriends(username: string): Promise<FriendProfile[]> {
  const result = await sendFriendRequestAction(username, 'GET', 'friends')
  return result.friends ?? []
}

export async function getPendingFriendRequests(username: string): Promise<FriendProfile[]> {
  const result = await sendFriendRequestAction(username, 'GET', 'pending-friend-requests')
  return result.requests ?? []
}

export async function sendFriendRequest(username: string): Promise<void> {
  await sendFriendRequestAction(username, 'POST', 'friend-requests')
}

export async function acceptFriendRequest(username: string): Promise<void> {
  await sendFriendRequestAction(username, 'POST', 'accept-friend')
}

export async function refuseFriendRequest(username: string): Promise<void> {
  await sendFriendRequestAction(username, 'POST', 'recuse-friend')
}
