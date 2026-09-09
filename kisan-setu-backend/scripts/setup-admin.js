import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAdmin() {
  const email = 'meiconic.here31@gmail.com';
  const password = 'iconic31';
  const name = 'Aditya Raj';
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

  console.log(`Setting up super admin account for ${email}...`);
  const passwordHash = await bcrypt.hash(password, rounds);

  // 1. Create or update the personal super admin account
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      adminProfile: {
        create: {
          prakhand: 'Headquarters',
          district: 'Patna',
          permissions: { all: true }
        }
      }
    },
    include: { adminProfile: true }
  });

  // Ensure adminProfile exists
  if (!user.adminProfile) {
    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        prakhand: 'Headquarters',
        district: 'Patna',
        permissions: { all: true }
      }
    });
  }

  console.log(`✓ Super Admin created/updated successfully: [${user.email}] (Role: ${user.role})`);

  // 2. Remove demo admin accounts so only the user is admin
  const demoEmails = ['demo.admin@kisansetu.local', 'demo.superadmin@kisansetu.local'];
  for (const demoEmail of demoEmails) {
    try {
      const deleted = await prisma.user.deleteMany({
        where: { email: demoEmail }
      });
      if (deleted.count > 0) {
        console.log(`✓ Removed old demo admin: ${demoEmail}`);
      }
    } catch (err) {
      console.warn(`Note on removing ${demoEmail}:`, err?.message || err);
    }
  }

  console.log('\n--- Admin Setup Complete ---');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     SUPER_ADMIN`);
}

setupAdmin()
  .catch((e) => {
    console.error('Failed to setup admin:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
