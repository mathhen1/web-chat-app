import mongoose, { Types } from 'mongoose';
import UserModel from '../models/user.model.js';

export interface FriendRequestSender {
  id: string;
  username: string;
}

export interface PendingFriendRequest {
  id: string;
  username: string;
  status: string;
  profilePhoto: string | null;
}

export class FriendshipServiceError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'FriendshipServiceError';
    this.statusCode = statusCode;
  }
}

const normalizeUsername = (username: unknown): string =>
  typeof username === 'string' ? username.trim().toLowerCase() : '';

export const createFriendRequest = async (
  recipientUsername: unknown,
  senderId: string,
): Promise<{ recipientId: string; sender: FriendRequestSender }> => {
  const username = normalizeUsername(recipientUsername);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const [recipient, sender] = await Promise.all([
    UserModel.findOne({ username }).select('_id friends pendingFriends'),
    UserModel.findById(senderId).select('_id username pendingFriends'),
  ]);

  if (!recipient) throw new FriendshipServiceError('Usuário não encontrado.', 404);
  if (!sender) throw new FriendshipServiceError('Sessão inválida ou expirada.', 401);
  if (recipient._id.equals(sender._id)) {
    throw new FriendshipServiceError('Você não pode enviar um pedido para si mesmo.', 400);
  }
  if (recipient.friends.some((friendId) => friendId.equals(sender._id))) {
    throw new FriendshipServiceError('Este usuário já está na sua lista de amigos.', 409);
  }
  if (recipient.pendingFriends.some((pendingId) => pendingId.equals(sender._id))) {
    throw new FriendshipServiceError('Você já enviou um pedido para este usuário.', 409);
  }
  if (sender.pendingFriends.some((pendingId) => pendingId.equals(recipient._id))) {
    throw new FriendshipServiceError('Este usuário já enviou um pedido para você.', 409);
  }

  const update = await UserModel.updateOne(
    {
      _id: recipient._id,
      friends: { $ne: sender._id },
      pendingFriends: { $ne: sender._id },
    },
    { $addToSet: { pendingFriends: sender._id } },
  );

  if (update.modifiedCount === 0) {
    throw new FriendshipServiceError('Não foi possível enviar este pedido de amizade.', 409);
  }

  return {
    recipientId: recipient._id.toString(),
    sender: { id: sender._id.toString(), username: sender.username },
  };
};

export const getPendingFriendRequests = async (
  usernameInput: unknown,
  authenticatedUserId: string,
): Promise<PendingFriendRequest[]> => {
  const username = normalizeUsername(usernameInput);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const recipient = await UserModel.findOne({ username })
    .select('_id pendingFriends')
    .populate<{
      pendingFriends: Array<{
        _id: Types.ObjectId;
        username: string;
        status: string;
        profilePhotoContentType?: string;
      }>;
    }>({
      path: 'pendingFriends',
      select: '_id username status +profilePhotoContentType',
    });

  if (!recipient) throw new FriendshipServiceError('Usuário não encontrado.', 404);
  if (recipient._id.toString() !== authenticatedUserId) {
    throw new FriendshipServiceError('Você só pode consultar seus próprios pedidos.', 403);
  }

  return recipient.pendingFriends.map((sender) => ({
    id: sender._id.toString(),
    username: sender.username,
    status: sender.status ?? '',
    profilePhoto: sender.profilePhotoContentType
      ? `/api/users/${encodeURIComponent(sender.username)}/photo`
      : null,
  }));
};

export const getFriends = async (usernameInput: unknown): Promise<PendingFriendRequest[]> => {
  const username = normalizeUsername(usernameInput);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const user = await UserModel.findOne({ username })
    .select('_id friends')
    .populate<{
      friends: Array<{
        _id: Types.ObjectId;
        username: string;
        status: string;
        profilePhotoContentType?: string;
      }>;
    }>({
      path: 'friends',
      select: '_id username status +profilePhotoContentType',
    });

  if (!user) throw new FriendshipServiceError('Usuário não encontrado.', 404);

  return user.friends.map((friend) => ({
    id: friend._id.toString(),
    username: friend.username,
    status: friend.status ?? '',
    profilePhoto: friend.profilePhotoContentType
      ? `/api/users/${encodeURIComponent(friend.username)}/photo`
      : null,
  }));
};

export const acceptFriendRequest = async (
  senderUsername: unknown,
  recipientId: string,
): Promise<void> => {
  const username = normalizeUsername(senderUsername);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const [sender, recipient] = await Promise.all([
    UserModel.findOne({ username }).select('_id'),
    UserModel.findById(recipientId).select('_id'),
  ]);

  if (!sender) throw new FriendshipServiceError('Usuário não encontrado.', 404);
  if (!recipient) throw new FriendshipServiceError('Sessão inválida ou expirada.', 401);
  if (sender._id.equals(recipient._id)) {
    throw new FriendshipServiceError('Pedido de amizade inválido.', 400);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const hasPendingRequest = await UserModel.exists({
        _id: recipient._id,
        pendingFriends: sender._id,
      }).session(session);

      if (!hasPendingRequest) {
        throw new FriendshipServiceError('Este pedido de amizade não está pendente.', 404);
      }

      await UserModel.updateOne(
        { _id: recipient._id },
        {
          $pull: { pendingFriends: sender._id },
          $addToSet: { friends: sender._id },
        },
        { session },
      );
      await UserModel.updateOne(
        { _id: sender._id },
        { $addToSet: { friends: recipient._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
};

export const refuseFriendRequest = async (
  senderUsername: unknown,
  recipientId: string,
): Promise<void> => {
  const username = normalizeUsername(senderUsername);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const sender = await UserModel.findOne({ username }).select('_id');
  if (!sender) throw new FriendshipServiceError('Usuário não encontrado.', 404);

  const update = await UserModel.updateOne(
    { _id: recipientId, pendingFriends: sender._id },
    { $pull: { pendingFriends: sender._id } },
  );

  if (update.modifiedCount === 0) {
    throw new FriendshipServiceError('Este pedido de amizade não está pendente.', 404);
  }
};

export const removeFriend = async (
  friendUsernameInput: unknown,
  authenticatedUserId: string,
): Promise<void> => {
  const username = normalizeUsername(friendUsernameInput);
  if (!username) throw new FriendshipServiceError('Informe um usuário válido.', 400);

  const [authenticatedUser, friend] = await Promise.all([
    UserModel.findById(authenticatedUserId).select('_id friends'),
    UserModel.findOne({ username }).select('_id'),
  ]);

  if (!authenticatedUser) {
    throw new FriendshipServiceError('Sessão inválida ou expirada.', 401);
  }
  if (!friend) throw new FriendshipServiceError('Usuário não encontrado.', 404);
  if (authenticatedUser._id.equals(friend._id)) {
    throw new FriendshipServiceError('Você não pode remover a si mesmo.', 400);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const friendshipExists = await UserModel.exists({
        _id: authenticatedUser._id,
        friends: friend._id,
      }).session(session);

      if (!friendshipExists) {
        throw new FriendshipServiceError('Este usuário não está na sua lista de amigos.', 404);
      }

      await UserModel.updateOne(
        { _id: authenticatedUser._id },
        { $pull: { friends: friend._id } },
        { session },
      );
      await UserModel.updateOne(
        { _id: friend._id },
        { $pull: { friends: authenticatedUser._id } },
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
};
