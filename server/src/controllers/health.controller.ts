import type { RequestHandler } from 'express';

export const getHealth: RequestHandler = (_request, response): void => {
  response.json({ status: 'ok' });
};
