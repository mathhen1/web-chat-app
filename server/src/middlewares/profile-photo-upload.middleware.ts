import multer from 'multer';
import type { RequestHandler } from 'express';

const uploadProfilePhoto = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
}).single('photo');

export const parseProfilePhotoUpload: RequestHandler = (request, response, next): void => {
  uploadProfilePhoto(request, response, (error: unknown): void => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'A imagem deve ter no máximo 5 MB.'
          : 'Envie apenas uma imagem no campo photo.';

      response.status(statusCode).json({ error: message });
      return;
    }

    next(error);
  });
};
