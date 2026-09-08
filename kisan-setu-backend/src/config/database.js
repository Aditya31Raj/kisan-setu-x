import { PrismaClient } from '@prisma/client';
import { startDatabase } from '../../scripts/db-control.js';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: ['error', 'warn']
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully.');
  } catch (error) {
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database server")) {
      logger.warn('PostgreSQL is not responding on port 5432. Attempting to start local PostgreSQL...');
      const started = await startDatabase();
      if (started) {
        try {
          await prisma.$connect();
          logger.info('Database connected successfully after auto-start.');
          return;
        } catch (retryErr) {
          error = retryErr;
        }
      }
      logger.error(
        '\n=======================================================\n' +
        " [DATABASE ERROR] Can't reach database server at localhost:5432\n" +
        ' Please make sure your PostgreSQL server is running.\n' +
        ' Tip: Run "npm run db:start" or use "start-kisan.bat".\n' +
        '=======================================================\n'
      );
    }
    throw error;
  }
}

export const disconnectDatabase = () => prisma.$disconnect();
