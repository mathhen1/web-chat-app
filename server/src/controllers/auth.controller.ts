import type { RequestHandler } from 'express';
import { assertJwtSecret, setAuthCookie } from '../auth/token.js';
import {
  AuthServiceError,
  loginUser,
  registerUser,
  type AuthPayload,
} from '../services/auth.service.js';

interface PublicUser {
  id: string;
  username: string;
}

interface AuthResponse {
  message?: string;
  user?: PublicUser;
  error?: string;
}

const publicUser = (user: { _id: unknown; username: string }): PublicUser => ({
  id: String(user._id),
  username: user.username,
});

export const register: RequestHandler<Record<string, never>, AuthResponse, AuthPayload> = async (
  request,
  response,
  next,
): Promise<void> => {
  try {
    assertJwtSecret();
    const user = await registerUser(request.body);
    await setAuthCookie(response, user);

    response.status(201).json({
      message: 'Conta criada com sucesso.',
      user: publicUser(user),
    });
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    next(error);
  }
};

export const login: RequestHandler<Record<string, never>, AuthResponse, AuthPayload> = async (
  request,
  response,
  next,
): Promise<void> => {
  try {
    assertJwtSecret();
    const user = await loginUser(request.body);
    await setAuthCookie(response, user);

    response.status(200).json({
      message: 'Login realizado com sucesso.',
      user: publicUser(user),
    });
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    next(error);
  }
};
