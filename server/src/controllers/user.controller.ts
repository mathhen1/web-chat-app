import type { NextFunction, RequestHandler, Response } from 'express';
import {
  getPublicUserByUsername,
  getUserProfilePhoto,
  updateUserProfile,
  updateUserProfilePhoto,
  UserServiceError,
  type PublicUser,
} from '../services/user.service.js';

type UserApiResponse = { user?: PublicUser; error?: string };

type UserPhotoApiResponse = Buffer | { error?: string };
type ProfileEditBody = { username?: unknown; status?: unknown; password?: unknown };

export const getPublicUserHandler: RequestHandler<{ username: string }, UserApiResponse> = async (
  request,
  response: Response<UserApiResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await getPublicUserByUsername(request.params.username);
    response.status(200).json({ user });
  } catch (error: unknown) {
    if (error instanceof UserServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
};

const detectImageContentType = (image: Buffer): string | undefined => {
  if (
    image.length >= 8 &&
    image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return 'image/png';
  }

  if (image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    image.length >= 6 &&
    (image.toString('ascii', 0, 6) === 'GIF87a' || image.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif';
  }

  if (
    image.length >= 12 &&
    image.toString('ascii', 0, 4) === 'RIFF' &&
    image.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return undefined;
};

export const uploadProfilePhotoHandler: RequestHandler<
  { username: string },
  UserApiResponse
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const image = request.file?.buffer;
  if (!image) {
    response.status(400).json({ error: 'Envie uma imagem no campo photo.' });
    return;
  }

  const contentType = detectImageContentType(image);
  if (!contentType || contentType !== request.file?.mimetype) {
    response.status(400).json({ error: 'Envie uma imagem JPEG, PNG, GIF ou WebP válida.' });
    return;
  }

  try {
    const user = await updateUserProfilePhoto(
      request.params.username,
      request.auth.userId,
      image,
      contentType,
    );
    response.status(200).json({ user });
  } catch (error: unknown) {
    if (error instanceof UserServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const editUserProfileHandler: RequestHandler<
  { username: string },
  UserApiResponse,
  ProfileEditBody
> = async (request, response, next): Promise<void> => {
  if (!request.auth) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  const image = request.file?.buffer;
  const contentType = image ? detectImageContentType(image) : undefined;
  if (image && (!contentType || contentType !== request.file?.mimetype)) {
    response.status(400).json({ error: 'Envie uma imagem JPEG, PNG, GIF ou WebP válida.' });
    return;
  }

  try {
    const user = await updateUserProfile(
      request.params.username,
      request.auth.userId,
      request.body,
      image && contentType ? { buffer: image, contentType } : undefined,
    );
    response.status(200).json({ user });
  } catch (error: unknown) {
    if (error instanceof UserServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const getUserProfilePhotoHandler: RequestHandler<
  { username: string },
  UserPhotoApiResponse
> = async (
  request,
  response: Response<UserPhotoApiResponse>,
  next: NextFunction,
): Promise<void> => {
  try {
    const photo = await getUserProfilePhoto(request.params.username);
    response.type(photo.contentType).send(photo.buffer);
  } catch (error: unknown) {
    if (error instanceof UserServiceError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
};
