import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next): void => {
  const statusCode =
    typeof error === 'object' && error !== null && 'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: statusCode >= 500 ? 'Erro interno do servidor.' : error instanceof Error ? error.message : 'Erro na requisição.',
  });
};
