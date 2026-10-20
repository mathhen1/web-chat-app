import { Receiver } from '@upstash/qstash';
import { CursorUnavailableError, isRealtimeCursor } from '@upstash/realtime';
import type { RequestHandler } from 'express';
import { getRealtimeClient } from '../lib/realtime.js';
import { deliverFriendRequestNotification } from '../services/notification.service.js';
import { getUserRoomName } from '../socket/chat.types.js';

type FriendRequestEvent = {
  type: 'friend.request.created';
  recipientId: string;
  sender: { id: string; username: string };
};

type FriendRequestRealtimeEvent = {
  event: 'friend.request.created';
  data: { sender: { id: string; username: string } };
  cursor: string;
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

export const receiveFriendRequestEvent: RequestHandler<
  Record<string, never>,
  { error?: string }
> = async (request, response): Promise<void> => {
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

  await deliverFriendRequestNotification(event);

  response.status(200).end();
};

export const streamNotifications: RequestHandler = async (
  request,
  response,
): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const realtime = getRealtimeClient();
  const userChannel = getUserRoomName(request.auth.userId);
  let unsubscribe: (() => void) | undefined;
  let clientDisconnected = false;

  response.status(200).set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });
  response.flushHeaders();
  response.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    response.write(': keep-alive\n\n');
  }, 25_000);

  const closeStream = (): void => {
    clientDisconnected = true;
    clearInterval(heartbeat);
    unsubscribe?.();
  };

  response.on('close', closeStream);

  try {
    const channel = realtime.channel(userChannel);
    const onData = ({ event, data, cursor }: FriendRequestRealtimeEvent): void => {
      if (clientDisconnected || response.writableEnded) return;

      response.write(`id: ${cursor}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const events = ['friend.request.created'] as const;
    const lastEventId = request.get('Last-Event-ID');

    if (lastEventId && isRealtimeCursor(lastEventId)) {
      try {
        unsubscribe = await channel.subscribe({ events, after: lastEventId, onData });
      } catch (error: unknown) {
        if (!(error instanceof CursorUnavailableError)) throw error;

        response.write('id:\n\n');
        unsubscribe = await channel.subscribe({ events, onData });
      }
    } else {
      unsubscribe = await channel.subscribe({ events, onData });
    }

    if (clientDisconnected) unsubscribe();
  } catch (error: unknown) {
    clearInterval(heartbeat);
    response.off('close', closeStream);

    if (clientDisconnected) return;
    console.error('Não foi possível iniciar o fluxo de notificações.', error);
    response.end();
  }
};
