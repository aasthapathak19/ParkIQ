import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MONGODB_OPTIONS: mongoose.ConnectOptions = {
  dbName: env.MONGODB_DB_NAME,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info({ db: env.MONGODB_DB_NAME }, 'MongoDB connected');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });

    await mongoose.connect(env.MONGODB_URI, MONGODB_OPTIONS);
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
};

export const getDBStatus = (): { status: string; latencyMs?: number } => {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return { status: states[state] ?? 'unknown' };
};
