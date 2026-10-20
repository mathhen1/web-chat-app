export const FRIEND_REQUEST_RECEIVED_EVENT = 'friend-request-received'

export type FriendRequestNotification = {
  sender: {
    id: string
    username: string
  }
}

export function isFriendRequestNotification(
  value: unknown,
): value is FriendRequestNotification {
  if (!value || typeof value !== 'object') return false

  const sender = (value as { sender?: unknown }).sender
  if (!sender || typeof sender !== 'object') return false

  const senderDetails = sender as { id?: unknown; username?: unknown }
  return typeof senderDetails.id === 'string' && typeof senderDetails.username === 'string'
}
