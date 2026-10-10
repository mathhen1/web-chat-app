import type { RequestHandler } from 'express';
import UserModel from '../models/user.model.js';
import { verifyAuthToken } from '../auth/token.js';

const getCookieToken = (cookieHeader?: string): string | undefined =>
  cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.slice('token='.length);

export const requireAuth: RequestHandler = async (request, response, next): Promise<void> => {
  const token = getCookieToken(request.headers.cookie);
  if (!token) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  let payload;
  try {
    ({ payload } = await verifyAuthToken(token));
  } catch {
    response.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  if (!payload.sub || typeof payload.username !== 'string') {
    response.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  try {
    const user = await UserModel.findById(payload.sub).select('_id username');
    if (!user) {
      response.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    request.auth = { userId: user._id.toString(), username: user.username };
    next();
  } catch (error: unknown) {
    next(error);
  }
};
