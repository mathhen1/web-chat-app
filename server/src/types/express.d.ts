export {};

declare module 'node:http' {
  interface IncomingMessage {
    rawBody?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      rawBody?: string;
      auth?: {
        userId: string;
        username: string;
      };
    }
  }
}
