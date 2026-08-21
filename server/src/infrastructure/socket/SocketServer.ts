import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // ─── Socket Authentication Middleware ────────────────────────────────
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      jwt.verify(token, env.JWT_ACCESS_SECRET, (err: any, decoded: any) => {
        if (err) return next(new Error('Authentication error: Invalid token'));
        
        socket.data.user = decoded; // Store decoded user info (userId, role)
        next();
      });
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id, user: socket.data.user?.id }, 'Client connected to socket');

      // Allow users to join their personal room
      socket.join(`user:${socket.data.user.id}`);

      // Optional: Client requests to join a specific parking lot room for live updates
      socket.on('join:lot', (lotId: string) => {
        // Future: Check if user is owner of lot or is viewing the lot
        socket.join(`lot:${lotId}`);
        logger.debug({ socketId: socket.id, lotId }, 'Socket joined lot room');
      });

      socket.on('leave:lot', (lotId: string) => {
        socket.leave(`lot:${lotId}`);
      });

      socket.on('disconnect', () => {
        logger.debug({ socketId: socket.id }, 'Client disconnected');
      });
    });

    logger.info('Socket.io server initialized');
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io not initialized. Call init() first.');
    }
    return this.io;
  }
}

export const socketManager = SocketManager.getInstance();
