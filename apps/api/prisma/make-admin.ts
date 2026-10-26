// Makes an existing account an admin (and activates it). Use it once per environment,
// after the person has signed up normally:
//
//   npm run user:make-admin -w @quiz-nest/api -- someone@school.pk
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run user:make-admin -w @quiz-nest/api -- <email>');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN', status: 'ACTIVE' },
  });
  console.log(`${user.name} <${user.email}> is now an admin.`);
} catch {
  console.error(`No account found for ${email}. Sign up first, then run this again.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
