import { Realtime } from '@upstash/realtime';
import { Redis } from '@upstash/redis';
import { z } from 'zod';

const notificationSchema = {
  friend: {
    request: {
      created: z.object({
        sender: z.object({
          id: z.string(),
          username: z.string(),
        }),
      }),
    },
  },
};

const createRealtimeClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN devem estar configurados.');
  }

  const redis = new Redis({ url, token });

  return new Realtime({
    schema: notificationSchema,
    redis,
    history: {
      maxLength: 100,
      expireAfterSecs: 24 * 60 * 60,
    },
  });
};

type RealtimeClient = ReturnType<typeof createRealtimeClient>;

let realtimeClient: RealtimeClient | undefined;

export const getRealtimeClient = (): RealtimeClient => {
  if (!realtimeClient) realtimeClient = createRealtimeClient();
  return realtimeClient;
};
