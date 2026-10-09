import mongoose from 'mongoose';
import { env } from './env.config';

export const connectDatabase = async (): Promise<typeof mongoose | null> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed gracefully');
  } catch (error) {
    console.error('[Database] Error closing MongoDB connection:', error);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected');
});
