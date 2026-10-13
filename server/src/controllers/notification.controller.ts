import { Receiver } from '@upstash/qstash';
import type { RequestHandler } from 'express';
import { getUserRoomName, type ChatSocketServer } from '../socket/chat.types.js';

type FriendRequestEvent = {
  type: 'friend.request.created';
  recipientId: string;
  sender: { id: string; username: string };
};

const isFriendRequestEvent = (event: unknown): event is FriendRequestEvent => {
  if (!event || typeof event !== 'object') return false;
  const candidate = event as Record<string, unknown>;
  const sender = candidate.sender;
  if (!sender || typeof sender !== 'object') return false;
  const senderDetails = sender as Record<string, unknown>;

  return (
    candidate.type === 'friend.request.created' &&
    typeof candidate.recipientId === 'string' &&
    typeof senderDetails.id === 'string' &&
    typeof senderDetails.username === 'string'
  );
};

export const receiveFriendRequestEvent = (
  io: ChatSocketServer,
): RequestHandler<Record<string, never>, { error?: string }> =>
  async (request, response): Promise<void> => {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    const signature = request.get('Upstash-Signature');

    if (!currentSigningKey || !nextSigningKey || !signature || !request.rawBody) {
      response.status(401).json({ error: 'Assinatura QStash inválida.' });
      return;
    }

    try {
      const receiver = new Receiver({ currentSigningKey, nextSigningKey });
      const isValid = await receiver.verify({ signature, body: request.rawBody });
      if (!isValid) {
        response.status(401).json({ error: 'Assinatura QStash inválida.' });
        return;
      }
    } catch {
      response.status(401).json({ error: 'Assinatura QStash inválida.' });
      return;
    }

    const event: unknown = request.body;
    if (!isFriendRequestEvent(event)) {
      response.status(400).json({ error: 'Evento de notificação inválido.' });
      return;
    }

    io.to(getUserRoomName(event.recipientId)).emit('friend:request', {
      sender: event.sender,
    });

    response.status(200).end();
  };
