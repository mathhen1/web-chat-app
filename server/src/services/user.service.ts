import UserModel from '../models/user.model.js';

export interface PublicUser {
  id: string;
  username: string;
}

export class UserServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'UserServiceError';
    this.statusCode = statusCode;
  }
}

export const getPublicUserByUsername = async (usernameInput: unknown): Promise<PublicUser> => {
  const username = typeof usernameInput === 'string' ? usernameInput.trim().toLowerCase() : '';
  if (!username) throw new UserServiceError('Informe um nome de usuário válido.', 400);

  const user = await UserModel.findOne({ username }).select('_id username');
  if (!user) throw new UserServiceError('Usuário não encontrado.', 404);

  return { id: user._id.toString(), username: user.username };
};
