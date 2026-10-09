export function errorHandler(error, _request, response, _next) {
  const statusCode = Number.isInteger(error.status) ? error.status : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: statusCode >= 500 ? 'Erro interno do servidor.' : error.message,
  });
}
