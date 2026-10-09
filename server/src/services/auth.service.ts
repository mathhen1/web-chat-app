import bcrypt from 'bcrypt';
import UserModel, { type UserDocument } from '../models/user.model.js';

const SALT_ROUNDS = 12;

export interface AuthPayload {
  username?: unknown;
  password?: unknown;
}

export class AuthServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.statusCode = statusCode;
  }
}

const normalizeUsername = (username: unknown): string => {
  if (typeof username !== 'string' || !username.trim()) {
    throw new AuthServiceError('Informe um username válido.', 400);
  }

  return username.trim().toLowerCase();
};

const validatePassword: (password: unknown) => asserts password is string = (password) => {
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
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;

export const registerUser = async ({ username, password }: AuthPayload = {}): Promise<UserDocument> => {
  const normalizedUsername = normalizeUsername(username);
  validatePassword(password);

  const existingUser = await UserModel.exists({ username: normalizedUsername });
  if (existingUser) {
    throw new AuthServiceError('Este username já está em uso.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await UserModel.create({
      username: normalizedUsername,
      password: hashedPassword,
    });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AuthServiceError('Este username já está em uso.', 409);
    }

    throw error;
  }
};

export const loginUser = async ({ username, password }: AuthPayload = {}): Promise<UserDocument> => {
  const normalizedUsername = normalizeUsername(username);

  if (typeof password !== 'string' || !password) {
    throw new AuthServiceError('Informe a senha.', 400);
  }

  const user = await UserModel.findOne({ username: normalizedUsername }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AuthServiceError('Username ou senha inválidos.', 401);
  }

  return user;
};
