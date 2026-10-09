import type { RequestHandler } from 'express';

export const getHome: RequestHandler = (_request, response): void => {
  response.json({ message: 'WebChat API is running' });
};
