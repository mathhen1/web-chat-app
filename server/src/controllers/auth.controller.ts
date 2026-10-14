import type { RequestHandler } from 'express';
import { assertJwtSecret, clearAuthCookie, setAuthCookie, verifyAuthToken } from '../auth/token.js';
import UserModel from '../models/user.model.js';
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

const unauthorizedResponse: AuthResponse = { error: 'Sessão inválida ou expirada.' };

export const getCurrentUser: RequestHandler<Record<string, never>, AuthResponse> = async (
  request,
  response,
  next,
): Promise<void> => {
  const tokenCookie = request.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='));
  const token = tokenCookie?.slice('token='.length);

  if (!token) {
    response.status(401).json(unauthorizedResponse);
    return;
  }

  let subject: string;
  try {
    const { payload } = await verifyAuthToken(token);
    if (!payload.sub) {
      response.status(401).json(unauthorizedResponse);
      return;
    }
    subject = payload.sub;
  } catch {
    response.status(401).json(unauthorizedResponse);
    return;
  }

  try {
    const user = await UserModel.findById(subject).select('_id username');
    if (!user) {
      response.status(401).json(unauthorizedResponse);
      return;
    }

    response.status(200).json({ user: publicUser(user) });
  } catch (error: unknown) {
    next(error);
  }
};

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

export const logout: RequestHandler<Record<string, never>, AuthResponse> = (
  _request,
  response,
): void => {
  clearAuthCookie(response);
  response.status(200).json({ message: 'Logout realizado com sucesso.' });
};
