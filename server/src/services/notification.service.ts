import { Client } from '@upstash/qstash';
import { getRealtimeClient } from '../lib/realtime.js';
import { getUserRoomName } from '../socket/chat.types.js';

export interface FriendRequestNotificationEvent {
  type: 'friend.request.created';
  recipientId: string;
  sender: {
    id: string;
    username: string;
  };
}

export const publishFriendRequestNotification = async (
  event: FriendRequestNotificationEvent,
): Promise<boolean> => {
  const publicApiUrl = process.env.PUBLIC_API_URL?.trim().replace(/\/$/, '');
  const token = process.env.QSTASH_TOKEN;
  const qstashUrl = process.env.QSTASH_URL;

  if (!publicApiUrl) return false;
  if (!token) throw new Error('QSTASH_TOKEN não foi configurado.');

  const client = new Client({
    token,
    ...(qstashUrl ? { baseUrl: qstashUrl } : {}),
  });

  await client.publishJSON({
    url: `${publicApiUrl}/events/friend-request`,
    body: event,
    headers: {
      "Upstash-Forward-bypass-tunnel-reminder": "true"
    }
  });

  return true;
};

export const deliverFriendRequestNotification = async (
  event: FriendRequestNotificationEvent,
): Promise<void> => {
  await getRealtimeClient()
    .channel(getUserRoomName(event.recipientId))
    .emit('friend.request.created', {
      sender: event.sender,
    });
};
