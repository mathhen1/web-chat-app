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

export interface ProfileEditInput {
  username?: unknown;
  status?: unknown;
  password?: unknown;
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

export const updateUserProfile = async (
  usernameInput: unknown,
  authenticatedUserId: string,
  changes: ProfileEditInput,
  photo?: UserProfilePhoto,
): Promise<PublicUser> => {
  const currentUsername =
    typeof usernameInput === 'string' ? usernameInput.trim().toLowerCase() : '';
  if (!currentUsername) {
    throw new UserServiceError('Informe um nome de usuário válido.', 400);
  }
  if (changes.password !== undefined) {
    throw new UserServiceError('A senha não pode ser alterada por esta rota.', 400);
  }

  const hasUsername = changes.username !== undefined;
  const hasStatus = changes.status !== undefined;
  if (!hasUsername && !hasStatus && !photo) {
    throw new UserServiceError('Informe ao menos um dado do perfil para atualizar.', 400);
  }

  const user = await UserModel.findOne({ username: currentUsername }).select('_id');
  if (!user) throw new UserServiceError('Usuário não encontrado.', 404);
  if (user._id.toString() !== authenticatedUserId) {
    throw new UserServiceError('Você só pode atualizar seu próprio perfil.', 403);
  }

  const updates: Record<string, unknown> = {};
  let updatedUsername = currentUsername;

  if (hasUsername) {
    if (typeof changes.username !== 'string' || !changes.username.trim()) {
      throw new UserServiceError('Informe um nome de usuário válido.', 400);
    }
    updatedUsername = changes.username.trim().toLowerCase();
    updates.username = updatedUsername;
  }

  if (hasStatus) {
    if (typeof changes.status !== 'string') {
      throw new UserServiceError('Informe um status válido.', 400);
    }
    if (changes.status.length > 280) {
      throw new UserServiceError('O status não pode exceder 280 caracteres.', 400);
    }
    updates.status = changes.status;
  }

  if (photo) {
    updates.profilePhoto = photo.buffer;
    updates.profilePhotoContentType = photo.contentType;
  }

  try {
    await UserModel.updateOne({ _id: user._id }, { $set: updates }, { runValidators: true });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new UserServiceError('Este nome de usuário já está em uso.', 409);
    }
    throw error;
  }

  return getPublicUserByUsername(updatedUsername);
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
