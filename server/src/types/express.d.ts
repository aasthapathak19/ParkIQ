import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'customer' | 'owner' | 'admin';
      };
      requestId?: string;
    }
  }
}

export {};
