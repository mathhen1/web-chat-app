import type { NextFunction, RequestHandler, Response } from 'express';
import { getPublicUserByUsername, UserServiceError, type PublicUser } from '../services/user.service.js';

type UserApiResponse = { user?: PublicUser; error?: string };

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
