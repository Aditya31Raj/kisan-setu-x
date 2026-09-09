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

    // Ensure database tables exist (essential for new cloud databases on Render/Neon)
    try {
      await prisma.user.count();
      await prisma.auditLog.count();
      await prisma.refreshToken.count();

      // Ensure super admin account exists
      const adminEmail = process.env.ADMIN_EMAIL || 'meiconic.here31@gmail.com';
      const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!existingAdmin) {
        const bcrypt = (await import('bcrypt')).default;
        const hash = await bcrypt.hash(process.env.SEED_SUPER_ADMIN_PASSWORD || 'iconic31', 12);
        await prisma.user.create({
          data: {
            email: adminEmail,
            name: 'Aditya Raj',
            passwordHash: hash,
            role: 'SUPER_ADMIN',
            isActive: true,
            isVerified: true,
            adminProfile: {
              create: { prakhand: 'Headquarters', district: 'Patna' }
            }
          }
        });
        logger.info(`Super Admin initialized for ${adminEmail}`);
      }
    } catch (schemaErr) {
      if (schemaErr?.code === 'P2021' || schemaErr?.message?.includes('does not exist')) {
        logger.info('Database tables or columns missing. Automatically pushing Prisma schema to database...');
        try {
          const { execSync } = await import('node:child_process');
          execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
          logger.info('Prisma schema pushed successfully. Seeding initial data if needed...');
          try {
            execSync('node prisma/seed.js', { stdio: 'inherit' });
            logger.info('Database seeded successfully.');
          } catch (seedErr) {
            logger.warn('Seed script skipped: ' + seedErr.message);
          }
        } catch (pushErr) {
          logger.error('Failed to auto-push schema: ' + pushErr.message);
        }
      }
    }
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
