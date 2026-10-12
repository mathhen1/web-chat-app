import UserModel from '../models/user.model.js';

export interface PublicUser {
  id: string;
  username: string;
  status: string;
  profilePhoto: string | null;
}

export interface UserProfilePhoto {
  buffer: Buffer;
  contentType: string;
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

  const user = await UserModel.findOne({ username })
    .select('_id username status')
    .select('+profilePhotoContentType');
  if (!user) throw new UserServiceError('Usuário não encontrado.', 404);

  return {
    id: user._id.toString(),
    username: user.username,
    status: user.status ?? '',
    profilePhoto: user.profilePhotoContentType
      ? `/api/users/${encodeURIComponent(user.username)}/photo`
      : null,
  };
};

export const updateUserProfilePhoto = async (
  usernameInput: unknown,
  authenticatedUserId: string,
  buffer: Buffer,
  contentType: string,
): Promise<PublicUser> => {
  const username = typeof usernameInput === 'string' ? usernameInput.trim().toLowerCase() : '';
  if (!username) throw new UserServiceError('Informe um nome de usuário válido.', 400);

  const user = await UserModel.findOne({ username }).select('_id');
  if (!user) throw new UserServiceError('Usuário não encontrado.', 404);
  if (user._id.toString() !== authenticatedUserId) {
    throw new UserServiceError('Você só pode atualizar sua própria foto.', 403);
  }

  await UserModel.updateOne(
    { _id: user._id },
    {
      $set: {
        profilePhoto: buffer,
        profilePhotoContentType: contentType,
      },
    },
  );

  return getPublicUserByUsername(username);
};

export const getUserProfilePhoto = async (
  usernameInput: unknown,
): Promise<UserProfilePhoto> => {
  const username = typeof usernameInput === 'string' ? usernameInput.trim().toLowerCase() : '';
  if (!username) throw new UserServiceError('Informe um nome de usuário válido.', 400);

  const user = await UserModel.findOne({ username })
    .select('+profilePhoto +profilePhotoContentType');
  if (!user) throw new UserServiceError('Usuário não encontrado.', 404);
  if (!user.profilePhoto || !user.profilePhotoContentType) {
    throw new UserServiceError('Este usuário ainda não possui uma foto.', 404);
  }

  return {
    buffer: user.profilePhoto,
    contentType: user.profilePhotoContentType,
  };
};
