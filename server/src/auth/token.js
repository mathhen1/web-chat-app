import { SignJWT } from 'jose';

const TOKEN_COOKIE = 'token';
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('A variável de ambiente JWT_SECRET não foi definida.');
  }

  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('A variável JWT_SECRET deve ter pelo menos 32 bytes.');
  }

  return secret;
}

export function assertJwtSecret() {
  getJwtSecret();
}

export async function setAuthCookie(response, user) {
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
}
