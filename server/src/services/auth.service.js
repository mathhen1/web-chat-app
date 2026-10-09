import bcrypt from 'bcrypt';
import User from '../models/user.model.js';

const SALT_ROUNDS = 12;

export class AuthServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AuthServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeUsername(username) {
  if (typeof username !== 'string' || !username.trim()) {
    throw new AuthServiceError('Informe um username válido.', 400);
  }

  return username.trim().toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    throw new AuthServiceError('Informe uma senha válida.', 400);
  }

  if (password.length < 12) {
    throw new AuthServiceError('A senha deve ter pelo menos 12 caracteres.', 400);
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new AuthServiceError('A senha não pode exceder 72 bytes.', 400);
  }

  if (!/\p{Lu}/u.test(password)) {
    throw new AuthServiceError('A senha deve conter pelo menos uma letra maiúscula.', 400);
  }

  if (!/[\p{P}\p{S}]/u.test(password)) {
    throw new AuthServiceError('A senha deve conter pelo menos um símbolo especial.', 400);
  }
}

export async function registerUser({ username, password } = {}) {
  const normalizedUsername = normalizeUsername(username);
  validatePassword(password);

  const existingUser = await User.exists({ username: normalizedUsername });
  if (existingUser) {
    throw new AuthServiceError('Este username já está em uso.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await User.create({
      username: normalizedUsername,
      password: hashedPassword,
    });

    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new AuthServiceError('Este username já está em uso.', 409);
    }

    throw error;
  }
}

export async function loginUser({ username, password } = {}) {
  const normalizedUsername = normalizeUsername(username);

  if (typeof password !== 'string' || !password) {
    throw new AuthServiceError('Informe a senha.', 400);
  }

  const user = await User.findOne({ username: normalizedUsername }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthServiceError('Username ou senha inválidos.', 401);
  }

  return user;
}
