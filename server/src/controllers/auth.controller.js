import { assertJwtSecret, setAuthCookie } from '../auth/token.js';
import { loginUser, registerUser, AuthServiceError } from '../services/auth.service.js';

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
  };
}

export async function register(request, response, next) {
  try {
    assertJwtSecret();
    const user = await registerUser(request.body);
    await setAuthCookie(response, user);

    return response.status(201).json({
      message: 'Conta criada com sucesso.',
      user: publicUser(user),
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return response.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    assertJwtSecret();
    const user = await loginUser(request.body);
    await setAuthCookie(response, user);

    return response.status(200).json({
      message: 'Login realizado com sucesso.',
      user: publicUser(user),
    });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      return response.status(error.statusCode).json({ error: error.message });
    }

    return next(error);
  }
}
