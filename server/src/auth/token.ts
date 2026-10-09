import { SignJWT } from 'jose';
import type { Response } from 'express';
import type { UserDocument } from '../models/user.model.js';

const TOKEN_COOKIE = 'token';
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('A variável de ambiente JWT_SECRET não foi definida.');
  }

  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('A variável JWT_SECRET deve ter pelo menos 32 bytes.');
  }

  return secret;
};

export const assertJwtSecret = (): void => {
  getJwtSecret();
};

export const setAuthCookie = async (response: Response, user: UserDocument): Promise<void> => {
  const secret = getJwtSecret();
  const token = await new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secret));

  response.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_LIFETIME_MS,
    path: '/',
  });
};
