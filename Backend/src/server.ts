import { createApp } from './app';
import { env } from './config/env.config';
import { connectDatabase, disconnectDatabase } from './config/database.config';

const startServer = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 EduHub School ERP Backend running!`);
    console.log(`📡 Port: ${env.PORT}`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
    console.log(`🔐 Auth API: http://localhost:${env.PORT}/api/v1/auth`);
    console.log(`=========================================`);
  });

  // Handle graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});
